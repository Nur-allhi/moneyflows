/**
 * How one repayment was split across the borrower's loans (BUG-47).
 *
 * A repayment pays the chosen lender's loans first (oldest first) and lets the
 * remainder spill onto the borrower's older loans, so it can touch several loans
 * at once — while a transaction can store only one `loanRef`. The split was
 * computed, applied, and then thrown away, which left an edit with nothing to
 * reverse: the amount on the ledger changed and the loans did not. It is now
 * recorded on the transaction itself, in the `metadata` column that already
 * exists, so no schema migration is needed and old rows keep working (they simply
 * carry no split, and are handled the way BUG-40 describes).
 *
 * The numbers are stored in the order they were applied, which is what lets an
 * edit re-apply a smaller amount to the same loans rather than rearranging them.
 */
export interface LoanAllocation {
  loanId: string;
  amount: number;
}

/**
 * The split recorded on a transaction, ignoring anything malformed — the column
 * is free-form JSON that a hand-edited or corrupt database could shape any way.
 */
export function readAllocations(metadata: Record<string, unknown> | undefined): LoanAllocation[] {
  const raw = metadata?.allocations;
  if (!Array.isArray(raw)) return [];
  const allocations: LoanAllocation[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const { loanId, amount } = entry as { loanId?: unknown; amount?: unknown };
    if (typeof loanId !== 'string' || loanId === '') continue;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) continue;
    allocations.push({ loanId, amount });
  }
  return allocations;
}

/** Records the split in transaction metadata, leaving every other key alone. */
export function recordAllocations(
  metadata: Record<string, unknown> | undefined,
  allocations: LoanAllocation[],
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) };
  if (allocations.length === 0) delete next.allocations;
  else next.allocations = allocations.map((a) => ({ loanId: a.loanId, amount: a.amount }));
  return next;
}

/** What this transaction applied to loans in total, i.e. its own amount. */
export function totalAllocated(allocations: LoanAllocation[]): number {
  return allocations.reduce((sum, a) => sum + a.amount, 0);
}
