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

/** True only while there is money still out — a stale flag cannot keep a repaid loan "active". */
export function isLoanRunning(loan: Pick<Loan, 'status' | 'outstanding'>): boolean {
  return loanItemStatus(loan) === 'active';
}

/**
 * Split one borrower's loans into still-running and finished, and total what is
 * left to collect (BUG-45).
 *
 * The split used to test the loan row's own `status` flag while the derived
 * status above was computed beside it and consumed by nothing. Two answers to
 * "is this loan finished" meant a loan with 0 outstanding but a stale `active`
 * flag stayed on the Active list — its card reading "1 active" next to "0 BDT
 * outstanding" and a 100% progress bar.
 *
 * With one definition, the balance decides and the flag can only describe a
 * loan, never outvote its money. Not reachable through today's UI (every path
 * that zeroes `outstanding` also flips the flag); it is reachable from data
 * written before those paths kept it up to date — which is why the third state
 * exists at all.
 */
export function splitStack<T>(
  loans: Loan[],
  toItem: (loan: Loan) => T,
): { running: T[]; finished: T[]; totalOutstanding: number } {
  const running: T[] = [];
  const finished: T[] = [];
  let totalOutstanding = 0;
  for (const loan of loans) {
    if (isLoanRunning(loan)) {
      running.push(toItem(loan));
      totalOutstanding += Math.max(0, loan.outstanding);
    } else {
      finished.push(toItem(loan));
    }
  }
  return { running, finished, totalOutstanding };
}

/** True when the stack holds at least one loan and nothing is left to collect on any of them. */
export function stackIsSettled(loans: Pick<Loan, 'status' | 'outstanding'>[]): boolean {
  return loans.length > 0 && loans.every((loan) => !isLoanRunning(loan));
}
