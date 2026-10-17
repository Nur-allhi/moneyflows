/**
 * Thrown when a repayment would exceed what the borrower still owes (BUG-23).
 *
 * A repayment used to be accepted at any size: the allocation loop clamped each
 * loan at `Math.min(remaining, outstanding)` and then threw the leftover away,
 * while the transaction was written with the full amount — so the ledger claimed
 * more was repaid than any loan record ever received. The service now refuses
 * the whole repayment instead of booking a figure it cannot apply.
 *
 * It carries the numbers rather than a finished sentence, because the service
 * has no access to the user's locale or currency (the app keeps no hardcoded
 * currency — see `docs/DESIGN_IDENTITY.md` §16). The caller formats the message.
 */
export class OverpaymentError extends Error {
  /** The amount the user tried to repay. */
  readonly attempted: number;
  /** The most that could legitimately be repaid, i.e. total active outstanding. */
  readonly maximum: number;

  constructor(attempted: number, maximum: number) {
    super(`Repayment of ${attempted} exceeds the ${maximum} still outstanding`);
    this.name = 'OverpaymentError';
    this.attempted = attempted;
    this.maximum = maximum;
  }
}
