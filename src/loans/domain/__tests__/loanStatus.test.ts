import { describe, expect, it } from 'vitest';
import type { Loan } from '../types';
import { loanItemStatus } from '../loanStatus';

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
