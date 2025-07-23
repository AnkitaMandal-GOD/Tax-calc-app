import { google } from 'googleapis';
import type { Expense, InsertExpense } from '@shared/schema';

const sheets = google.sheets('v4');

interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
}

export class GoogleSheetsService {
  private auth: any;
  private config: GoogleSheetsConfig;

  constructor() {
    // Initialize with default configuration
    this.config = {
      spreadsheetId: '',
      range: 'Sheet1!A:F', // Date, Vendor, Amount, Description, Category, Deductibility
    };
  }

  private getCredentials() {
    // Only use user-provided credentials from settings panel
    const clientEmail = (global as any).apiConfig?.googleClientEmail;
    const privateKey = (global as any).apiConfig?.googlePrivateKey?.replace(/\\n/g, '\n');
    const spreadsheetId = (global as any).apiConfig?.googleSheetsId;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      throw new Error("Google Sheets credentials not configured. Please configure them in the settings panel.");
    }

    this.config.spreadsheetId = spreadsheetId;
    
    // Create auth for this request
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return { clientEmail, privateKey, spreadsheetId };
  }

  async readExpenses(): Promise<InsertExpense[]> {
    try {
      this.getCredentials();
      const authClient = await this.auth.getClient();
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: this.config.spreadsheetId,
        range: this.config.range,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return []; // No data or just headers

      // Skip header row and convert to expenses
      return rows.slice(1).map((row: string[]) => ({
        date: row[0] || '',
        vendor: row[1] || '',
        amount: row[2] || '0',
        description: row[3] || '',
        category: row[4] || null,
        deductibility: row[5] || null,
      })).filter(expense => expense.date && expense.vendor && expense.amount);
    } catch (error) {
      console.error('Google Sheets read error:', error);
      throw new Error('Failed to read expenses from Google Sheets');
    }
  }

  async writeExpenses(expenses: Expense[]): Promise<void> {
    try {
      this.getCredentials();
      const authClient = await this.auth.getClient();
      
      // Prepare data with headers
      const values = [
        ['Date', 'Vendor', 'Amount', 'Description', 'Category', 'Deductibility'],
        ...expenses.map(expense => [
          expense.date,
          expense.vendor,
          expense.amount,
          expense.description,
          expense.category || '',
          expense.deductibility || '',
        ])
      ];

      await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId: this.config.spreadsheetId,
        range: this.config.range,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    } catch (error) {
      console.error('Google Sheets write error:', error);
      throw new Error('Failed to write expenses to Google Sheets');
    }
  }

  async appendExpense(expense: Expense): Promise<void> {
    try {
      this.getCredentials();
      const authClient = await this.auth.getClient();
      
      const values = [[
        expense.date,
        expense.vendor,
        expense.amount,
        expense.description,
        expense.category || '',
        expense.deductibility || '',
      ]];

      await sheets.spreadsheets.values.append({
        auth: authClient,
        spreadsheetId: this.config.spreadsheetId,
        range: this.config.range,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    } catch (error) {
      console.error('Google Sheets append error:', error);
      throw new Error('Failed to append expense to Google Sheets');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.getCredentials();
      const authClient = await this.auth.getClient();
      await sheets.spreadsheets.get({
        auth: authClient,
        spreadsheetId: this.config.spreadsheetId,
      });
      return true;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
