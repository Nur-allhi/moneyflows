import { describe, expect, it } from 'vitest';
import { Account } from '../../../../core/domain/Account';
import { Member } from '../../../../core/domain/Member';
import { createTagLedgerRowResolver } from '../../../utils/tagLedgerRow';
import { buildTagPdfRows, type TagPdfData } from '../tagPdfExport';

const CREDIT_TYPES = new Set(['income', 'loan_repayment', 'repay']);
const accounts = [
  new Account('a1', 'm1', 'DBBL', 'bank'),
  new Account('a2', 'm-primary', 'Cash', 'cash'),
];
const members = [new Member('m-primary', 'Admin'), new Member('m1', 'Rafiq')];

const data = (txs: TagPdfData['txs']): TagPdfData => ({
  txs,
  resolve: createTagLedgerRowResolver(accounts, members, (tx) => CREDIT_TYPES.has(tx.type)),
  isCredit: (tx) => CREDIT_TYPES.has(tx.type),
  locale: 'en-IN',
  currency: 'BDT',
});

const tx = (overrides: Partial<TagPdfData['txs'][number]> = {}): TagPdfData['txs'][number] => ({
  id: 't1',
  type: 'expense',
  amount: 1500,
  date: '2026-11-01',
  description: 'Groceries',
  sourceAccount: 'a1',
  destAccount: undefined,
  memberId: 'm1',
  createdAt: '2026-11-01',
  updatedAt: '2026-11-01',
  metadata: {},
  ...overrides,
});

describe('buildTagPdfRows', () => {
  it('puts credits in the Credit cell and debits in the Debit cell, with matching totals', () => {
    const { rows, totalIn, totalOut } = buildTagPdfRows(data([
      tx({ id: 't1', type: 'income', amount: 500, destAccount: 'a2', sourceAccount: undefined }),
      tx({ id: 't2', type: 'expense', amount: 1500 }),
    ]));

    expect(rows.map((r) => [r.debit, r.credit])).toEqual([['', '500 BDT'], ['1,500 BDT', '']]);
    expect(totalIn).toBe(500);
    expect(totalOut).toBe(1500);
  });

  it('keeps the display order and title-cases the type', () => {
    const { rows } = buildTagPdfRows(data([
      tx({ id: 'old', date: '2026-10-01', type: 'loan_repayment' }),
      tx({ id: 'new', date: '2026-11-01', type: 'transfer' }),
    ]));

    expect(rows.map((r) => r.type)).toEqual(['Loan Repayment', 'Transfer']);
    expect(rows.map((r) => r.date)).toEqual(['01-10-2026', '01-11-2026']);
  });

  it('puts the account route on a second line under the description, with ASCII arrows', () => {
    const { rows } = buildTagPdfRows(data([tx({ sourceAccount: 'a1', destAccount: 'a2' })]));
    expect(rows[0]?.description).toBe('Groceries\nDBBL -> Cash');
  });

  it('resolves deleted members and accounts instead of leaving empty cells', () => {
    const { rows } = buildTagPdfRows(data([tx({ memberId: 'gone', sourceAccount: 'gone' })]));
    expect(rows[0]?.member).toBe('(deleted member)');
    expect(rows[0]?.description).toBe('Groceries\n(deleted account)');
  });

  it('produces no rows for an empty ledger', () => {
    expect(buildTagPdfRows(data([]))).toEqual({ rows: [], totalIn: 0, totalOut: 0 });
  });
});
