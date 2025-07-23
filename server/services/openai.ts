import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI;

function getOpenAI() {
  // Check for API key in environment first, then fallback to runtime config
  const apiKey = process.env.OPENAI_API_KEY || (global as any).apiConfig?.openaiApiKey;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please configure it in the settings panel.");
  }

  if (!openai || openai.apiKey !== apiKey) {
    openai = new OpenAI({ apiKey });
  }
  
  return openai;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
}

export interface DeductibilitySuggestion {
  deductibility: string;
  reasoning: string;
  confidence: number;
}

export interface ExpenseInsights {
  summary: string;
  topCategories: Array<{ category: string; percentage: number; amount: string }>;
  deductibilityBreakdown: Array<{ type: string; amount: string; count: number }>;
  recommendations: string[];
}

export async function categorizeExpense(description: string, vendor: string, amount: string): Promise<CategorySuggestion> {
  try {
    const prompt = `You are a business expense classification assistant. Based on the following expense details, suggest the most accurate category for tax bookkeeping purposes.

Vendor: ${vendor}
Description: ${description}
Amount: $${amount}

Respond with JSON in this exact format: { "category": "category_name", "confidence": confidence_score }

Available categories: Marketing, Office Supplies, Travel, Meals, Software, Education, Other

The confidence score should be between 0 and 1, where 1 is completely certain.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      category: result.category || "Other",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
  } catch (error) {
    console.error("OpenAI categorization error:", error);
    throw new Error("Failed to categorize expense with AI");
  }
}

export async function analyzeDeductibility(description: string, vendor: string, amount: string, category: string): Promise<DeductibilitySuggestion> {
  try {
    const prompt = `Classify this business expense based on its tax deductibility for a small business.

Vendor: ${vendor}
Description: ${description}
Amount: $${amount}
Category: ${category}

Respond with JSON in this exact format: { "deductibility": "deductibility_type", "reasoning": "brief_explanation", "confidence": confidence_score }

Available deductibility types: "Fully Deductible", "Partially Deductible", "Not Deductible"

The confidence score should be between 0 and 1. Provide a brief reasoning for your classification.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      deductibility: result.deductibility || "Not Deductible",
      reasoning: result.reasoning || "Unable to determine deductibility",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
  } catch (error) {
    console.error("OpenAI deductibility analysis error:", error);
    throw new Error("Failed to analyze deductibility with AI");
  }
}

export async function generateExpenseInsights(expenses: Array<{ category: string; deductibility: string; amount: string; description: string }>): Promise<ExpenseInsights> {
  try {
    const expenseData = expenses.map(e => 
      `Category: ${e.category}, Amount: $${e.amount}, Deductibility: ${e.deductibility}, Description: ${e.description}`
    ).join('\n');

    const prompt = `Based on the following categorized and analyzed business expenses, generate insights that help the business owner understand their spending patterns and tax deduction opportunities.

Expenses:
${expenseData}

Respond with JSON in this exact format:
{
  "summary": "one_paragraph_summary",
  "topCategories": [{"category": "category_name", "percentage": percentage, "amount": "total_amount"}],
  "deductibilityBreakdown": [{"type": "deductibility_type", "amount": "total_amount", "count": expense_count}],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Provide actionable insights about spending patterns, top deduction areas, and recommendations for better expense management.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || "Unable to generate insights",
      topCategories: result.topCategories || [],
      deductibilityBreakdown: result.deductibilityBreakdown || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("OpenAI insights generation error:", error);
    throw new Error("Failed to generate expense insights with AI");
  }
}
