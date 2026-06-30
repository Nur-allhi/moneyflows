export interface LoanItem {
  id: string;
  fundingSource: string;
  amount: number;
  recovered: number;
  status: 'active' | 'on_track';
  date: string;
}

export interface LoanStack {
  debtorId: string;
  debtorName: string;
  totalOutstanding: number;
  totalRecovered: number;
  progressPercent: number;
  loans: LoanItem[];
}
