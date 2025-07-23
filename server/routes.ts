import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, updateExpenseSchema } from "@shared/schema";
import { categorizeExpense, analyzeDeductibility, generateExpenseInsights } from "./services/openai";
import { googleSheetsService } from "./services/googleSheets";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Get single expense
  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  // Create new expense with AI categorization
  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      
      // Create expense first
      const expense = await storage.createExpense(validatedData);
      
      // If no category provided, use AI to categorize
      if (!expense.category) {
        try {
          const categorySuggestion = await categorizeExpense(
            expense.description,
            expense.vendor,
            expense.amount
          );
          
          const deductibilitySuggestion = await analyzeDeductibility(
            expense.description,
            expense.vendor,
            expense.amount,
            categorySuggestion.category
          );

          const updatedExpense = await storage.updateExpense(expense.id, {
            category: categorySuggestion.category,
            deductibility: deductibilitySuggestion.deductibility,
          });

          res.json(updatedExpense || expense);
        } catch (aiError) {
          console.error("AI processing failed:", aiError);
          res.json(expense); // Return expense without AI categorization
        }
      } else {
        res.json(expense);
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Update expense
  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateExpenseSchema.parse(req.body);
      
      const updatedExpense = await storage.updateExpense(id, validatedData);
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Bulk AI categorization for existing expenses
  app.post("/api/expenses/categorize-all", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      const uncategorized = expenses.filter(e => !e.category || !e.deductibility);
      
      const updated = [];
      for (const expense of uncategorized) {
        try {
          const categorySuggestion = await categorizeExpense(
            expense.description,
            expense.vendor,
            expense.amount
          );
          
          const deductibilitySuggestion = await analyzeDeductibility(
            expense.description,
            expense.vendor,
            expense.amount,
            categorySuggestion.category
          );

          const updatedExpense = await storage.updateExpense(expense.id, {
            category: categorySuggestion.category,
            deductibility: deductibilitySuggestion.deductibility,
          });

          if (updatedExpense) updated.push(updatedExpense);
        } catch (aiError) {
          console.error(`AI processing failed for expense ${expense.id}:`, aiError);
        }
      }

      res.json({ 
        message: `Successfully categorized ${updated.length} expenses`,
        updated: updated.length 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to categorize expenses" });
    }
  });

  // Generate AI insights
  app.get("/api/expenses/insights", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      const expenseData = expenses.map(e => ({
        category: e.category || 'Uncategorized',
        deductibility: e.deductibility || 'Unknown',
        amount: e.amount,
        description: e.description
      }));

      const insights = await generateExpenseInsights(expenseData);
      res.json(insights);
    } catch (error) {
      console.error("Insights generation error:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Google Sheets sync endpoints
  app.post("/api/sheets/sync", async (req, res) => {
    try {
      // Read from Google Sheets
      const sheetExpenses = await googleSheetsService.readExpenses();
      
      // Import into local storage
      const imported = await storage.bulkCreateExpenses(sheetExpenses);
      
      res.json({
        message: `Successfully imported ${imported.length} expenses from Google Sheets`,
        imported: imported.length
      });
    } catch (error) {
      console.error("Google Sheets sync error:", error);
      res.status(500).json({ message: "Failed to sync with Google Sheets" });
    }
  });

  app.post("/api/sheets/export", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      await googleSheetsService.writeExpenses(expenses);
      
      res.json({
        message: `Successfully exported ${expenses.length} expenses to Google Sheets`,
        exported: expenses.length
      });
    } catch (error) {
      console.error("Google Sheets export error:", error);
      res.status(500).json({ message: "Failed to export to Google Sheets" });
    }
  });

  app.get("/api/sheets/status", async (req, res) => {
    try {
      const connected = await googleSheetsService.testConnection();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  // Export to CSV
  app.get("/api/expenses/export/csv", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      
      const csv = [
        'Date,Vendor,Amount,Description,Category,Deductibility',
        ...expenses.map(e => 
          `${e.date},"${e.vendor}",${e.amount},"${e.description}","${e.category || ''}","${e.deductibility || ''}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const deductibleAmount = expenses
        .filter(e => e.deductibility === 'Fully Deductible')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const categorizedCount = expenses.filter(e => e.category).length;
      const aiAccuracy = categorizedCount > 0 ? Math.round((categorizedCount / expenses.length) * 100) : 0;

      res.json({
        totalExpenses: totalExpenses.toFixed(2),
        deductibleAmount: deductibleAmount.toFixed(2),
        categorizedCount,
        aiAccuracy: `${aiAccuracy}%`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
