import { describe, expect, it } from 'vitest';
import { Account } from '../../../core/domain/Account';
import { Member } from '../../../core/domain/Member';
import { createTagLedgerRowResolver, type TagLedgerTxRef } from '../tagLedgerRow';

const CREDIT_TYPES = new Set(['income', 'loan_repayment', 'repay']);
const isCredit = (tx: { type: string }) => CREDIT_TYPES.has(tx.type);

const primary = new Member('m-primary', 'Admin');
const namira = new Member('m-namira', 'Namira');
const brac = new Account('a-brac', 'm-namira', 'Brac Bank', 'bank');
const cash = new Account('a-cash', 'm-primary', 'Cash', 'cash');
const counterparty = new Account('a-cp', undefined, 'Rafiq', 'counterparty');

const resolver = () => createTagLedgerRowResolver([brac, cash, counterparty], [primary, namira], isCredit);

describe('createTagLedgerRowResolver (BUG-65)', () => {
  it('shows the owner of the account in the row, not the recording member', () => {
    const r = resolver();
    const tx: TagLedgerTxRef = { type: 'expense', sourceAccount: 'a-brac', destAccount: undefined, memberId: 'm-primary' };

    expect(r.accountLabel(tx)).toBe('Brac Bank');
    expect(r.memberName(tx)).toBe('Namira');
  });

  it('follows the same account for credit rows', () => {
    const r = resolver();
    const tx: TagLedgerTxRef = { type: 'income', sourceAccount: undefined, destAccount: 'a-brac', memberId: 'm-primary' };

    expect(r.accountLabel(tx)).toBe('Brac Bank');
    expect(r.memberName(tx)).toBe('Namira');
  });

  it('falls back to the recorded member when the account has no owner', () => {
    const r = resolver();
    const tx: TagLedgerTxRef = { type: 'expense', sourceAccount: 'a-cp', destAccount: undefined, memberId: 'm-primary' };

    expect(r.accountLabel(tx)).toBe('Rafiq');
    expect(r.memberName(tx)).toBe('Admin');
  });

  it('names a deleted account and a missing member honestly', () => {
    const r = resolver();
    const tx: TagLedgerTxRef = { type: 'expense', sourceAccount: 'gone', destAccount: undefined, memberId: 'gone-member' };

    expect(r.accountLabel(tx)).toBe('(deleted account)');
    expect(r.memberName(tx)).toBe('(deleted member)');
  });

  it('builds the full ASCII route for the PDF description', () => {
    expect(resolver().routeLabel({ type: 'transfer', sourceAccount: 'a-brac', destAccount: 'a-cash', memberId: 'm-primary' }))
      .toBe('Brac Bank -> Cash');
  });
});
