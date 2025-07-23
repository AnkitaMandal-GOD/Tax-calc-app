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
    // Initialize with service account credentials or OAuth
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.config = {
      spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
      range: 'Sheet1!A:F', // Date, Vendor, Amount, Description, Category, Deductibility
    };
  }

  async readExpenses(): Promise<InsertExpense[]> {
    try {
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
