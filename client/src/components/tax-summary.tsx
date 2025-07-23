import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileText, AlertCircle } from "lucide-react";
import type { Expense } from "@shared/schema";

interface ExpenseInsights {
  summary: string;
  topCategories: Array<{ category: string; percentage: number; amount: string }>;
  deductibilityBreakdown: Array<{ type: string; amount: string; count: number }>;
  recommendations: string[];
}

export default function TaxSummary() {
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: insights } = useQuery<ExpenseInsights>({
    queryKey: ["/api/expenses/insights"],
    enabled: expenses.length > 0,
  });

  // Calculate summary stats from expenses
  const fullyDeductible = expenses
    .filter(e => e.deductibility === 'Fully Deductible')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const partiallyDeductible = expenses
    .filter(e => e.deductibility === 'Partially Deductible')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const notDeductible = expenses
    .filter(e => e.deductibility === 'Not Deductible')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const fullyDeductibleCount = expenses.filter(e => e.deductibility === 'Fully Deductible').length;
  const partiallyDeductibleCount = expenses.filter(e => e.deductibility === 'Partially Deductible').length;
  const notDeductibleCount = expenses.filter(e => e.deductibility === 'Not Deductible').length;

  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Write-off Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Fully Deductible</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">
              ${fullyDeductible.toFixed(2)}
            </p>
            <p className="text-xs text-green-700">{fullyDeductibleCount} expenses</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-800">Partially Deductible</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-2">
              ${partiallyDeductible.toFixed(2)}
            </p>
            <p className="text-xs text-yellow-700">{partiallyDeductibleCount} expenses</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-800">Not Deductible</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-2">
              ${notDeductible.toFixed(2)}
            </p>
            <p className="text-xs text-red-700">{notDeductibleCount} expenses</p>
          </div>
        </div>

        {insights && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              AI Insights
            </h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              {insights.summary}
            </p>
            
            {insights.recommendations.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-semibold text-blue-900 mb-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Recommendations
                </h5>
                <ul className="text-xs text-blue-800 space-y-1">
                  {insights.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {expenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No expenses to analyze yet.</p>
            <p className="text-xs mt-1">Add some expenses to see your tax write-off summary.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}