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

/**
 * Thrown when an edit to a repayment cannot be applied to its linked loan
 * (BUG-40) — the edit counterpart of `OverpaymentError`.
 *
 * A repayment stores one `loanRef` and no record of how the money was split
 * across loans, so an edit can only ever be applied to the linked loan, and only
 * within what that loan can absorb. The old code applied the delta and clamped,
 * so editing a repayment upward past what the loan still owed raised the amount
 * on the ledger while the loan stopped at zero — the same divergence BUG-23
 * fixed on the create side, reached through an ordinary edit instead.
 *
 * Like `OverpaymentError` it carries numbers rather than a sentence (no locale
 * or currency in the domain layer); the caller formats the message.
 */
export class RepaymentEditError extends Error {
  readonly direction: 'increase' | 'decrease';
  /** What the linked loan could absorb in that direction. */
  readonly room: number;
  /** The highest (increase) or lowest (decrease) amount the edit may be set to. */
  readonly limit: number;

  constructor(params: { direction: 'increase' | 'decrease'; room: number; limit: number }) {
    super(
      params.direction === 'increase'
        ? `Repayment cannot be raised: ${params.room} is all this loan still owes`
        : `Repayment cannot be lowered: only ${params.room} of this loan has been repaid`,
    );
    this.name = 'RepaymentEditError';
    this.direction = params.direction;
    this.room = params.room;
    this.limit = params.limit;
  }
}
