import { describe, expect, it } from 'vitest';
import { accountMovement, loanMovement, metricTrend } from '../metricTrend';

/**
 * BUG-21: the four dashboard chips used to compute "vs last month" two
 * different ways — assets/cash with this month's family-wide net, banks/loans
 * with last month's — so an expense paid from a bank moved the Cash-in-Hand
 * baseline it never touched, and a loan stock was compared against an
 * income/expense net. One definition now: each metric against its own value at
 * the end of last month.
 */
describe('metricTrend (BUG-21)', () => {
  it('derives the baseline from the metric’s own movement, not a family net', () => {
    // 8,000 now, 2,000 of it arrived since the end of last month.
    expect(metricTrend(8000, 2000)).toEqual({ base: 6000, delta: 2000, percent: (2000 / 6000) * 100 });
  });

  it('keeps the delta meaningful when a percentage would not be', () => {
    // A balance that was zero: "+5,000", not "infinity %".
    expect(metricTrend(5000, 5000)).toEqual({ base: 0, delta: 5000, percent: null });
    // A negative baseline (an overdrawn account) cannot carry a percentage.
    expect(metricTrend(500, 1500)).toMatchObject({ base: -1000, delta: 1500, percent: null });
    // Falling below zero reads the same way.
    expect(metricTrend(-200, -200)).toMatchObject({ base: 0, delta: -200, percent: null });
  });

  it('reports a fall as a negative delta and percent', () => {
    const trend = metricTrend(7500, -2500);
    expect(trend.delta).toBe(-2500);
    expect(trend.percent).toBeCloseTo(-25);
  });
});

describe('accountMovement — which accounts a transaction moved', () => {
  const cash = new Set(['cash-1']);
  const bank = new Set(['bank-1']);
  const both = new Set(['cash-1', 'bank-1']);

  it('credits the destination of income and debits the source of an expense', () => {
    expect(accountMovement([{ type: 'income', amount: 500, destAccount: 'cash-1' }], cash)).toBe(500);
    expect(accountMovement([{ type: 'expense', amount: 500, sourceAccount: 'bank-1' }], bank)).toBe(-500);
  });

  it('moves both sides of a transfer and of a loan', () => {
    const transfer = [{ type: 'transfer', amount: 300, sourceAccount: 'bank-1', destAccount: 'cash-1' }];
    expect(accountMovement(transfer, cash)).toBe(300);
    expect(accountMovement(transfer, bank)).toBe(-300);
    expect(accountMovement(transfer, both)).toBe(0);

    const lend = [{ type: 'lend', amount: 900, sourceAccount: 'bank-1', destAccount: 'debtor-1' }];
    expect(accountMovement(lend, bank)).toBe(-900);
    const repay = [{ type: 'repay', amount: 400, sourceAccount: 'debtor-1', destAccount: 'bank-1' }];
    expect(accountMovement(repay, bank)).toBe(400);
  });

  it('ignores accounts outside the set, and types it cannot attribute', () => {
    expect(accountMovement([{ type: 'expense', amount: 100, sourceAccount: 'bank-1' }], cash)).toBe(0);
    expect(accountMovement([{ type: 'expense', amount: 100 }], both)).toBe(0);
    expect(accountMovement([{ type: 'mystery', amount: 100, sourceAccount: 'cash-1' }], cash)).toBe(0);
  });

  it('does not let money the metric never touched change its baseline', () => {
    // The bug itself: a 5,000 expense from the bank moved cash's baseline too.
    const thisMonth = [
      { type: 'expense' as const, amount: 5000, sourceAccount: 'bank-1' },
    ];
    expect(metricTrend(10000, accountMovement(thisMonth, cash))).toMatchObject({ base: 10000, delta: 0 });
    expect(metricTrend(20000, accountMovement(thisMonth, bank))).toMatchObject({ base: 25000, delta: -5000 });
  });
});

describe('loanMovement — the loans stock', () => {
  it('adds a loan given out and subtracts a repayment', () => {
    expect(loanMovement([
      { type: 'lend', amount: 2000 },
      { type: 'repay', amount: 1500 },
    ])).toBe(500);
  });

  it('leaves the stock alone for anything that is not a loan movement', () => {
    expect(loanMovement([
      { type: 'income', amount: 999 },
      { type: 'expense', amount: 999 },
      { type: 'transfer', amount: 999 },
      { type: 'loan_issue', amount: 999 },
    ])).toBe(0);
  });

  it('compares the stock with its own value at the end of last month', () => {
    // 8,000 outstanding now, and 2,000 was lent out this month that was not repaid.
    expect(metricTrend(8000, loanMovement([{ type: 'lend', amount: 2000 }])))
      .toEqual({ base: 6000, delta: 2000, percent: (2000 / 6000) * 100 });
  });
});
