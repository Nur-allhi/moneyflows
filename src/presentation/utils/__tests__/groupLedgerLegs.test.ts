import { describe, expect, it } from 'vitest';
import { groupLegs, pdfDescription } from '../groupLedgerLegs';

const GROUP = new Set(['DBBL', 'Cash']);
const names: Record<string, string | undefined> = {
  DBBL: 'DBBL',
  Cash: 'Cash',
  Rafiq: 'Rafiq',
};
const nameOf = (id: string) => names[id];

const tx = (type: string, sourceAccount?: string, destAccount?: string) => ({
  type,
  amount: 10000,
  sourceAccount,
  destAccount,
});

describe('groupLegs', () => {
  it('splits a transfer between two group accounts into a debit and a credit', () => {
    const legs = groupLegs(tx('transfer', 'DBBL', 'Cash'), GROUP, nameOf);

    expect(legs).toHaveLength(2);
    expect(legs.map((l) => l.direction)).toEqual(['debit', 'credit']);
    expect(legs.map((l) => l.accountId)).toEqual(['DBBL', 'Cash']);
    expect(legs.map((l) => l.accountLabel)).toEqual(['DBBL \u2192 Cash', 'DBBL \u2192 Cash']);
    expect(legs[0]?.tx).toBe(legs[1]?.tx);
  });

  it('splits a loan movement between two group accounts too', () => {
    for (const type of ['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback']) {
      const legs = groupLegs(tx(type, 'DBBL', 'Cash'), GROUP, nameOf);
      expect(legs).toHaveLength(2);
      expect(legs.map((l) => l.direction)).toEqual(['debit', 'credit']);
    }
  });

  it('keeps one leg when only the source is in the group, with the full route', () => {
    const legs = groupLegs(tx('transfer', 'DBBL', 'Rafiq'), GROUP, nameOf);

    expect(legs).toHaveLength(1);
    expect(legs[0]?.direction).toBe('debit');
    expect(legs[0]?.accountLabel).toBe('DBBL \u2192 Rafiq');
  });

  it('keeps one credit leg when only the destination is in the group', () => {
    const legs = groupLegs(tx('repay', 'Rafiq', 'DBBL'), GROUP, nameOf);

    expect(legs).toHaveLength(1);
    expect(legs[0]?.direction).toBe('credit');
    expect(legs[0]?.accountLabel).toBe('Rafiq \u2192 DBBL');
  });

  it('uses one side as the label for income and expense', () => {
    expect(groupLegs(tx('income', undefined, 'Cash'), GROUP, nameOf)[0])
      .toMatchObject({ direction: 'credit', accountLabel: 'Cash' });
    expect(groupLegs(tx('expense', 'Cash', undefined), GROUP, nameOf)[0])
      .toMatchObject({ direction: 'debit', accountLabel: 'Cash' });
  });

  it('names a deleted account instead of leaving the cell blank', () => {
    const legs = groupLegs(tx('transfer', 'DBBL', 'gone'), GROUP, nameOf);

    expect(legs[0]?.accountLabel).toBe('DBBL \u2192 (deleted account)');
  });

  it('does not split a single-sided type even if a stray row has both accounts', () => {
    const legs = groupLegs(tx('income', 'DBBL', 'Cash'), GROUP, nameOf);

    expect(legs).toHaveLength(1);
    expect(legs[0]?.accountLabel).toBe('DBBL \u2192 Cash');
  });
});

describe('pdfDescription (BUG-62)', () => {
  it('puts the account route on a second line under the description', () => {
    expect(pdfDescription('ATM Cash', 'Standard Bank \u2192 Bagda Bazar'))
      .toBe('ATM Cash\nStandard Bank -> Bagda Bazar');
  });

  it('leaves the description alone when there is no account to name', () => {
    expect(pdfDescription('Opening Balance', '')).toBe('Opening Balance');
  });
});
