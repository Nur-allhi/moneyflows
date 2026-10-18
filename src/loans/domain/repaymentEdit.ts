/**
 * How far an edit to a `repay` transaction may move its linked loan.
 *
 * A repayment transaction stores a single `loanRef` and nothing about how the
 * money was split: `recordRepayment` deliberately pays one loan first and lets
 * the remainder spill onto the borrower's older loans, and no record of that
 * split is kept. So when the amount is edited, the only loan we can reason about
 * is the linked one — and the honest limits follow from what that loan can
 * absorb:
 *
 * - raising the amount can add at most the loan's remaining `outstanding`,
 *   because anything more would have to be repaid against other loans and we no
 *   longer know which (BUG-40: the old code applied the delta, clamped at zero
 *   and let the ledger claim more was repaid than the loan record received);
 * - lowering it can hand back at most what has already been repaid
 *   (`principal - outstanding`), because more than that would un-repay money
 *   that was never repaid — leaving `outstanding` above `principal`, which every
 *   "recovered" figure then renders as a negative amount.
 *
 * Returns `null` when the edit fits. The numbers are returned rather than a
 * sentence: the domain has no access to the user's locale or currency (see
 * `OverpaymentError`).
 */
export interface RepaymentEditViolation {
  direction: 'increase' | 'decrease';
  /** What the loan could absorb in that direction. */
  room: number;
  /** The highest (increase) or lowest (decrease) amount this edit may be set to. */
  limit: number;
  /**
   * What `room` covers: one loan (the linked one — the only case the pure rule
   * below can judge) or the borrower's loans as a whole (a repayment that
   * recorded its split, BUG-47). Affects the wording of the message only.
   */
  scope?: 'loan' | 'loans';
}

export function repaymentEditViolation(
  loan: { principal: number; outstanding: number },
  oldAmount: number,
  newAmount: number,
): RepaymentEditViolation | null {
  const diff = newAmount - oldAmount;
  if (diff > 0) {
    if (diff > loan.outstanding) {
      return { direction: 'increase', room: loan.outstanding, limit: oldAmount + loan.outstanding };
    }
    return null;
  }
  const repaid = loan.principal - loan.outstanding;
  if (-diff > repaid) {
    return { direction: 'decrease', room: repaid, limit: oldAmount - repaid };
  }
  return null;
}
