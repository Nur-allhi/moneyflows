import { describe, it, expect } from 'vitest';
import { computeBalances, diffBalances } from '../computeBalances';

describe('computeBalances (T-171)', () => {
  it('starts every account at zero with no transactions', () => {
    expect([...computeBalances([], ['a', 'b']).values()]).toEqual([0, 0]);
  });

  it('applies income/expense/transfer per applyBalanceChange rules', () => {
    const balances = computeBalances(
      [
        { type: 'income', amount: 1000, dest_account: 'cash' },
        { type: 'expense', amount: 200, source_account: 'cash' },
        { type: 'transfer', amount: 300, source_account: 'cash', dest_account: 'bank' },
      ],
      ['cash', 'bank'],
    );
    expect(balances.get('cash')).toBe(500);
    expect(balances.get('bank')).toBe(300);
  });

  it('applies loan-family types as source-out/dest-in', () => {
    const balances = computeBalances(
      [
        { type: 'lend', amount: 5000, source_account: 'bank', dest_account: 'cp' },
        { type: 'repay', amount: 1500, source_account: 'cp', dest_account: 'bank' },
      ],
      ['bank', 'cp'],
    );
    expect(balances.get('bank')).toBe(-3500);
    expect(balances.get('cp')).toBe(3500);
  });

  it('ignores unknown types and missing accounts like applyBalanceChange', () => {
    const balances = computeBalances(
      [{ type: 'mystery', amount: 999, source_account: 'cash', dest_account: 'bank' }],
      ['cash', 'bank'],
    );
    expect(balances.get('cash')).toBe(0);
    expect(balances.get('bank')).toBe(0);
  });

  it('defaults unlisted accounts to zero instead of dropping their delta', () => {
    const balances = computeBalances([{ type: 'income', amount: 100, dest_account: 'ghost' }], []);
    expect(balances.get('ghost')).toBe(100);
  });
});

describe('diffBalances (T-171)', () => {
  it('returns empty when current already matches (no-op boot)', () => {
    const expected = computeBalances(
      [{ type: 'income', amount: 1000, dest_account: 'cash' }],
      ['cash'],
    );
    expect(diffBalances([{ id: 'cash', balance: 1000 }], expected)).toEqual([]);
  });

  it('returns only stale rows with corrected balances', () => {
    const expected = computeBalances(
      [{ type: 'expense', amount: 200, source_account: 'cash' }],
      ['cash', 'bank'],
    );
    expect(diffBalances(
      [
        { id: 'cash', balance: 9999 },
        { id: 'bank', balance: 0 },
      ],
      expected,
    )).toEqual([{ id: 'cash', balance: -200 }]);
  });
});
