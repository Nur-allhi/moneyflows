export type LoanDirection = 'given' | 'received';

export type LoanStatus = 'active' | 'settled';

export class Loan {
  constructor(
    public id: string,
    public direction: LoanDirection,
    public counterpartyId: string,
    public amount: number,
    public outstanding: number,
    public status: LoanStatus,
    public description: string = '',
    public metadata: Record<string, unknown> = {},
    public createdAt: string = new Date().toISOString(),
    public updatedAt: string = new Date().toISOString(),
    public deletedAt?: string,
  ) {}
}

export enum LoanDirectionLabel {
  given = 'Given',
  received = 'Received',
}

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
  stackType?: 'external' | 'internal';
}
