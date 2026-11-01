import { describe, expect, it, vi } from 'vitest';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import type { Transaction } from '../../../core/domain/Transaction';
import { SQLiteDatabaseService } from '../../../infrastructure/database/SQLiteDatabaseService';
import { RepaymentEditError } from '../../domain/errors';
import { readAllocations, recordAllocations, totalAllocated } from '../../domain/repaymentAllocations';
import type { Loan } from '../../domain/types';
import { LoanService } from '../LoanService';

/**
 * BUG-47: a repayment records how it was split, so an edit can reverse exactly
 * what it applied and apply the new amount in its place. Before this, a
 * repayment the app wrote carried no link at all and an edit changed the ledger
 * while the loans stood still — silently, because there was nothing to reverse.
 *
 * The fixture is a realistic split: the allocation loop fills each loan before
 * moving on, so the earlier loans are exhausted and only the last one is partial.
 */
const loan = (overrides: Partial<Loan> & Pick<Loan, 'id'>): Loan => ({
  lenderAccountId: 'acct-bank', borrowerAccountId: 'acct-home', principal: 10000,
  outstanding: 0, status: 'settled', description: '', metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

/** 6,000 repaid: the older loan settled (4,000), the newer one left at 8,000. */
const older = () => loan({ id: 'loan-old', outstanding: 0, status: 'settled' });
const newer = () => loan({ id: 'loan-new', outstanding: 8000, status: 'active' });
const split = [{ loanId: 'loan-old', amount: 4000 }, { loanId: 'loan-new', amount: 2000 }];

class FakeLoanDb {
  loans: Loan[];
  saves: Loan[] = [];
  constructor(loans: Loan[]) { this.loans = loans; }
  async getLoanById(id: string): Promise<Loan | null> {
    return this.loans.find((l) => l.id === id) ?? null;
  }
  async getLoansByBorrower(borrowerAccountId: string): Promise<Loan[]> {
    return this.loans.filter((l) => l.borrowerAccountId === borrowerAccountId && !l.deletedAt);
  }
  async saveLoan(updated: Loan): Promise<void> {
    this.saves.push({ ...updated });
    const i = this.loans.findIndex((l) => l.id === updated.id);
    if (i >= 0) this.loans[i] = { ...updated };
  }
  get(id: string): Loan {
    return this.loans.find((l) => l.id === id)!;
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

describe('reading and writing a recorded split', () => {
  it('reads a split in the order it was applied', () => {
    expect(readAllocations({ allocations: split })).toEqual(split);
  });

  it('ignores anything malformed in the column', () => {
    expect(readAllocations(undefined)).toEqual([]);
    expect(readAllocations({ allocations: 'nope' })).toEqual([]);
    expect(readAllocations({
      allocations: [
        null, 'x', { loanId: 'a' }, { loanId: '', amount: 5 }, { loanId: 'b', amount: 0 },
        { loanId: 'c', amount: -1 }, { loanId: 'd', amount: Number.NaN }, { loanId: 'ok', amount: 7 },
      ],
    })).toEqual([{ loanId: 'ok', amount: 7 }]);
  });

  it('keeps the other metadata keys and clears an empty split', () => {
    expect(recordAllocations({ tags: ['x'] }, split)).toEqual({ tags: ['x'], allocations: split });
    expect(recordAllocations({ tags: ['x'], allocations: split }, [])).toEqual({ tags: ['x'] });
    expect(totalAllocated(split)).toBe(6000);
  });
});

describe('recording the split when a repayment is made (BUG-47)', () => {
  function repaymentService(loans: Loan[]) {
    const { service, loanDb } = makeService(loans);
    const saveTransaction = vi.fn(async (_tx: Transaction) => undefined);
    Object.assign(service, { db: { saveTransaction } });
    return { service, loanDb, saveTransaction };
  }

  it('records the split, and no single loan reference, when the money spills over', async () => {
    // 3,000 against an older loan owing 2,000 and a newer one owing 5,000.
    const { service, saveTransaction } = repaymentService([
      loan({ id: 'loan-old', principal: 2000, outstanding: 2000, status: 'active' }),
      loan({ id: 'loan-new', principal: 5000, outstanding: 5000, status: 'active', createdAt: '2026-02-01T00:00:00.000Z' }),
    ]);

    await service.recordRepayment({
      borrowerAccountId: 'acct-home', amount: 3000, description: 'Repay', date: '2026-03-05', memberId: 'm1',
    });

    const tx = saveTransaction.mock.calls[0]![0];
    expect(readAllocations(tx.metadata)).toEqual([
      { loanId: 'loan-old', amount: 2000 }, { loanId: 'loan-new', amount: 1000 },
    ]);
    expect(tx.loanRef).toBeUndefined();
  });

  it('records one loan as both the split and the loan reference', async () => {
    const { service, saveTransaction } = repaymentService([
      loan({ id: 'loan-only', outstanding: 5000, status: 'active' }),
    ]);

    await service.recordRepayment({
      borrowerAccountId: 'acct-home', amount: 3000, description: 'Repay', date: '2026-03-05', memberId: 'm1',
    });

    const tx = saveTransaction.mock.calls[0]![0];
    expect(readAllocations(tx.metadata)).toEqual([{ loanId: 'loan-only', amount: 3000 }]);
    expect(tx.loanRef).toBe('loan-only');
  });
});

describe('editing a repayment that recorded its split (BUG-47)', () => {
  it('reverses what it applied and pays the same loans first when cut', async () => {
    const { service, loanDb } = makeService([older(), newer()]);

    await service.syncLoanTransaction(undefined, 6000, 3000, 'repay', split);

    // The settled loan comes back to life for the amount it no longer holds, and
    // the smaller repayment pays it first — the order the split recorded.
    expect(loanDb.get('loan-old')).toMatchObject({ outstanding: 1000, status: 'active' });
    expect(loanDb.get('loan-new')).toMatchObject({ outstanding: 10000, status: 'active' });
  });

  it('re-applies a raise over the same loans and spills the rest over', async () => {
    const { service, loanDb } = makeService([older(), newer()]);

    await service.syncLoanTransaction(undefined, 6000, 9000, 'repay', split);

    expect(loanDb.get('loan-old')).toMatchObject({ outstanding: 0, status: 'settled' });
    expect(loanDb.get('loan-new')).toMatchObject({ outstanding: 5000, status: 'active' });
  });

  it('writes nothing when the amount did not change', async () => {
    const { service, loanDb } = makeService([older(), newer()]);

    await service.syncLoanTransaction(undefined, 6000, 6000, 'repay', split);

    expect(loanDb.saves).toEqual([]);
    expect(loanDb.get('loan-new')).toMatchObject({ outstanding: 8000 });
  });

  it('skips a loan that has been deleted since, without losing the rest', async () => {
    const { service, loanDb } = makeService([{ ...older(), deletedAt: '2026-03-01T00:00:00.000Z' }, newer()]);

    await service.syncLoanTransaction(undefined, 6000, 3000, 'repay', split);

    // The deleted loan is not given money back, and its share of the repayment
    // is not lost: the surviving loan takes the whole 3,000.
    expect(loanDb.get('loan-old')).toMatchObject({ outstanding: 0, deletedAt: expect.any(String) });
    expect(loanDb.get('loan-new')).toMatchObject({ outstanding: 7000 });
  });

  it('refuses a raise past what the borrower still owes, with the numbers to show', async () => {
    const { service, loanDb } = makeService([older(), newer()]);

    // The loans still owe 8,000 between them, and the repayment already accounts
    // for 6,000, so the ceiling is 14,000.
    await expect(service.assertRepaymentEditAllowed(undefined, 6000, 14001, split))
      .rejects.toMatchObject({ direction: 'increase', room: 8000, limit: 14000, scope: 'loans' });
    await expect(service.assertRepaymentEditAllowed(undefined, 6000, 14000, split)).resolves.toBeUndefined();
    await expect(service.assertRepaymentEditAllowed(undefined, 6000, 1000, split)).resolves.toBeUndefined();
    expect(loanDb.saves).toEqual([]);
  });

  it('refuses in the sync too, rather than booking money the loans cannot carry', async () => {
    const { service, loanDb } = makeService([older(), newer()]);

    await expect(service.syncLoanTransaction(undefined, 6000, 20000, 'repay', split))
      .rejects.toBeInstanceOf(RepaymentEditError);

    // The reversal is not persisted on the way to the refusal: the loans are
    // written only after the new amount has been applied.
    expect(loanDb.saves.some((l) => l.id === 'loan-old' && l.outstanding === 4000)).toBe(false);
  });
});
