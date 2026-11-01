import { describe, it, expect } from 'vitest';
import { stackTotals } from '../../infrastructure/LoanDatabase';
import type { Loan, LoanStatus } from '../../domain/types';

function loan(principal: number, outstanding: number, status: LoanStatus = 'active'): Loan {
  return {
    id: `l-${principal}-${outstanding}-${status}`,
    lenderAccountId: 'lender',
    borrowerAccountId: 'borrower',
    principal,
    outstanding,
    status,
    description: '',
    metadata: {},
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00',
  };
}

describe('stackTotals (BUG-27)', () => {
  it('counts a fully repaid loan in the progress of a stack that has a new one', () => {
    // The reported defect: 1000 repaid, 1000 freshly issued used to read 0%.
    const totals = stackTotals([loan(1000, 0, 'settled'), loan(1000, 1000)]);

    expect(totals.totalAmount).toBe(2000);
    expect(totals.totalRecovered).toBe(1000);
    expect(totals.progressPercent).toBe(50);
  });

  it('reads 100% when every loan is settled', () => {
    const totals = stackTotals([loan(1000, 0, 'settled'), loan(500, 0, 'settled')]);

    expect(totals.totalAmount).toBe(1500);
    expect(totals.totalRecovered).toBe(1500);
    expect(totals.progressPercent).toBe(100);
  });

  it('reads 0% when nothing has been repaid', () => {
    const totals = stackTotals([loan(1000, 1000), loan(250, 250)]);

    expect(totals.totalRecovered).toBe(0);
    expect(totals.progressPercent).toBe(0);
  });

  it('adds partial repayments across loans', () => {
    // 600 of the first loan repaid, nothing of the second.
    const totals = stackTotals([loan(1000, 400), loan(500, 500)]);

    expect(totals.totalRecovered).toBe(600);
    expect(totals.progressPercent).toBe(40);
  });

  it('rounds to the nearest whole percent', () => {
    const totals = stackTotals([
      loan(1000, 0, 'settled'),
      loan(1000, 1000),
      loan(1000, 1000),
    ]);

    expect(totals.progressPercent).toBe(33);
  });

  it('returns zeros for an empty stack instead of dividing by zero', () => {
    expect(stackTotals([])).toEqual({ totalAmount: 0, totalRecovered: 0, progressPercent: 0 });
  });

  it('derives recovery per loan the same way the ledger row does', () => {
    // A settled row that still carries a residual is inconsistent data, but the
    // figure must still agree with the loan's own `recovered` (principal - outstanding).
    const totals = stackTotals([loan(1000, 200, 'settled')]);

    expect(totals.totalRecovered).toBe(800);
    expect(totals.progressPercent).toBe(80);
  });

  it('never exceeds 100% because outstanding is capped at the principal', () => {
    // LoanService clamps outstanding to <= principal, so recovery cannot overrun.
    const totals = stackTotals([loan(1000, 0, 'settled')]);

    expect(totals.progressPercent).toBe(100);
  });
});
