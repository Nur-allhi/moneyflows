import { describe, it, expect } from 'vitest';
import { summarizeRows, signedAmount } from '../cloudDiff';
import type { TxRow, CountRow } from '../cloudDiff';

const tx = (over: Partial<TxRow> & { id: string }): TxRow => ({
  type: 'expense',
  description: 'x',
  amount: 100,
  date: '2026-10-01',
  updated_at: '2026-10-01 10:00:00',
  deleted_at: null,
  ...over,
});

const row = (over: Partial<CountRow> & { id: string }): CountRow => ({
  updated_at: '2026-10-01 10:00:00',
  deleted_at: null,
  ...over,
});

describe('signedAmount (T-169)', () => {
  it('negates outflows, keeps inflows positive, transfer as-is', () => {
    expect(signedAmount('expense', 500)).toBe(-500);
    expect(signedAmount('lend', 500)).toBe(-500);
    expect(signedAmount('income', 500)).toBe(500);
    expect(signedAmount('transfer', 500)).toBe(500);
    expect(signedAmount(undefined, 500)).toBe(500);
  });
});

describe('summarizeRows (T-169)', () => {
  it('counts live rows and picks the latest 3 by date', () => {
    const s = summarizeRows({
      transactions: [
        tx({ id: 'a', description: 'Old', date: '2026-09-01', type: 'income', amount: 1000, updated_at: '2026-09-01 10:00:00' }),
        tx({ id: 'b', description: 'Mid', date: '2026-10-05', type: 'expense', amount: 200, updated_at: '2026-10-05 10:00:00' }),
        tx({ id: 'c', description: 'New', date: '2026-10-10', type: 'expense', amount: 50, updated_at: '2026-10-10 10:00:00' }),
        tx({ id: 'd', description: 'Newest', date: '2026-10-12', type: 'income', amount: 300, updated_at: '2026-10-12 10:00:00' }),
        tx({ id: 'gone', description: 'Del', date: '2026-10-15', deleted_at: '2026-10-16 00:00:00' }),
      ],
      accounts: [row({ id: 'a1' }), row({ id: 'a2', deleted_at: '2026-01-01 00:00:00' })],
      members: [row({ id: 'm1' })],
    });
    expect(s.transactions).toBe(4);
    expect(s.accounts).toBe(1);
    expect(s.members).toBe(1);
    expect(s.latest.map((t) => t.description)).toEqual(['Newest', 'New', 'Mid']);
    expect(s.latest[2]).toMatchObject({ amount: -200, date: '2026-10-05' });
    expect(s.lastChange).toBe('2026-10-12 10:00:00');
  });

  it('empty side yields zeros, no latest, null stamp', () => {
    const s = summarizeRows({ transactions: [], accounts: [], members: [] });
    expect(s).toMatchObject({ transactions: 0, accounts: 0, members: 0, latest: [], lastChange: null });
  });
});
