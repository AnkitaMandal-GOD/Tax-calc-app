import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, FileText, Settings, User } from "lucide-react";
import ExpenseForm from "@/components/expense-form";
import ExpenseTable from "@/components/expense-table";
import DashboardStats from "@/components/dashboard-stats";
import GoogleSheetsPanel from "@/components/google-sheets-panel";
import TaxSummary from "@/components/tax-summary";
import LoadingModal from "@/components/loading-modal";
import { useState } from "react";

export default function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">TaxFlow AI</h1>
                <p className="text-xs text-gray-500">Smart Business Expense Management</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#dashboard" className="text-gray-600 hover:text-primary transition-colors">Dashboard</a>
              <a href="#expenses" className="text-gray-600 hover:text-primary transition-colors">Expenses</a>
              <a href="#reports" className="text-gray-600 hover:text-primary transition-colors">Reports</a>
              <a href="#settings" className="text-gray-600 hover:text-primary transition-colors">Settings</a>
            </nav>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">John Smith</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <DashboardStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms and Controls */}
          <div className="lg:col-span-1 space-y-6">
            <ExpenseForm onProcessingChange={setIsProcessing} />
            <GoogleSheetsPanel />
          </div>

          {/* Right Column - Data and Analytics */}
          <div className="lg:col-span-2 space-y-6">
            <ExpenseTable />
            <TaxSummary />
          </div>
        </div>
      </div>

      <LoadingModal isOpen={isProcessing} />
    </div>
  );
}
