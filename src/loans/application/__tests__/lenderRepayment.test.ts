import { describe, it, expect } from 'vitest';
import { Transaction } from '../../../core/domain/Transaction';
import type { Loan } from '../../domain/types';
import { LoanService } from '../LoanService';
import { buildLenderBreakdown } from '../../infrastructure/LoanDatabase';
import { SQLiteDatabaseService } from '../../../infrastructure/database/SQLiteDatabaseService';

const BORROWER = 'acct-home-exp';
const BUSINESS_CASH = 'acct-business-cash';
const BRAC_A = 'acct-brac-a';
const BRAC_B = 'acct-brac-b';

let seq = 0;
function loan(lender: string, principal: number, outstanding: number, created: string, status: Loan['status'] = 'active'): Loan {
  seq += 1;
  return {
    id: `loan-${seq}`, lenderAccountId: lender, borrowerAccountId: BORROWER,
    principal, outstanding, status, description: '', metadata: {},
    createdAt: created, updatedAt: created,
  };
}

/** Mirrors the demo DB: Home EXP borrowing from 3 lender accounts. */
function homeExpLoans(): Loan[] {
  return [
    loan(BUSINESS_CASH, 34230, 9230, '2026-07-04T17:45:55.210Z'),
    loan(BUSINESS_CASH, 1000, 1000, '2026-07-04T17:50:13.853Z'),
    loan(BRAC_A, 9000, 9000, '2026-07-04T18:09:26.176Z'),
    loan(BRAC_B, 10000, 10000, '2026-08-05T13:59:55.970Z'),
    loan(BRAC_B, 5000, 5000, '2026-08-22T17:30:58.292Z'),
  ];
}

class FakeLoanDb {
  loans: Loan[];
  constructor(loans: Loan[]) { this.loans = loans; }
  async getLoansByBorrower(id: string): Promise<Loan[]> {
    return this.loans.filter((l) => l.borrowerAccountId === id);
  }
  async saveLoan(updated: Loan): Promise<void> {
    const i = this.loans.findIndex((l) => l.id === updated.id);
    if (i >= 0) this.loans[i] = { ...updated };
  }
}

function makeService(loans: Loan[]): { service: LoanService; saved: Transaction[]; loanDb: FakeLoanDb } {
  const saved: Transaction[] = [];
  const db = Object.create(SQLiteDatabaseService.prototype) as SQLiteDatabaseService & {
    saveTransaction: (t: Transaction) => Promise<void>;
    getSqlJsDb: () => unknown;
  };
  db.saveTransaction = async (t: Transaction) => { saved.push(t); };
  db.getSqlJsDb = () => ({}) as never;
  const service = new LoanService(db);
  const loanDb = new FakeLoanDb(loans);
  Object.assign(service, { loanDb });
  return { service, saved, loanDb };
}

function repayParams(extra: Partial<{ lenderAccountId: string; destinationAccountId: string; amount: number }> = {}) {
  return {
    borrowerAccountId: BORROWER, amount: 5000, description: 'repayment',
    date: '2026-09-25', memberId: 'member-1', ...extra,
  };
}

describe('buildLenderBreakdown', () => {
  it('groups by lender account id with lent + outstanding, highest outstanding first', () => {
    const rows = buildLenderBreakdown(homeExpLoans());
    expect(rows.map((r) => r.lenderAccountId)).toEqual([BRAC_B, BUSINESS_CASH, BRAC_A]);
    expect(rows.find((r) => r.lenderAccountId === BUSINESS_CASH)).toMatchObject({
      lent: 35230, outstanding: 10230, activeLoanCount: 2,
    });
    expect(rows.find((r) => r.lenderAccountId === BRAC_B)).toMatchObject({
      lent: 15000, outstanding: 15000, activeLoanCount: 2,
    });
  });

  it('skips settled and fully-repaid loans', () => {
    const loans = [
      ...homeExpLoans(),
      loan(BRAC_A, 2000, 0, '2026-06-01T00:00:00.000Z', 'settled'),
      loan(BRAC_A, 3000, 0, '2026-06-02T00:00:00.000Z'),
    ];
    const rows = buildLenderBreakdown(loans);
    expect(rows.find((r) => r.lenderAccountId === BRAC_A)).toMatchObject({
      lent: 9000, outstanding: 9000, activeLoanCount: 1,
    });
  });
});

