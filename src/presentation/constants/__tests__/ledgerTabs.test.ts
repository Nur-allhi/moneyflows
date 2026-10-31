import { describe, expect, it } from 'vitest';
import { matchesLedgerTab } from '../ledgerTabs';

/**
 * BUG-42: the phone list and the desktop table each had their own type→tab map,
 * so a `lend` row sat under Expense on the phone and under Loan on the desktop —
 * the same tab selecting two different sets of rows. Both now ask this.
 */
describe('matchesLedgerTab (BUG-42)', () => {
  it('lists lending on the Expense tab, the same way on both layouts', () => {
    expect(matchesLedgerTab('lend', 'expense')).toBe(true);
    expect(matchesLedgerTab('loan_issue', 'expense')).toBe(true);
    // The legacy "gave a loan back" type is an expense side too.
    expect(matchesLedgerTab('loan_paidback', 'expense')).toBe(true);
  });

  it('lists repayments on the Income tab', () => {
    expect(matchesLedgerTab('repay', 'income')).toBe(true);
    expect(matchesLedgerTab('loan_repayment', 'income')).toBe(true);
    expect(matchesLedgerTab('loan_received', 'income')).toBe(true);
  });

  it('still lists every loan movement on the Loan tab', () => {
    for (const type of ['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback']) {
      expect(matchesLedgerTab(type, 'loan')).toBe(true);
    }
  });

  it('keeps plain income, expense and transfer on their own tabs', () => {
    expect(matchesLedgerTab('income', 'income')).toBe(true);
    expect(matchesLedgerTab('income', 'expense')).toBe(false);
    expect(matchesLedgerTab('expense', 'expense')).toBe(true);
    expect(matchesLedgerTab('expense', 'income')).toBe(false);
    expect(matchesLedgerTab('transfer', 'transfer')).toBe(true);
    // A transfer moves money between your own accounts: neither income nor expense.
    expect(matchesLedgerTab('transfer', 'income')).toBe(false);
    expect(matchesLedgerTab('transfer', 'expense')).toBe(false);
  });

  it('shows everything on All, and nothing on an unknown tab', () => {
    expect(matchesLedgerTab('income', 'all')).toBe(true);
    expect(matchesLedgerTab('lend', 'all')).toBe(true);
    expect(matchesLedgerTab('transfer', 'all')).toBe(true);
    expect(matchesLedgerTab('income', 'nonsense' as never)).toBe(false);
  });
});
