import { Injectable } from '@nestjs/common';
import path from 'path';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
@Injectable()
export class ReportsService {
  // Store states as a dict: { [id]: { accounts, yearly, fs } }
  // in real application, we'll want to use a database, or Reddis
  private statesDict: Record<
    string,
    { accounts: string; yearly: string; fs: string }
  > = {};

  // Cache for parsed CSV files: { [filename]: string[][] }
  private parsedFilesCache: Record<string, string[][]> = {};

  /**
   * Get the current state of the report export for a specific ID.
   * @param id The ID of the report export.
   * @returns The current state of the report export.
   */
  state(id: string) {
    return (
      this.statesDict[id] || { accounts: 'idle', yearly: 'idle', fs: 'idle' }
    );
  }

  startReportExport(): string {
    const id = uuidv4();
    this.statesDict[id] = {
      accounts: 'pending',
      yearly: 'pending',
      fs: 'pending',
    };

    this.handleExportParallel(id);

    return id;
  }

  // Helper to get parsed lines for a file, with caching
  private async getParsedFileLines(
    tmpDir: string,
    file: string,
  ): Promise<string[][]> {
    if (this.parsedFilesCache[file]) {
      return this.parsedFilesCache[file];
    }
    const filePath = path.join(tmpDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').map((line) => line.split(','));
    this.parsedFilesCache[file] = lines;
    return lines;
  }

  async handleExportParallel(id: string) {
    // Run all report steps in parallel
    await Promise.all([
      await this.accounts(id),

      await this.yearly(id),

      await this.fs(id),
    ]);
  }

  async accounts(id: string) {
    this.statesDict[id].accounts = 'starting';
    const startA = performance.now();
    const tmpDir = 'tmp';
    const outputFile = 'out/accounts.csv';
    const accountBalances: Record<string, number> = {};

    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.endsWith('.csv')) {
        const lines = await this.getParsedFileLines(tmpDir, file);
        for (const line of lines) {
          const [, account, , debit, credit] = line;
          if (!accountBalances[account]) {
            accountBalances[account] = 0;
          }
          accountBalances[account] +=
            parseFloat(debit || '0') - parseFloat(credit || '0');
        }
      }
    }

    const output = ['Account,Balance'];
    for (const [account, balance] of Object.entries(accountBalances)) {
      output.push(`${account},${balance.toFixed(2)}`);
    }

    await fs.writeFile(outputFile, output.join('\n'));
    this.statesDict[id].accounts =
      `finished in ${((performance.now() - startA) / 1000).toFixed(2)}`;
  }

  async yearly(id: string) {
    this.statesDict[id].yearly = 'starting';
    const startY = performance.now();
    const tmpDir = 'tmp';
    const outputFile = 'out/yearly.csv';
    const cashByYear: Record<string, number> = {};

    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.endsWith('.csv') && file !== 'yearly.csv') {
        const lines = await this.getParsedFileLines(tmpDir, file);
        for (const line of lines) {
          const [date, account, , debit, credit] = line;
          if (account === 'Cash') {
            const year = new Date(date).getFullYear();
            if (!cashByYear[year]) cashByYear[year] = 0;
            cashByYear[year] +=
              parseFloat(debit || '0') - parseFloat(credit || '0');
          }
        }
      }
    }

    const output = ['Financial Year,Cash Balance'];
    Object.keys(cashByYear)
      .sort()
      .forEach((year) => {
        output.push(`${year},${cashByYear[year].toFixed(2)}`);
      });

    await fs.writeFile(outputFile, output.join('\n'));
    this.statesDict[id].yearly =
      `finished in ${((performance.now() - startY) / 1000).toFixed(2)}`;
  }

  async fs(id: string) {
    this.statesDict[id].fs = 'starting';
    const startF = performance.now();
    const tmpDir = 'tmp';
    const outputFile = 'out/fs.csv';
    const categories = {
      'Income Statement': {
        Revenues: ['Sales Revenue'],
        Expenses: [
          'Cost of Goods Sold',
          'Salaries Expense',
          'Rent Expense',
          'Utilities Expense',
          'Interest Expense',
          'Tax Expense',
        ],
      },
      'Balance Sheet': {
        Assets: [
          'Cash',
          'Accounts Receivable',
          'Inventory',
          'Fixed Assets',
          'Prepaid Expenses',
        ],
        Liabilities: [
          'Accounts Payable',
          'Loan Payable',
          'Sales Tax Payable',
          'Accrued Liabilities',
          'Unearned Revenue',
          'Dividends Payable',
        ],
        Equity: ['Common Stock', 'Retained Earnings'],
      },
    };

    const balances: Record<string, number> = {};
    for (const section of Object.values(categories)) {
      for (const group of Object.values(section)) {
        for (const account of group) {
          balances[account] = 0;
        }
      }
    }

    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.endsWith('.csv') && file !== 'fs.csv') {
        const lines = await this.getParsedFileLines(tmpDir, file);
        for (const line of lines) {
          const [, account, , debit, credit] = line;
          if (balances.hasOwnProperty(account)) {
            balances[account] +=
              parseFloat(debit || '0') - parseFloat(credit || '0');
          }
        }
      }
    }

    const output: string[] = [];
    output.push('Basic Financial Statement', '', 'Income Statement');
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const account of categories['Income Statement']['Revenues']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalRevenue += value;
    }

    for (const account of categories['Income Statement']['Expenses']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalExpenses += value;
    }

    output.push(
      `Net Income,${(totalRevenue - totalExpenses).toFixed(2)}`,
      '',
      'Balance Sheet',
      'Assets',
    );
    let totalAssets = 0;
    for (const account of categories['Balance Sheet']['Assets']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalAssets += value;
    }
    output.push(`Total Assets,${totalAssets.toFixed(2)}`, '', 'Liabilities');
    let totalLiabilities = 0;
    for (const account of categories['Balance Sheet']['Liabilities']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalLiabilities += value;
    }
    output.push(
      `Total Liabilities,${totalLiabilities.toFixed(2)}`,
      '',
      'Equity',
    );
    let totalEquity = 0;
    for (const account of categories['Balance Sheet']['Equity']) {
      const value = balances[account] || 0;
      output.push(`${account},${value.toFixed(2)}`);
      totalEquity += value;
    }

    const netIncome = totalRevenue - totalExpenses;
    output.push(`Retained Earnings (Net Income),${netIncome.toFixed(2)}`);
    totalEquity += netIncome;
    output.push(`Total Equity,${totalEquity.toFixed(2)}`, '');
    output.push(
      `Assets = Liabilities + Equity, ${totalAssets.toFixed(2)} = ${(totalLiabilities + totalEquity).toFixed(2)}`,
    );

    await fs.writeFile(outputFile, output.join('\n'));
    this.statesDict[id].fs =
      `finished in ${((performance.now() - startF) / 1000).toFixed(2)}`;
  }
}
