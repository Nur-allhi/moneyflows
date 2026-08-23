import { describe, it, expect } from 'vitest';
import { Transaction } from '../../../core/domain/Transaction';
import {
  computeRunningBalances,
  sortLoanTransactions,
} from '../computeRunningBalances';

let seq = 0;
function tx(type: Transaction['type'], amount: number, date: string, createdAt?: string): Transaction {
  seq += 1;
  return new Transaction(`tx-${seq}`, type, 'desc', amount, 'member-1', date, undefined, undefined, undefined, undefined, {}, createdAt ?? date);
}

describe('sortLoanTransactions', () => {
  it('sorts by date then createdAt and drops non-loan types', () => {
    const input = [
      tx('lend', 7000, '2026-01-03'),
      tx('expense', 999, '2026-01-01'),
      tx('repay', 4000, '2026-01-05'),
      tx('lend', 5000, '2026-01-02'),
    ];
    const sorted = sortLoanTransactions(input);
    expect(sorted.map((t) => t.amount)).toEqual([5000, 7000, 4000]);
    expect(sorted.every((t) => t.type !== 'expense')).toBe(true);
  });

  it('breaks same-date ties by createdAt', () => {
    const a = tx('lend', 1, '2026-01-02', '2026-01-02T10:00:00Z');
    const b = tx('lend', 2, '2026-01-02', '2026-01-02T09:00:00Z');
    const sorted = sortLoanTransactions([a, b]);
    expect(sorted[0]?.amount).toBe(2);
    expect(sorted[1]?.amount).toBe(1);
  });

  it('never mutates the input array (callers rely on shared references)', () => {
    const input = [tx('lend', 7000, '2026-07-03'), tx('lend', 5000, '2026-07-01')];
    const before = input.map((t) => t.date);
    sortLoanTransactions(input);
    expect(input.map((t) => t.date)).toEqual(before);
  });
});

describe('computeRunningBalances', () => {
  it('accumulates credit then debit row by row (user scenario: 5000 -> 12000 -> 8000)', () => {
    const sorted = sortLoanTransactions([
      tx('lend', 5000, '2026-08-01'),
      tx('lend', 7000, '2026-08-02'),
      tx('repay', 4000, '2026-08-04'),
    ]);
    const balances = computeRunningBalances(sorted);
    expect([...balances.values()]).toEqual([5000, 12000, 8000]);
  });

  it('matches the real Home EXP ledger sequence (34230 -> ... -> 41230)', () => {
    const sorted = sortLoanTransactions([
      tx('lend', 34230, '2026-06-19T17:45:55.000Z'),
      tx('lend', 1000, '2026-06-21T17:50:13.000Z'),
      tx('lend', 9000, '2026-06-22T18:09:26.000Z'),
      tx('lend', 5000, '2026-06-30T18:11:21.000Z'),
      tx('lend', 5000, '2026-07-02T18:11:53.000Z'),
      tx('repay', 15000, '2026-07-11T15:14:49.000Z', '2026-07-11T15:14:49.000Z'),
      tx('lend', 2000, '2026-07-15T13:23:15.000Z', '2026-07-15T13:23:15.000Z'),
    ]);
    const balances = computeRunningBalances(sorted);
    expect([...balances.values()]).toEqual([
      34230, 35230, 44230, 49230, 54230, 39230, 41230,
    ]);
  });

  it('keeps negative intermediate balances for backdated repayments (no clamping)', () => {
    const sorted = sortLoanTransactions([
      tx('repay', 50000, '2026-05-04T17:53:06.000Z'),
      tx('lend', 150000, '2026-05-30T17:52:20.000Z'),
    ]);
    const balances = computeRunningBalances(sorted);
    expect([...balances.values()]).toEqual([-50000, 100000]);
  });

  it('treats unified loan_issue / loan_repayment like legacy lend / repay', () => {
    const sorted = sortLoanTransactions([
      tx('loan_issue', 3000, '2026-02-01'),
      tx('loan_repayment', 1000, '2026-02-02'),
    ]);
    const balances = computeRunningBalances(sorted);
    expect([...balances.values()]).toEqual([3000, 2000]);
  });

  it('returns an empty map for empty or non-loan input', () => {
    expect(computeRunningBalances([]).size).toBe(0);
    const onlyExpenses = [tx('expense', 100, '2026-01-01'), tx('income', 200, '2026-01-02')];
    expect(computeRunningBalances(onlyExpenses).size).toBe(0);
  });
});
