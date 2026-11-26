import { describe, expect, it } from 'vitest';
import { displayLimitForTransaction } from '../ledgerFocus';

const ids = ['t1', 't2', 't3', 't4']; // oldest first

describe('displayLimitForTransaction', () => {
  it('keeps the current limit when the target is already visible', () => {
    expect(displayLimitForTransaction(ids, 't4', 1)).toBe(1);
  });

  it('expands to the full history for the oldest transaction', () => {
    expect(displayLimitForTransaction(ids, 't1', 1)).toBe(4);
  });

  it('expands to the target position counted from the newest row', () => {
    expect(displayLimitForTransaction(ids, 't2', 1)).toBe(3);
    expect(displayLimitForTransaction(ids, 't3', 1)).toBe(2);
  });

  it('never shrinks an already larger limit', () => {
    expect(displayLimitForTransaction(ids, 't2', 8)).toBe(8);
  });

  it('leaves the limit alone when the id is not in this ledger', () => {
    expect(displayLimitForTransaction(ids, 'missing', 10)).toBe(10);
  });

  it('leaves the limit alone before member data has loaded', () => {
    expect(displayLimitForTransaction([], 't1', 10)).toBe(10);
  });
});
