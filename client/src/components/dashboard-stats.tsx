import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, DollarSign, FileCheck, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalExpenses: string;
  deductibleAmount: string;
  categorizedCount: number;
  aiAccuracy: string;
}

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Expenses",
      value: `$${stats?.totalExpenses || "0.00"}`,
      icon: BarChart3,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Deductible Amount",
      value: `$${stats?.deductibleAmount || "0.00"}`,
      icon: DollarSign,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Categorized",
      value: stats?.categorizedCount || 0,
      icon: FileCheck,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "AI Accuracy",
      value: stats?.aiAccuracy || "0%",
      icon: Lightbulb,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}