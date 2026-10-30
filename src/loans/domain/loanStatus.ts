import type { Loan, LoanItemStatus } from './types';

/**
 * How one loan inside a stack should be described.
 *
 * `settled` and `active` come straight from the loan's own flag; the third
 * state covers a loan whose balance is fully back while its flag was never
 * flipped (only reachable from data written before the repayment paths kept the
 * flag up to date).
 *
 * It is named `repaid`, not `on_track`: the old name read as "repaying on
 * schedule" but meant the exact opposite — the money is all in (BUG-34).
 */
export function loanItemStatus(loan: Pick<Loan, 'status' | 'outstanding'>): LoanItemStatus {
  if (loan.status === 'settled') return 'settled';
  return loan.outstanding <= 0 ? 'repaid' : 'active';
}
