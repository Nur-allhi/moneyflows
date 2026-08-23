import { describe, it, expect } from 'vitest';
import { Transaction } from '../../../core/domain/Transaction';
import { Account } from '../../../core/domain/Account';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import { LoanService } from '../LoanService';
import { SQLiteDatabaseService } from '../../../infrastructure/database/SQLiteDatabaseService';

function tx(id: string, type: Transaction['type'], amount: number, date: string): Transaction {
  return new Transaction(id, type, `desc-${id}`, amount, 'member-1', date);
}

const LENDER = new Account('acct-lender', 'member-1', 'Brac Bank', 'bank', 0);
const BORROWER = new Account('acct-borrower', '', 'Home EXP', 'cash', 0);

/**
 * generateReport only reads via this.db (getTransactions/getAccounts) — never
 * this.loanDb. Build a minimal instance that passes the constructor's
 * instanceof guard without booting sql.js WASM.
 */
function makeService(transactions: Transaction[]): LoanService {
  const db = Object.create(SQLiteDatabaseService.prototype) as SQLiteDatabaseService &
    Pick<IDatabaseService, 'getTransactions' | 'getAccounts'> & { getSqlJsDb: () => unknown };
  db.getTransactions = async () => transactions;
  db.getAccounts = async () => [LENDER, BORROWER];
  db.getSqlJsDb = () => ({}) as never;
  return new LoanService(db);
}

describe('LoanService.generateReport', () => {
  it('computes row balances from FULL history even when display is filtered to one type', async () => {
    const transactions = [
      tx('t1', 'lend', 5000, '2026-08-01'),
      tx('t2', 'lend', 7000, '2026-08-02'),
      tx('t3', 'repay', 4000, '2026-08-04'),
    ];
    const service = makeService(transactions);

    const report = await service.generateReport({ type: 'lend' });

    expect(report.rows.map((r) => r.id)).toEqual(['t1', 't2']);
    expect(report.rows.map((r) => r.runningBalance)).toEqual([5000, 12000]);
    expect(report.summary.totalLent).toBe(12000);
    expect(report.summary.totalRepaid).toBe(4000);
    expect(report.summary.outstanding).toBe(8000);
  });

  it('reports negative outstanding when repayments exceed lends (no clamp)', async () => {
    const transactions = [
      tx('t1', 'lend', 1000, '2026-08-01'),
      tx('t2', 'repay', 3000, '2026-08-02'),
    ];
    const service = makeService(transactions);

    const report = await service.generateReport({});

    expect(report.rows.map((r) => r.runningBalance)).toEqual([1000, -2000]);
    expect(report.summary.outstanding).toBe(-2000);
  });
});
