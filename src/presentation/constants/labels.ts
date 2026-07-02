import type { AccountType } from '../../core/domain/Account';
import type { TransactionType } from '../../core/domain/Transaction';

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  bank: 'Bank',
  mobile_wallet: 'Mobile Wallet',
  cash: 'Cash',
  savings: 'Savings',
  business: 'Business',
  counterparty: 'Counterparty',
};

export const ACCOUNT_TYPE_GRADIENT: Record<AccountType, string> = {
  bank: 'linear-gradient(135deg, #1a237e, #283593)',
  savings: 'linear-gradient(135deg, #004d40, #00695c)',
  mobile_wallet: 'linear-gradient(135deg, #d81b60, #e91e63)',
  cash: 'linear-gradient(135deg, #37474f, #455a64)',
  business: 'linear-gradient(135deg, #263238, #37474f)',
  counterparty: 'linear-gradient(135deg, #4a148c, #6a1b9a)',
};

export const ACCOUNT_TYPE_GRADIENT_THREE: Record<AccountType, string> = {
  bank: 'linear-gradient(135deg, #1a237e, #283593 50%, #3f51b5)',
  savings: 'linear-gradient(135deg, #004d40, #00695c 50%, #00897b)',
  mobile_wallet: 'linear-gradient(135deg, #d81b60, #e91e63 50%, #f06292)',
  cash: 'linear-gradient(135deg, #37474f, #455a64 50%, #546e7a)',
  business: 'linear-gradient(135deg, #263238, #37474f 50%, #546e7a)',
  counterparty: 'linear-gradient(135deg, #4a148c, #6a1b9a 50%, #7b1fa2)',
};

export const ACCOUNT_TYPE_ACCENT: Record<AccountType, string> = {
  bank: 'var(--color-income)',
  mobile_wallet: 'var(--color-cash)',
  cash: 'var(--color-teal)',
  savings: 'var(--color-income)',
  business: 'var(--color-purple)',
  counterparty: 'var(--color-purple)',
};

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Bank' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Savings' },
  { value: 'business', label: 'Business' },
];

export const TX_TYPE_ICON: Record<TransactionType, string> = {
  income: '\u{1F4B5}',
  expense: '\u{1F4B8}',
  transfer: '\u{1F91D}',
  loan_issue: '\u{1F4B8}',
  loan_repayment: '\u{1F4B5}',
  loan_received: '\u{1F4B5}',
  loan_paidback: '\u{1F4B8}',
  lend: '\u{1F4B8}',
  repay: '\u{1F4B5}',
};

export function displayType(type: string): string {
  return ACCOUNT_TYPE_LABEL[type as AccountType] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const TX_DISPLAY_LABEL: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  loan_issue: 'Loan Issued',
  loan_repayment: 'Repayment Received',
  loan_received: 'Loan Received',
  loan_paidback: 'Repayment Sent',
  lend: 'Lent',
  repay: 'Repayment',
};

export function displayTxType(type: string): string {
  return TX_DISPLAY_LABEL[type as TransactionType] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
