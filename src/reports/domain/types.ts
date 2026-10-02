/**
 * Member-wise whole report types (T-132).
 * T-133 will add optional `loans` / `otherLedgers` sections — the
 * `filter` flags already exist so renderers can gate on them.
 */
export interface MemberReportFilter {
  memberId: string;
  /** Inclusive YYYY-MM-DD. Omit for all time. */
  startDate?: string;
  /** Inclusive YYYY-MM-DD. Omit for all time. */
  endDate?: string;
  /** Convenience YYYY-MM — expanded to start/end like LoanService. */
  month?: string;
  /** Restrict to these accounts of the member. Omit for all. */
  accountIds?: string[];
  /** Include related loan ledgers (T-133). */
  includeLoans?: boolean;
  /** Include other-ledger registers (T-133). */
  includeOtherLedgers?: boolean;
}

export interface MemberReportRow {
  id: string;
  date: string;
  type: string;
  typeLabel: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  /** Name of the other account, '' for external income/expense. */
  counterpartyAccount: string;
}

export interface AccountSection {
  accountId: string;
  accountName: string;
  opening: number;
  totalDebit: number;
  totalCredit: number;
  closing: number;
  rows: MemberReportRow[];
}

export interface MemberReportSummary {
  memberId: string;
  memberName: string;
  periodStart: string;
  periodEnd: string;
  opening: number;
  totalDebit: number;
  totalCredit: number;
  closing: number;
  transactionCount: number;
  accountCount: number;
}

export interface MemberReport {
  summary: MemberReportSummary;
  accounts: AccountSection[];
  loans: LoanSection[];
  otherLedgers: OtherLedgerSection[];
  filter: MemberReportFilter;
  generatedAt: string;
}

export interface LoanSection {
  counterpartyAccountId: string;
  counterpartyName: string;
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  rows: MemberReportRow[];
}

export interface OtherLedgerSection {
  ledgerId: string;
  ledgerName: string;
  opening: number;
  totalDebit: number;
  totalCredit: number;
  closing: number;
  rows: MemberReportRow[];
}
