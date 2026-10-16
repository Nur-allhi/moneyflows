/**
 * Pure balance math (T-171): mirrors `applyBalanceChange` branching exactly so
 * `recalculateBalances()` can compute-first and UPDATE only rows that actually
 * differ — a no-change boot then writes nothing and the file hash stays put
 * (no phantom sync). Deterministic replay order keeps float sums identical.
 */

export interface BalanceTx {
  type: string;
  amount: number;
  source_account?: string | null;
  dest_account?: string | null;
}

const LOAN_TYPES = new Set([
  'loan_issue',
  'loan_repayment',
  'loan_received',
  'loan_paidback',
  'lend',
  'repay',
]);

export function computeBalances(transactions: BalanceTx[], accountIds: string[]): Map<string, number> {
  const balances = new Map<string, number>(accountIds.map((id) => [id, 0]));
  const add = (id: string | null | undefined, delta: number): void => {
    if (id) balances.set(id, (balances.get(id) ?? 0) + delta);
  };
  for (const t of transactions) {
    if (t.type === 'income' && t.dest_account) {
      add(t.dest_account, t.amount);
    } else if (t.type === 'expense' && t.source_account) {
      add(t.source_account, -t.amount);
    } else if (t.type === 'transfer') {
      if (t.source_account) add(t.source_account, -t.amount);
      if (t.dest_account) add(t.dest_account, t.amount);
    } else if (LOAN_TYPES.has(t.type)) {
      if (t.source_account) add(t.source_account, -t.amount);
      if (t.dest_account) add(t.dest_account, t.amount);
    }
    // Unknown types ignored — same as applyBalanceChange.
  }
  return balances;
}

/** Subset of current balances that differ from expected (empty = no-op boot). */
export function diffBalances(
  current: { id: string; balance: number }[],
  expected: Map<string, number>,
): { id: string; balance: number }[] {
  return current
    .filter(({ id, balance }) => (expected.get(id) ?? 0) !== balance)
    .map(({ id }) => ({ id, balance: expected.get(id) ?? 0 }));
}
