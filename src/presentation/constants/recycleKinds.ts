import type { DeletedItem } from '../../core/ports';

/**
 * What each deleted kind *is*, in one map: its row label, its icon, and the
 * tab it belongs to. The Recycle Bin's tab filter, tab counts and row labels
 * are all derived from this, so a kind can never be listed as one thing and be
 * unreachable in its own tab (BUG-30) — the previous code filtered the
 * "Accounts" tab on `type === 'account'` while labelling *every* non-transaction
 * row "Account", which hid deleted ledgers and ledger entries from both tabs
 * they could have belonged to.
 */
export const RECYCLE_TABS = ['all', 'transactions', 'accounts', 'ledgers'] as const;

export type RecycleTab = (typeof RECYCLE_TABS)[number];
export type RecycleKindTab = Exclude<RecycleTab, 'all'>;

export interface DeletedKindMeta {
  label: string;
  icon: string;
  iconVariant: 'warning' | 'account';
  tab: RecycleKindTab;
}

export const DELETED_KIND: Record<DeletedItem['type'], DeletedKindMeta> = {
  transaction: { label: 'Transaction', icon: '\u26A0', iconVariant: 'warning', tab: 'transactions' },
  account: { label: 'Account', icon: '\u{1F3E6}', iconVariant: 'account', tab: 'accounts' },
  other_ledger: { label: 'Ledger', icon: '\u{1F4D2}', iconVariant: 'account', tab: 'ledgers' },
  other_entry: { label: 'Ledger Entry', icon: '\u{1F9FE}', iconVariant: 'account', tab: 'ledgers' },
};

export const RECYCLE_TAB_LABEL: Record<RecycleTab, string> = {
  all: 'All Items',
  transactions: 'Transactions',
  accounts: 'Accounts',
  ledgers: 'Ledgers',
};

/**
 * What the active tab's total measures. A sum only means something inside one
 * kind — a transaction amount, an account balance and a ledger's opening
 * balance are different quantities, which is why the bin's single headline sum
 * of all of them was meaningless (BUG-29).
 */
export const RECYCLE_TAB_TOTAL_LABEL: Record<RecycleKindTab, string> = {
  transactions: 'Total Amount',
  accounts: 'Total Balances',
  ledgers: 'Total Value',
};
