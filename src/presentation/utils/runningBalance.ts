/**
 * Running-balance walk shared by the group ledger table and its PDF export.
 *
 * One implementation, two surfaces: the table and the PDF used to accumulate
 * their own `running` totals, which is how the PDF ended up page-scoped and
 * out of step with what the screen showed (BUG-28).
 */
export interface RunningBalanceRow<T> {
  item: T;
  /** Signed effect of this item on the balance. */
  delta: number;
  /** Balance immediately after this item. */
  balance: number;
}

/**
 * Walks `items` in chronological (oldest first) order and returns the balance
 * after each one.
 *
 * `endBalance` is the balance *after* the last item, so the opening balance is
 * derived by unwinding the slice's own deltas. A caller that passes a page
 * slice therefore gets a page-scoped opening; a caller that passes the whole
 * filtered ledger gets the real opening for that ledger.
 */
export function withRunningBalances<T>(
  items: readonly T[],
  deltaOf: (item: T) => number,
  endBalance: number,
): RunningBalanceRow<T>[] {
  let net = 0;
  for (const item of items) net += deltaOf(item);

  let running = endBalance - net;
  const rows: RunningBalanceRow<T>[] = [];
  for (const item of items) {
    const delta = deltaOf(item);
    running += delta;
    rows.push({ item, delta, balance: running });
  }
  return rows;
}
