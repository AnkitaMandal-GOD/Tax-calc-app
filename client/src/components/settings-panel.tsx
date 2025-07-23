import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Key, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useState } from "react";

const apiConfigSchema = z.object({
  openaiApiKey: z.string().min(1, "OpenAI API key is required").startsWith("sk-", "Invalid OpenAI API key format"),
  googleClientEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  googlePrivateKey: z.string().optional().or(z.literal("")),
  googleSheetsId: z.string().optional().or(z.literal("")),
});

type ApiConfig = z.infer<typeof apiConfigSchema>;

interface ConnectionStatus {
  openai: boolean;
  googleSheets: boolean;
}

export default function SettingsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showKeys, setShowKeys] = useState(false);

  const form = useForm<ApiConfig>({
    resolver: zodResolver(apiConfigSchema),
    defaultValues: {
      openaiApiKey: "",
      googleClientEmail: "",
      googlePrivateKey: "",
      googleSheetsId: "",
    },
  });

  const { data: status } = useQuery<ConnectionStatus>({
    queryKey: ["/api/connections/status"],
    refetchInterval: 10000, // Check every 10 seconds
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: ApiConfig) => {
      const response = await apiRequest("POST", "/api/connections/configure", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sheets/status"] });
      toast({
        title: "Configuration Saved",
        description: "Your API credentials have been saved securely.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Configuration Failed",
        description: "Failed to save configuration. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (service: "openai" | "googlesheets") => {
      const response = await apiRequest("POST", `/api/connections/test/${service}`);
      return response.json();
    },
    onSuccess: (data, service) => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/status"] });
      toast({
        title: "Connection Test",
        description: data.success 
          ? `${service === "openai" ? "OpenAI" : "Google Sheets"} connection successful!`
          : `${service === "openai" ? "OpenAI" : "Google Sheets"} connection failed: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const onSubmit = (data: ApiConfig) => {
    saveConfigMutation.mutate(data);
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>API Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`flex items-center justify-between p-3 border rounded-md ${
            status?.openai ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <Key className={`w-4 h-4 ${status?.openai ? 'text-green-600' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${
                status?.openai ? 'text-green-800' : 'text-red-800'
              }`}>
                OpenAI API
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {status?.openai ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs ${
                status?.openai ? 'text-green-600' : 'text-red-600'
              }`}>
                {status?.openai ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>

          <div className={`flex items-center justify-between p-3 border rounded-md ${
            status?.googleSheets ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className={`w-4 h-4 ${status?.googleSheets ? 'text-green-600' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${
                status?.googleSheets ? 'text-green-800' : 'text-red-800'
              }`}>
                Google Sheets
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {status?.googleSheets ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs ${
                status?.googleSheets ? 'text-green-600' : 'text-red-600'
              }`}>
                {status?.googleSheets ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* OpenAI Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>OpenAI Configuration</span>
              </h3>
              
              <FormField
                control={form.control}
                name="openaiApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OpenAI API Key</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type={showKeys ? "text" : "password"}
                          placeholder="sk-..."
                          {...field}
                        />
                        <p className="text-xs text-gray-500">
                          Get your API key from{" "}
                          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            OpenAI Platform
                          </a>
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testConnectionMutation.mutate("openai")}
                disabled={testConnectionMutation.isPending || !form.watch("openaiApiKey")}
              >
                Test OpenAI Connection
              </Button>
            </div>

            {/* Google Sheets Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Google Sheets Configuration</span>
              </h3>

              <FormField
                control={form.control}
                name="googleClientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Account Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your-service-account@project.iam.gserviceaccount.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="googlePrivateKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Private Key</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                        className="resize-none font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="googleSheetsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Sheets ID</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                          {...field}
                        />
                        <p className="text-xs text-gray-500">
                          Copy the ID from your Google Sheets URL (between /d/ and /edit)
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => testConnectionMutation.mutate("googlesheets")}
                disabled={testConnectionMutation.isPending || !form.watch("googleClientEmail")}
              >
                Test Google Sheets Connection
              </Button>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowKeys(!showKeys)}
              >
                {showKeys ? "Hide" : "Show"} API Keys
              </Button>

              <Button
                type="submit"
                disabled={saveConfigMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Setup Help</h4>
          <div className="text-xs text-blue-800 space-y-2">
            <p><strong>OpenAI:</strong> Required for AI expense categorization and tax analysis</p>
            <p><strong>Google Sheets:</strong> Optional - enables importing/exporting expense data</p>
            <p><strong>Security:</strong> All credentials are encrypted and stored securely in your browser session</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}