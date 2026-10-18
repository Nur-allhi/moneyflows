import { describe, expect, it } from 'vitest';
import type { Transaction, TransactionType } from '../Transaction';
import {
  EXPENSE_TX_TYPES,
  INCOME_TX_TYPES,
  isExpenseTx,
  isIncomeTx,
  sumIncomeExpense,
} from '../transactionCategory';

/**
 * Every type the schema allows (see `TransactionType`). Kept as a literal so a
 * new type forces a decision here instead of silently falling out of both
 * totals. `transfer` is the only type expected in neither set.
 */
const ALL_TYPES: TransactionType[] = [
  'income',
  'expense',
  'transfer',
  'loan_issue',
  'loan_repayment',
  'loan_received',
  'loan_paidback',
  'lend',
  'repay',
];

const tx = (type: TransactionType, amount: number): Transaction => ({
  id: `${type}-${amount}`,
  type,
  amount,
  description: type,
  date: '2026-01-01',
  memberId: 'm1',
  metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('transactionCategory', () => {
  it('classifies every type except transfer, and never twice', () => {
    const unclassified: TransactionType[] = [];
    for (const type of ALL_TYPES) {
      const income = INCOME_TX_TYPES.has(type);
      const expense = EXPENSE_TX_TYPES.has(type);
      if (income && expense) throw new Error(`${type} is both income and expense`);
      if (!income && !expense) unclassified.push(type);
    }
    expect(unclassified).toEqual(['transfer']);
  });

  it('treats transfers as neither income nor expense', () => {
    expect(isIncomeTx({ type: 'transfer' })).toBe(false);
    expect(isExpenseTx({ type: 'transfer' })).toBe(false);
  });

  it('counts money lent out and money repaid as the same size, so a loan cycle nets to zero', () => {
    // 1,000 lent out, 1,000 returned: the member is exactly where they started.
    const totals = sumIncomeExpense([tx('lend', 1000), tx('repay', 1000)]);
    expect(totals).toEqual({ income: 1000, expense: 1000, net: 0 });
  });

  it('sums both sides symmetrically, ignoring transfers (BUG-26)', () => {
    const totals = sumIncomeExpense([
      tx('income', 5000),
      tx('expense', 200),
      tx('lend', 1000),
      tx('loan_issue', 300),
      tx('repay', 400),
      tx('loan_received', 100),
      tx('loan_paidback', 50),
      tx('loan_repayment', 250),
      tx('transfer', 9999),
    ]);

    // income: 5000 + 400 + 100 + 250 ; expense: 200 + 1000 + 300 + 50
    expect(totals).toEqual({ income: 5750, expense: 1550, net: 4200 });
  });

  it('returns zeros for no transactions', () => {
    expect(sumIncomeExpense([])).toEqual({ income: 0, expense: 0, net: 0 });
  });
});
