import { expenses, type Expense, type InsertExpense, type UpdateExpense } from "@shared/schema";

export interface IStorage {
  // Expense CRUD operations
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: UpdateExpense): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Bulk operations for Google Sheets sync
  bulkCreateExpenses(expenses: InsertExpense[]): Promise<Expense[]>;
  getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]>;
}

export class MemStorage implements IStorage {
  private expenses: Map<number, Expense>;
  private currentId: number;

  constructor() {
    this.expenses = new Map();
    this.currentId = 1;
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentId++;
    const now = new Date();
    const expense: Expense = {
      ...insertExpense,
      id,
      category: insertExpense.category || null,
      deductibility: insertExpense.deductibility || null,
      createdAt: now,
      updatedAt: now,
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, updateExpense: UpdateExpense): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;

    const updated: Expense = {
      ...existing,
      ...updateExpense,
      updatedAt: new Date(),
    };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async bulkCreateExpenses(insertExpenses: InsertExpense[]): Promise<Expense[]> {
    const created: Expense[] = [];
    for (const insertExpense of insertExpenses) {
      const expense = await this.createExpense(insertExpense);
      created.push(expense);
    }
    return created;
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const expenses = await this.getExpenses();
    return expenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
  }
}

export const storage = new MemStorage();
