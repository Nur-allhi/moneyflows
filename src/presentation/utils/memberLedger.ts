import type { Transaction } from '../../core/domain/Transaction';

/**
 * Signed effect of a transaction on a *view* of accounts — either the single
 * selected account, or every account the member holds.
 *
 * Money arriving inside the view is positive, money leaving is negative, and a
 * transaction with both legs inside the view nets to zero: a transfer between
 * the member's own accounts moves money without changing what they hold.
 *
 * The rule this replaces compared `destAccount === selectedAccountId`, which is
 * always false when no account is selected — so in the "All Accounts" ledger
 * every transfer was booked as a debit *and* every received repayment
 * (`repay` / `loan_repayment` / `loan_received`, whose destination is the
 * member's account) too, and the running balance drifted (BUG-32). With one
 * account selected this reproduces the old per-type rule exactly.
 */
export function memberLedgerDelta(
  tx: Pick<Transaction, 'amount' | 'sourceAccount' | 'destAccount'>,
  accountIds: ReadonlySet<string>,
): number {
  const inDest = tx.destAccount != null && accountIds.has(tx.destAccount);
  const inSource = tx.sourceAccount != null && accountIds.has(tx.sourceAccount);
  // Both legs inside (internal) or neither (irrelevant to this view).
  if (inDest === inSource) return 0;
  return inDest ? tx.amount : -tx.amount;
}

export interface LedgerAmountCells {
  debit: string;
  credit: string;
}

/**
 * Debit / credit cell text for one row, derived from the same delta as the
 * running balance so the two can never disagree. A movement that stays inside
 * the view (delta 0) appears in both columns and leaves the balance untouched —
 * the convention the group ledger already uses for transfers between its own
 * accounts.
 */
export function ledgerAmountCells(delta: number, amountText: string): LedgerAmountCells {
  if (delta === 0) return { debit: amountText, credit: amountText };
  return delta > 0 ? { debit: '', credit: amountText } : { debit: amountText, credit: '' };
}
