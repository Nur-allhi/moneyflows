export type LedgerSide = 'debit' | 'credit';

/** Side the ledger mirrors: opposite of the account movement. */
export function defaultLedgerSide(tab: string): LedgerSide {
  return tab === 'income' ? 'debit' : 'credit';
}
