import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Scan } from "lucide-react";
import type { InsertExpense } from "@shared/schema";

interface ExpenseFormProps {
  onProcessingChange: (processing: boolean) => void;
}

export default function ExpenseForm({ onProcessingChange }: ExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      vendor: "",
      amount: "",
      description: "",
      category: null,
      deductibility: null,
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      onProcessingChange(true);
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset({
        date: new Date().toISOString().split('T')[0],
        vendor: "",
        amount: "",
        description: "",
        category: null,
        deductibility: null,
      });
      toast({
        title: "Expense Added",
        description: "Your expense has been added and categorized with AI.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      onProcessingChange(false);
    },
  });

  const categorizeAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/expenses/categorize-all");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Categorization Complete",
        description: `Successfully categorized ${data.updated} expenses.`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to categorize expenses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertExpense) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Expense</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Adobe, Starbucks, FedEx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Brief description of the expense..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={createExpenseMutation.isPending}
            >
              <Plus className="w-5 h-5 mr-2" />
              {createExpenseMutation.isPending ? "Processing..." : "Add & Categorize with AI"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => categorizeAllMutation.mutate()}
              disabled={categorizeAllMutation.isPending}
            >
              <Scan className="w-4 h-4 mr-2 text-indigo-600" />
              {categorizeAllMutation.isPending ? "Processing..." : "Run Tax Write-off Analysis"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}