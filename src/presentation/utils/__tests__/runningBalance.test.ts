import { describe, expect, it } from 'vitest';
import { withRunningBalances } from '../runningBalance';

/** Group-ledger item: amount plus its signed effect on the group balance. */
interface Item {
  label: string;
  amount: number;
  /** 0 for an internal transfer — it never moves the group balance. */
  delta: number;
}

const deltaOf = (item: Item) => item.delta;

const items: Item[] = [
  { label: 'opening income', amount: 1000, delta: 1000 },
  { label: 'internal transfer', amount: 250, delta: 0 },
  { label: 'expense', amount: 200, delta: -200 },
  { label: 'repayment in', amount: 50, delta: 50 },
];

describe('withRunningBalances', () => {
  it('walks the whole ledger and derives the true opening balance', () => {
    // end balance 850 = 0 opening + 1000 - 200 + 50
    const rows = withRunningBalances(items, deltaOf, 850);

    expect(rows.map((r) => r.balance)).toEqual([1000, 1000, 800, 850]);
    expect(rows.map((r) => r.delta)).toEqual([1000, 0, -200, 50]);
  });

  it('leaves the balance untouched for zero-delta items', () => {
    const rows = withRunningBalances(items, deltaOf, 850);
    expect(rows[1]?.balance).toBe(rows[0]?.balance);
  });

  it('is page-scoped when handed a slice, not the whole ledger (BUG-28)', () => {
    // Slice of the last two rows only: opening unwinds just those two rows.
    const slice = items.slice(2);
    const rows = withRunningBalances(slice, deltaOf, 850);

    expect(rows.map((r) => r.balance)).toEqual([800, 850]);
    // 850 (end) - (-200 + 50) = 1000, i.e. the slice's opening — not the ledger's 0.
    expect(rows[0]!.balance - rows[0]!.delta).toBe(1000);
  });

  it('returns nothing for an empty slice instead of NaN', () => {
    expect(withRunningBalances([], deltaOf, 850)).toEqual([]);
  });

  it('handles a fully negative end balance without clamping', () => {
    const rows = withRunningBalances([{ label: 'a', amount: 30, delta: -30 }], deltaOf, -30);
    expect(rows[0]!.balance).toBe(-30);
  });
});
