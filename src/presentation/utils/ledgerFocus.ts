/**
 * T-177: how many newest-first rows must be rendered for a transaction to be
 * visible. `oldestFirstIds` is the account's history in chronological order;
 * `currentLimit` is never lowered so the user's existing "Load more" progress
 * is preserved when the target happens to be recent.
 */
export function displayLimitForTransaction(
  oldestFirstIds: readonly string[],
  txId: string,
  currentLimit: number,
): number {
  const index = oldestFirstIds.indexOf(txId);
  if (index < 0) return currentLimit;
  return Math.max(currentLimit, oldestFirstIds.length - index);
}
