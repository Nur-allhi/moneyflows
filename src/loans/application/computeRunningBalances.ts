import type { Transaction } from '../../core/domain/Transaction';

export const LOAN_CREDIT_TYPES = new Set(['lend', 'loan_issue']);
export const LOAN_DEBIT_TYPES = new Set(['repay', 'loan_repayment']);
const LOAN_TYPES = new Set([...LOAN_CREDIT_TYPES, ...LOAN_DEBIT_TYPES]);

export function isLoanTransaction(tx: Transaction): boolean {
  return LOAN_TYPES.has(tx.type);
}

export function sortLoanTransactions(txs: readonly Transaction[]): Transaction[] {
  return [...txs]
    .filter(isLoanTransaction)
    .sort((a, b) => {
      const c = a.date.localeCompare(b.date);
      if (c !== 0) return c;
      return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    });
}

/**
 * Walks the FULL sorted history and returns the cumulative balance after each
 * transaction (credit adds, debit subtracts). No clamping — negatives are real.
 * Display layers decide how to render them.
 */
export function computeRunningBalances(sortedTxs: readonly Transaction[]): Map<string, number> {
  const balances = new Map<string, number>();
  let running = 0;
  for (const tx of sortedTxs) {
    if (!isLoanTransaction(tx)) continue;
    if (LOAN_CREDIT_TYPES.has(tx.type)) running += tx.amount;
    if (LOAN_DEBIT_TYPES.has(tx.type)) running -= tx.amount;
    balances.set(tx.id, running);
  }
  return balances;
}
