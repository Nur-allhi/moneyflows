import type { Transaction } from '../../core/domain/Transaction';
import type { OtherLedger, OtherLedgerEntry } from '../../otherLedgers/domain/types';
import {
  isLoanTransaction,
  LOAN_CREDIT_TYPES,
  LOAN_DEBIT_TYPES,
} from '../../loans/application/computeRunningBalances';
import {
  computeOtherRunningBalances,
  sortOtherEntries,
} from '../../otherLedgers/application/OtherLedgerService';
import type { LoanSection, MemberReportRow, OtherLedgerSection } from '../domain/types';

export interface SectionPeriod {
  start?: string;
  end?: string;
}

const dayOf = (iso: string): string => iso.slice(0, 10);

function inPeriod(day: string, period: SectionPeriod): boolean {
  if (period.start && day < period.start) return false;
  if (period.end && day > period.end) return false;
  return true;
}

const loanTypeLabel = (tx: Transaction): string =>
  LOAN_CREDIT_TYPES.has(tx.type) ? 'Lent' : 'Repayment';

/**
 * Groups the member's loan txs by counterparty (the non-member side).
 * Balances run over FULL group history; the period only trims display rows.
 * Display columns follow the MEMBER's cash flow: money out = debit, money
 * back in = credit (`isOutflow`). `running`/outstanding stays the receivable
 * (owed TO the member) regardless of display side.
 */
export function buildLoanSections(
  txs: Transaction[],
  nameOfAccount: (id: string) => string,
  memberAccountName: (tx: Transaction, counterpartyId: string) => string,
  isOutflow: (tx: Transaction) => boolean,
  period: SectionPeriod,
): LoanSection[] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of txs) {
    if (!isLoanTransaction(tx)) continue;
    const credit = LOAN_CREDIT_TYPES.has(tx.type);
    const key = (credit ? tx.destAccount : tx.sourceAccount) ?? 'external';
    const list = groups.get(key);
    if (list) list.push(tx);
    else groups.set(key, [tx]);
  }
  const sections: LoanSection[] = [];
  for (const [counterpartyId, group] of groups) {
    const sorted = group
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    let running = 0;
    let totalLent = 0;
    let totalRepaid = 0;
    const rows: MemberReportRow[] = [];
    for (const tx of sorted) {
      const lent = LOAN_CREDIT_TYPES.has(tx.type);
      const out = isOutflow(tx);
      if (lent) {
        running += tx.amount;
        totalLent += tx.amount;
      } else if (LOAN_DEBIT_TYPES.has(tx.type)) {
        running -= tx.amount;
        totalRepaid += tx.amount;
      }
      if (!inPeriod(dayOf(tx.date), period)) continue;
      rows.push({
        id: tx.id,
        date: tx.date,
        type: lent ? 'lend' : 'repay',
        typeLabel: loanTypeLabel(tx),
        description: tx.description,
        debit: out ? tx.amount : 0,
        credit: out ? 0 : tx.amount,
        runningBalance: running,
        counterpartyAccount: memberAccountName(tx, counterpartyId),
      });
    }
    sections.push({
      counterpartyAccountId: counterpartyId,
      counterpartyName:
        counterpartyId === 'external' ? 'External' : nameOfAccount(counterpartyId),
      totalLent,
      totalRepaid,
      outstanding: running,
      rows,
    });
  }
  return sections.sort((a, b) => a.counterpartyName.localeCompare(b.counterpartyName));
}

/**
 * Other-ledger registers owned by the member. Balances reuse the
 * OtherLedgerService running-balance util; the period trims display rows.
 */
export function buildOtherLedgerSections(
  ledgers: OtherLedger[],
  entriesByLedger: Map<string, OtherLedgerEntry[]>,
  period: SectionPeriod,
): OtherLedgerSection[] {
  const sections: OtherLedgerSection[] = [];
  for (const ledger of ledgers) {
    const entries = sortOtherEntries(
      (entriesByLedger.get(ledger.id) ?? []).filter((e) => !e.deletedAt),
    );
    const balanceMap = computeOtherRunningBalances(entries, ledger.openingBalance);
    const rows: MemberReportRow[] = [];
    let totalDebit = 0;
    let totalCredit = 0;
    for (const e of entries) {
      if (!inPeriod(e.date, period)) continue;
      totalDebit += e.debit;
      totalCredit += e.credit;
      rows.push({
        id: e.id,
        date: e.date,
        type: e.debit > 0 ? 'debit' : 'credit',
        typeLabel: e.debit > 0 ? 'Debit' : 'Credit',
        description: e.description,
        debit: e.debit,
        credit: e.credit,
        runningBalance: balanceMap.get(e.id) ?? 0,
        counterpartyAccount: '',
      });
    }
    const last = entries[entries.length - 1];
    sections.push({
      ledgerId: ledger.id,
      ledgerName: ledger.name,
      opening: ledger.openingBalance,
      totalDebit,
      totalCredit,
      closing: last ? (balanceMap.get(last.id) ?? ledger.openingBalance) : ledger.openingBalance,
      rows,
    });
  }
  return sections.sort((a, b) => a.ledgerName.localeCompare(b.ledgerName));
}
