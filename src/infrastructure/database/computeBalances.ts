/**
 * Pure balance math (T-171): mirrors `applyBalanceChange` branching exactly so
 * `recalculateBalances()` can compute-first and UPDATE only rows that actually
 * differ — a no-change boot then writes nothing and the file hash stays put
 * (no phantom sync). Deterministic replay order keeps float sums identical.
 *
 * The per-transaction sign rule itself lives in `core/domain/balanceEffect`
 * (BUG-21), so the dashboard's metric trends and this reconciliation cannot
 * disagree about which account moved.
 */
import { balanceEffects } from '../../core/domain/balanceEffect';

export interface BalanceTx {
  type: string;
  amount: number;
  source_account?: string | null;
  dest_account?: string | null;
}

export function computeBalances(transactions: BalanceTx[], accountIds: string[]): Map<string, number> {
  const balances = new Map<string, number>(accountIds.map((id) => [id, 0]));
  for (const t of transactions) {
    const effects = balanceEffects({
      type: t.type,
      amount: t.amount,
      sourceAccount: t.source_account,
      destAccount: t.dest_account,
    });
    for (const { accountId, delta } of effects) {
      balances.set(accountId, (balances.get(accountId) ?? 0) + delta);
    }
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
