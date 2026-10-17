import { describe, it, expect } from 'vitest';
import { scanTransactions, type StoredTransactionFields } from '../transactionIntegrity';

function row(overrides: Partial<StoredTransactionFields> = {}): StoredTransactionFields {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 100,
    description: 'Groceries',
    date: '2026-08-01',
    sourceAccount: 'acct-a',
    destAccount: null,
    ...overrides,
  };
}

describe('scanTransactions (BUG-41 detection half)', () => {
  it('reports nothing for rows the write path would accept', () => {
    const report = scanTransactions([
      row(),
      row({ id: 'tx-2', type: 'income', sourceAccount: null, destAccount: 'acct-a' }),
      row({ id: 'tx-3', type: 'transfer', destAccount: 'acct-b' }),
    ]);

    expect(report.scanned).toBe(3);
    expect(report.issues).toEqual([]);
  });

  it('flags the amounts BUG-24 could store: zero, negative, NaN and Infinity', () => {
    const report = scanTransactions([
      row({ id: 'zero', amount: 0 }),
      row({ id: 'negative', amount: -50 }),
      row({ id: 'nan', amount: NaN }),
      row({ id: 'infinite', amount: Infinity }),
    ]);

    expect(report.issues.map((i) => i.id)).toEqual(['zero', 'negative', 'nan', 'infinite']);
    for (const issue of report.issues) {
      expect(issue.reasons).toEqual(['Amount must be a positive number']);
    }
  });

  it('flags an empty and an over-long description', () => {
    const report = scanTransactions([
      row({ id: 'empty', description: '' }),
      row({ id: 'blank', description: '   ' }),
      row({ id: 'long', description: 'x'.repeat(201) }),
    ]);

    expect(report.issues.map((i) => i.id)).toEqual(['empty', 'blank', 'long']);
    expect(report.issues[0]!.reasons).toEqual(['Description is required']);
    expect(report.issues[2]!.reasons).toEqual(['Description must be 200 characters or less']);
  });

  it('flags an unparseable date', () => {
    const report = scanTransactions([row({ date: 'not-a-date' })]);

    expect(report.issues).toHaveLength(1);
    expect(report.issues[0]!.reasons).toEqual(['Valid date is required']);
  });

  it('flags a missing required account per type, using the guard wording', () => {
    const report = scanTransactions([
      row({ id: 'expense', sourceAccount: null }),
      row({ id: 'income', type: 'income', sourceAccount: null, destAccount: null }),
      row({ id: 'repay', type: 'repay', sourceAccount: null, destAccount: null }),
    ]);

    expect(report.issues.find((i) => i.id === 'expense')!.reasons).toEqual(['Source account is required']);
    expect(report.issues.find((i) => i.id === 'income')!.reasons).toEqual(['Destination account is required']);
    // repay needs both sides, so both are reported on the same row.
    expect(report.issues.find((i) => i.id === 'repay')!.reasons).toEqual([
      'Source account is required',
      'Destination account is required',
    ]);
  });

  it('flags the same account on both sides for every type that forbids it', () => {
    const report = scanTransactions([
      row({ id: 'transfer', type: 'transfer', destAccount: 'acct-a' }),
      row({ id: 'loan_issue', type: 'loan_issue', destAccount: 'acct-a' }),
      row({ id: 'loan_repayment', type: 'loan_repayment', destAccount: 'acct-a' }),
      row({ id: 'lend', type: 'lend', destAccount: 'acct-a' }),
      row({ id: 'repay', type: 'repay', destAccount: 'acct-a' }),
    ]);

    expect(report.issues.map((i) => i.reasons[0])).toEqual([
      'Source and destination must differ',
      'Source and destination must differ for account-to-account loans',
      'Repayment source and destination must differ',
      'Source and destination must differ for lend/repay transactions',
      'Source and destination must differ for lend/repay transactions',
    ]);
  });

  it('collects every broken rule on one row, in the order the guard would raise them', () => {
    const report = scanTransactions([
      row({ amount: 0, description: '', date: 'nope', sourceAccount: null }),
    ]);

    expect(report.issues[0]!.reasons).toEqual([
      'Amount must be a positive number',
      'Description is required',
      'Valid date is required',
      'Source account is required',
    ]);
  });

  it('carries the row identity so the report can name what needs attention', () => {
    const report = scanTransactions([row({ id: 'abc', description: 'Rent', date: '2026-08-03', amount: -1 })]);

    expect(report.issues[0]).toMatchObject({ id: 'abc', description: 'Rent', date: '2026-08-03' });
  });

  it('does not judge accounts that no longer exist or are inactive — that is a write-time condition', () => {
    // A transaction may legitimately reference an account deleted afterwards, so
    // "account not found" is not corruption. Pinned so nobody adds it later.
    const report = scanTransactions([row({ sourceAccount: 'deleted-long-ago' })]);

    expect(report.issues).toEqual([]);
  });

  it('counts everything it looked at, valid or not', () => {
    const report = scanTransactions([row(), row({ amount: 0 }), row({ id: 'ok-2' })]);

    expect(report.scanned).toBe(3);
    expect(report.issues).toHaveLength(1);
  });
});
