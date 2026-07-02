export type LoanStatus = 'active' | 'settled';

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
