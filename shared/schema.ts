import { pgTable, text, serial, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  vendor: text("vendor").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }),
  deductibility: varchar("deductibility", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Validation schemas for categories and deductibility
export const expenseCategories = [
  "Marketing",
  "Office Supplies", 
  "Travel",
  "Meals",
  "Software",
  "Education",
  "Other"
] as const;

export const deductibilityOptions = [
  "Fully Deductible",
  "Partially Deductible", 
  "Not Deductible"
] as const;

export type ExpenseCategory = typeof expenseCategories[number];
export type DeductibilityOption = typeof deductibilityOptions[number];
