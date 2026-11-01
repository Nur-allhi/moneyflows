import type { TransactionType } from '../../core/domain/Transaction';
import { LOAN_TX_TYPES } from '../../core/domain/balanceEffect';
import { EXPENSE_TX_TYPES, INCOME_TX_TYPES } from '../../core/domain/transactionCategory';

/** The group ledger's filter tabs, shared by the phone list, the desktop table and the PDF. */
export type LedgerTab = 'all' | 'income' | 'expense' | 'transfer' | 'loan';

/**
 * Which transactions a tab lists (BUG-42).
 *
 * The phone list and the desktop table each had their own private answer, so a
 * `lend` row appeared under **Expense** on the phone and under **Loan** on the
 * desktop — the same tab showing two different sets of rows.
 *
 * Both now ask this, and it says what the rest of the app already says: the
 * income/expense tabs use the same classification as every Income and Expense
 * total (BUG-25 — loan movements count as income/expense). So a loan movement
 * shows on its own `loan` tab **and** on the income or expense side it belongs
 * to; the two tabs are different views, not competing definitions.
 */
export function matchesLedgerTab(type: string, tab: LedgerTab): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'income':
      return INCOME_TX_TYPES.has(type as TransactionType);
    case 'expense':
      return EXPENSE_TX_TYPES.has(type as TransactionType);
    case 'transfer':
      return type === 'transfer';
    case 'loan':
      return LOAN_TX_TYPES.has(type as TransactionType);
    default:
      return false;
  }
}