describe('LoanService.recordRepayment (targeted)', () => {
  it('repays only the chosen lender first and sends the tx to that lender', async () => {
    const { service, saved, loanDb } = makeService(homeExpLoans());
    await service.recordRepayment(repayParams({ lenderAccountId: BRAC_B, amount: 5000 }));

    const bracB = loanDb.loans.filter((l) => l.lenderAccountId === BRAC_B).map((l) => l.outstanding);
    expect(bracB).toEqual([5000, 5000]);
    expect(loanDb.loans.filter((l) => l.lenderAccountId !== BRAC_B).every((l) => l.status === 'active')).toBe(true);
    expect(loanDb.loans.find((l) => l.lenderAccountId === BUSINESS_CASH)?.outstanding).toBe(9230);

    expect(saved).toHaveLength(1);
    expect(saved[0]?.type).toBe('repay');
    expect(saved[0]?.sourceAccount).toBe(BORROWER);
    expect(saved[0]?.destAccount).toBe(BRAC_B);
    expect(saved[0]?.amount).toBe(5000);
  });

  it('spills over to other lenders when the amount exceeds the chosen lender balance', async () => {
    const { service, saved, loanDb } = makeService(homeExpLoans());
    await service.recordRepayment(repayParams({ lenderAccountId: BRAC_A, amount: 12000 }));

    const bracA = loanDb.loans.find((l) => l.lenderAccountId === BRAC_A);
    expect(bracA?.outstanding).toBe(0);
    expect(bracA?.status).toBe('settled');
    // Remainder 3000 hits the oldest other loan (Business Cash 9230).
    expect(loanDb.loans.find((l) => l.lenderAccountId === BUSINESS_CASH)?.outstanding).toBe(6230);
    expect(saved[0]?.destAccount).toBe(BRAC_A);
    expect(saved[0]?.amount).toBe(12000);
  });

  it('pays off one lender while crediting a different account', async () => {
    const { service, saved, loanDb } = makeService(homeExpLoans());
    await service.recordRepayment(repayParams({
      lenderAccountId: BRAC_B, destinationAccountId: 'acct-cash', amount: 5000,
    }));

    // Allocation hits only BRAC_B's loans...
    expect(loanDb.loans.filter((l) => l.lenderAccountId === BRAC_B).map((l) => l.outstanding)).toEqual([5000, 5000]);
    expect(loanDb.loans.find((l) => l.lenderAccountId === BUSINESS_CASH)?.outstanding).toBe(9230);
    // ...while the money is recorded against the credited account.
    expect(saved[0]?.destAccount).toBe('acct-cash');
    expect(saved[0]?.sourceAccount).toBe(BORROWER);
    expect(saved[0]?.amount).toBe(5000);
  });

  it('keeps FIFO across all loans when no lender is chosen', async () => {
    const { service, saved, loanDb } = makeService(homeExpLoans());
    await service.recordRepayment(repayParams({ amount: 1000 }));

    expect(loanDb.loans[0]?.outstanding).toBe(8230);
    expect(saved[0]?.destAccount).toBe(BUSINESS_CASH);
  });

  it('rejects a lender with no active loans for this borrower', async () => {
    const { service } = makeService(homeExpLoans());
    await expect(service.recordRepayment(repayParams({ lenderAccountId: 'acct-unknown' }))).rejects.toThrow(
      'No active loans found for the selected lender',
    );
  });
});
