import { describe, expect, it } from 'vitest';
import type { Loan } from '../types';
import { loanItemStatus, splitStack, stackIsSettled } from '../loanStatus';

const loan = (status: Loan['status'], outstanding: number): Pick<Loan, 'status' | 'outstanding'> => ({ status, outstanding });

describe('loanItemStatus', () => {
  it('keeps a loan the app has flagged settled as settled', () => {
    expect(loanItemStatus(loan('settled', 0))).toBe('settled');
  });

  it('calls a loan with money still out active', () => {
    expect(loanItemStatus(loan('active', 1))).toBe('active');
  });

  it('calls a loan whose balance is fully back "repaid", not "on_track"', () => {
    // The old name read as "repaying on schedule" but meant the opposite: the
    // money is all in while the row's flag was never flipped (BUG-34).
    expect(loanItemStatus(loan('active', 0))).toBe('repaid');
    expect(loanItemStatus(loan('active', -500))).toBe('repaid');
  });

  it('never reports the misleading old name', () => {
    const states = [loan('settled', 0), loan('active', 5000), loan('active', 0)].map(loanItemStatus);
    expect(new Set(states)).toEqual(new Set(['active', 'repaid', 'settled']));
    expect(states).not.toContain('on_track');
  });
});

/**
 * BUG-45: the Active/Settled split tested the loan row's raw flag while the
 * derived status was computed beside it and used by nothing, so a loan with
 * nothing left to pay could still be counted as active — "1 active" printed next
 * to "0 BDT outstanding" and a 100% progress bar.
 */
describe('splitStack / stackIsSettled (BUG-45)', () => {
  const full = (id: string, status: Loan['status'], outstanding: number): Loan => ({
    id, status, outstanding, principal: 10_000, lenderAccountId: 'lender',
    createdAt: '2026-01-01 00:00:00',
  } as Loan);

  it('counts a stale-flag loan with nothing left as finished, not active', () => {
    // The bug, exactly: `active` flag, 0 outstanding.
    const split = splitStack([full('stale', 'active', 0)], (l) => l.id);
    expect(split.running).toEqual([]);
    expect(split.finished).toEqual(['stale']);
    expect(split.totalOutstanding).toBe(0);
  });

  it('keeps a loan with money still out running, and adds up only what is owed', () => {
    const split = splitStack(
      [full('a', 'active', 4000), full('b', 'settled', 0), full('c', 'active', 0)],
      (l) => l.id,
    );
    expect(split.running).toEqual(['a']);
    expect(split.finished).toEqual(['b', 'c']);
    expect(split.totalOutstanding).toBe(4000);
  });

  it('calls the stack settled only when every loan is finished', () => {
    expect(stackIsSettled([loan('settled', 0), loan('active', 0)])).toBe(true);
    expect(stackIsSettled([loan('settled', 0), loan('active', 100)])).toBe(false);
    expect(stackIsSettled([])).toBe(false);
  });
});
