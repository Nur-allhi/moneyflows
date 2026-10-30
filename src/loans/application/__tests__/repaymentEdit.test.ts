import { describe, expect, it } from 'vitest';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import { SQLiteDatabaseService } from '../../../infrastructure/database/SQLiteDatabaseService';
import type { Loan } from '../../domain/types';
import { RepaymentEditError } from '../../domain/errors';
import { repaymentEditViolation } from '../../domain/repaymentEdit';
import { LoanService } from '../LoanService';

/**
 * One loan, `repaid` of it already back: principal 10,000 with 6,000 outstanding
 * means 4,000 has been repaid, so an edit may add at most 6,000 or hand back at
 * most 4,000 (BUG-40).
 */
const loan = (overrides: Partial<Loan> = {}): Loan => ({
  id: 'loan-1', lenderAccountId: 'acct-bank', borrowerAccountId: 'acct-home',
  principal: 10000, outstanding: 6000, status: 'active', description: '',
  metadata: {}, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

class FakeLoanDb {
  loans: Loan[];
  saves: Loan[] = [];
  constructor(loans: Loan[]) { this.loans = loans; }
  async getLoanById(id: string): Promise<Loan | null> {
    return this.loans.find((l) => l.id === id) ?? null;
  }
  async saveLoan(updated: Loan): Promise<void> {
    this.saves.push({ ...updated });
    const i = this.loans.findIndex((l) => l.id === updated.id);
    if (i >= 0) this.loans[i] = { ...updated };
  }
}

function makeService(loans: Loan[]): { service: LoanService; loanDb: FakeLoanDb } {
  const db = Object.create(SQLiteDatabaseService.prototype) as SQLiteDatabaseService & { getSqlJsDb: () => unknown };
  db.getSqlJsDb = () => ({}) as never;
  const service = new LoanService(db as unknown as IDatabaseService);
  const loanDb = new FakeLoanDb(loans);
  Object.assign(service, { loanDb });
  return { service, loanDb };
}

describe('repaymentEditViolation', () => {
  it('allows a raise up to what the loan still owes, boundary included', () => {
    expect(repaymentEditViolation(loan(), 2000, 3000)).toBeNull();
    expect(repaymentEditViolation(loan(), 2000, 8000)).toBeNull(); // +6,000 = outstanding
  });

  it('refuses a raise past what the loan still owes and reports the ceiling', () => {
    expect(repaymentEditViolation(loan(), 2000, 8001)).toEqual({
      direction: 'increase', room: 6000, limit: 8000,
    });
  });

  it('refuses any raise on a loan with nothing left to repay', () => {
    // A settled loan has no room at all: the repayment cannot be raised at all.
    expect(repaymentEditViolation(loan({ outstanding: 0, status: 'settled' }), 2000, 2001)).toEqual({
      direction: 'increase', room: 0, limit: 2000,
    });
  });

  it('allows a cut up to what has actually been repaid, boundary included', () => {
    expect(repaymentEditViolation(loan(), 5000, 4000)).toBeNull();
    expect(repaymentEditViolation(loan(), 5000, 1000)).toBeNull(); // -4,000 = repaid so far
  });

  it('refuses a cut that would un-repay money that was never repaid', () => {
    // More than 4,000 back would leave outstanding above principal, which every
    // "recovered" figure then renders as a negative amount.
    expect(repaymentEditViolation(loan(), 5000, 999)).toEqual({
      direction: 'decrease', room: 4000, limit: 1000,
    });
  });

  it('says nothing about an unchanged amount', () => {
    expect(repaymentEditViolation(loan(), 2000, 2000)).toBeNull();
  });
});

describe('LoanService repayment edits (BUG-40)', () => {
  it('refuses an over-raise and leaves the loan untouched', async () => {
    const { service, loanDb } = makeService([loan()]);

    await expect(service.syncLoanTransaction('loan-1', 2000, 8001, 'repay'))
      .rejects.toBeInstanceOf(RepaymentEditError);

    expect(loanDb.saves).toEqual([]);
    expect(loanDb.loans[0]!.outstanding).toBe(6000);
  });

  it('applies a raise the loan can absorb', async () => {
    const { service, loanDb } = makeService([loan()]);

    await service.syncLoanTransaction('loan-1', 2000, 3000, 'repay');

    expect(loanDb.loans[0]!.outstanding).toBe(5000);
    expect(loanDb.loans[0]!.status).toBe('active');
  });

  it('settles the loan when a raise brings it to zero', async () => {
    const { service, loanDb } = makeService([loan()]);

    await service.syncLoanTransaction('loan-1', 2000, 8000, 'repay');

    expect(loanDb.loans[0]!.outstanding).toBe(0);
    expect(loanDb.loans[0]!.status).toBe('settled');
  });

  it('refuses an over-cut and leaves the loan untouched', async () => {
    const { service, loanDb } = makeService([loan()]);

    await expect(service.syncLoanTransaction('loan-1', 5000, 999, 'repay'))
      .rejects.toBeInstanceOf(RepaymentEditError);

    expect(loanDb.saves).toEqual([]);
    expect(loanDb.loans[0]!.outstanding).toBe(6000);
  });

  it('lets the edit modal ask first, carrying the numbers to format', async () => {
    const { service, loanDb } = makeService([loan()]);

    await expect(service.assertRepaymentEditAllowed('loan-1', 2000, 8001))
      .rejects.toMatchObject({ direction: 'increase', room: 6000, limit: 8000 });

    // Nothing was written by the check itself — it is a question, not a step.
    expect(loanDb.saves).toEqual([]);

    await expect(service.assertRepaymentEditAllowed('loan-1', 5000, 999))
      .rejects.toMatchObject({ direction: 'decrease', room: 4000, limit: 1000 });
  });

  it('passes an edit that fits, and stays quiet without a loan to check', async () => {
    const { service, loanDb } = makeService([loan()]);

    await expect(service.assertRepaymentEditAllowed('loan-1', 2000, 3000)).resolves.toBeUndefined();
    await expect(service.assertRepaymentEditAllowed(undefined, 2000, 99999)).resolves.toBeUndefined();
    await expect(service.assertRepaymentEditAllowed('gone', 2000, 99999)).resolves.toBeUndefined();
    expect(loanDb.saves).toEqual([]);
  });

  it('still syncs lending edits, which move principal and outstanding together', async () => {
    const { service, loanDb } = makeService([loan()]);

    await service.syncLoanTransaction('loan-1', 10000, 12000, 'lend');

    expect(loanDb.loans[0]!.principal).toBe(12000);
    expect(loanDb.loans[0]!.outstanding).toBe(8000);
  });
});
