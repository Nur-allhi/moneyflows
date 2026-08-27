export type OwnerType = 'member' | 'external';

export interface OtherLedger {
  id: string;
  name: string;
  ownerType: OwnerType;
  ownerMemberId?: string;
  ownerName?: string;
  startingDate: string; // YYYY-MM-DD
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface OtherLedgerEntry {
  id: string;
  ledgerId: string;
  date: string; // YYYY-MM-DD
  description: string;
  debit: number;
  credit: number;
  balance: number; // computed running balance
  linkedTransactionId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
