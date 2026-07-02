export type LoanStatus = 'active' | 'settled';

export interface LoanReportFilter {
  borrowerAccountId?: string;
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'lend' | 'repay';
  month?: string;
}

export interface LoanReportRow {
  id: string;
  date: string;
  type: 'lend' | 'repay';
  typeLabel: string;
  description: string;
  lenderAccount: string;
  borrowerAccount: string;
  amount: number;
  runningBalance: number;
}

export interface LoanReportSummary {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  transactionCount: number;
  lenderName: string;
  borrowerName: string;
}

export interface LoanReport {
  rows: LoanReportRow[];
  summary: LoanReportSummary;
  filter: LoanReportFilter;
  generatedAt: string;
}

export interface Loan {
  id: string;
  lenderAccountId: string;
  borrowerAccountId: string;
  principal: number;
  outstanding: number;
  status: LoanStatus;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LoanItem {
  id: string;
  fundingSource: string;
  amount: number;
  recovered: number;
  status: 'active' | 'on_track' | 'settled';
  date: string;
}

export interface LoanStack {
  debtorId: string;
  debtorName: string;
  totalOutstanding: number;
  totalRecovered: number;
  progressPercent: number;
  settledCount: number;
  activeCount: number;
  loans: LoanItem[];
  stackType?: 'external' | 'internal';
  isSettled?: boolean;
}
