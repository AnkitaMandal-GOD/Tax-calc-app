import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, RefreshCw, Upload, Download } from "lucide-react";

interface SheetsStatus {
  connected: boolean;
}

export default function GoogleSheetsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status } = useQuery<SheetsStatus>({
    queryKey: ["/api/sheets/status"],
    refetchInterval: 30000, // Check status every 30 seconds
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sheets/sync");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sync Complete",
        description: `Imported ${data.imported} expenses from Google Sheets.`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Google Sheets. Please check your connection.",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sheets/export");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export Complete",
        description: `Exported ${data.exported} expenses to Google Sheets.`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export to Google Sheets. Please check your connection.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Google Sheets Integration</h3>
        
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-3 border rounded-md ${
            status?.connected 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-5 h-5 ${
                status?.connected ? 'text-green-600' : 'text-red-500'
              }`} />
              <span className={`text-sm font-medium ${
                status?.connected ? 'text-green-800' : 'text-red-800'
              }`}>
                {status?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {status?.connected && (
              <span className="text-xs text-green-600">
                Last sync: 2 min ago
              </span>
            )}
          </div>

          {status?.connected && (
            <div className="text-sm text-gray-600">
              <p className="font-medium">Sheet: <span className="text-gray-900">Business Expenses 2024</span></p>
              <p className="text-xs mt-1">Columns: Date, Vendor, Amount, Description, Category, Deductibility</p>
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !status?.connected}
            >
              <Download className="w-4 h-4 mr-2 text-green-600" />
              {syncMutation.isPending ? "Syncing..." : "Import from Google Sheets"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending || !status?.connected}
            >
              <Upload className="w-4 h-4 mr-2 text-blue-600" />
              {exportMutation.isPending ? "Exporting..." : "Export to Google Sheets"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
              disabled={!status?.connected}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconnect Google Sheets
            </Button>
          </div>

          {!status?.connected && (
            <div className="text-xs text-gray-500 mt-2">
              <p>Configure Google Sheets API credentials in environment variables:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>GOOGLE_CLIENT_EMAIL</li>
                <li>GOOGLE_PRIVATE_KEY</li>
                <li>GOOGLE_SHEETS_ID</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}