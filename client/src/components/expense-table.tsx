import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Expense } from "@shared/schema";

export default function ExpenseTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully deleted.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/expenses/export/csv");
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Your expenses have been exported to CSV.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export expenses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCategoryBadgeClass = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800";
    
    const categoryMap: Record<string, string> = {
      "Marketing": "bg-pink-100 text-pink-800",
      "Office Supplies": "bg-blue-100 text-blue-800",
      "Travel": "bg-indigo-100 text-indigo-800",
      "Meals": "bg-yellow-100 text-yellow-800",
      "Software": "bg-purple-100 text-purple-800",
      "Education": "bg-green-100 text-green-800",
      "Other": "bg-gray-100 text-gray-800",
    };
    
    return categoryMap[category] || "bg-gray-100 text-gray-800";
  };

  const getDeductibilityBadgeClass = (deductibility: string | null) => {
    if (!deductibility) return "bg-gray-100 text-gray-800";
    
    const deductibilityMap: Record<string, string> = {
      "Fully Deductible": "bg-green-100 text-green-800",
      "Partially Deductible": "bg-yellow-100 text-yellow-800",
      "Not Deductible": "bg-red-100 text-red-800",
    };
    
    return deductibilityMap[deductibility] || "bg-gray-100 text-gray-800";
  };

  const filteredExpenses = expenses.filter(expense => 
    categoryFilter === "All Categories" || expense.category === categoryFilter
  );

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading expenses...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          <div className="flex items-center space-x-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Meals">Meals</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCSVMutation.mutate()}
              disabled={exportCSVMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportCSVMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Deductibility</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No expenses found. Add your first expense to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.vendor}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {expense.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900">
                      ${expense.amount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {expense.category ? (
                          <Badge className={getCategoryBadgeClass(expense.category)}>
                            {expense.category}
                          </Badge>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                            <span className="text-xs text-yellow-600">Processing...</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {expense.deductibility ? (
                        <Badge className={getDeductibilityBadgeClass(expense.deductibility)}>
                          {expense.deductibility}
                        </Badge>
                      ) : (
                        <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={!expense.category}
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          disabled={deleteExpenseMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredExpenses.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}