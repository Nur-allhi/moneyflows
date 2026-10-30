import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../../core/domain/Transaction';
import { ledgerAmountCells, memberLedgerDelta } from '../memberLedger';
import { withRunningBalances } from '../runningBalance';

const tx = (amount: number, sourceAccount?: string, destAccount?: string): Transaction => ({
  id: `t${amount}`,
  type: 'transfer',
  amount,
  description: 'x',
  date: '2026-01-01',
  memberId: 'm1',
  sourceAccount,
  destAccount,
  metadata: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

/** The member's two accounts, and an account that is not theirs. */
const X = 'acct-x';
const Y = 'acct-y';
const OUTSIDE = 'acct-other';
const SELECTED = new Set([X]);
const ALL_MINE = new Set([X, Y]);

describe('memberLedgerDelta', () => {
  describe('one account selected', () => {
    it('counts money arriving in that account as positive', () => {
      expect(memberLedgerDelta(tx(500, OUTSIDE, X), SELECTED)).toBe(500);
      expect(memberLedgerDelta(tx(500, Y, X), SELECTED)).toBe(500);
    });

    it('counts money leaving that account as negative', () => {
      expect(memberLedgerDelta(tx(500, X, Y), SELECTED)).toBe(-500);
      expect(memberLedgerDelta(tx(500, X, OUTSIDE), SELECTED)).toBe(-500);
    });

    it('ignores transactions that do not touch it', () => {
      expect(memberLedgerDelta(tx(500, OUTSIDE, 'acct-nobody'), SELECTED)).toBe(0);
    });
  });

  describe('all accounts (the previous defect, BUG-32)', () => {
    it('nets an internal transfer to zero instead of debiting it', () => {
      expect(memberLedgerDelta(tx(300, X, Y), ALL_MINE)).toBe(0);
    });

    it('counts a repayment received into a member account as money in', () => {
      // The old rule compared destAccount === selectedAccountId, which is always
      // false for the all-accounts view, so this was booked as a debit.
      expect(memberLedgerDelta(tx(200, OUTSIDE, X), ALL_MINE)).toBe(200);
    });

    it('still counts money leaving to an outside account as negative', () => {
      expect(memberLedgerDelta(tx(400, X, OUTSIDE), ALL_MINE)).toBe(-400);
    });

    it('keeps the running balance of a mixed ledger consistent with its rows', () => {
      const history = [tx(1000, OUTSIDE, X), tx(300, X, Y), tx(200, OUTSIDE, X)];
      const end = history.reduce((sum, t) => sum + memberLedgerDelta(t, ALL_MINE), 0);

      expect(end).toBe(1200);
      // The transfer moves nothing; only the two outside movements count.
      expect(withRunningBalances(history, (t) => memberLedgerDelta(t, ALL_MINE), end).map((r) => r.balance))
        .toEqual([1000, 1000, 1200]);
    });
  });
});

describe('ledgerAmountCells', () => {
  it('puts money in the credit column only', () => {
    expect(ledgerAmountCells(500, '500')).toEqual({ debit: '', credit: '500' });
  });

  it('puts money out in the debit column only', () => {
    expect(ledgerAmountCells(-500, '500')).toEqual({ debit: '500', credit: '' });
  });

  it('shows an internal movement in both columns, leaving the balance alone', () => {
    expect(ledgerAmountCells(0, '300')).toEqual({ debit: '300', credit: '300' });
  });
});
