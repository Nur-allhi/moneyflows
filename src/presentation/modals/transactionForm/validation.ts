import type { Account } from '../../../core/domain/Account';

export type ValidationErrors = Record<string, string>;

export function validateForm(
  tab: string,
  rawAmount: string,
  description: string,
  source: string,
  destination: string,
  accounts: Account[],
  loanAction: string,
  selectedBorrowerId: string,
): ValidationErrors {
  const next: ValidationErrors = {};
  const amountNum = parseInt(rawAmount, 10);
  if (!rawAmount || rawAmount.trim() === '') next.amount = 'Amount is required';
  else if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) next.amount = 'Amount must be a positive number';
  const desc = description.trim();
  if (desc.length < 1) next.description = 'Description is required';
  else if (desc.length > 200) next.description = 'Description must be 200 characters or less';
  if (tab === 'loan') {
    if (loanAction === 'lend') {
      if (!source) next.source = 'Select a lender account';
      if (!destination) next.destination = 'Select a borrower account';
    } else if (!selectedBorrowerId) next.source = 'Select a counterparty to repay';
  } else {
    if (!source) {
      next.source = 'Select an account';
    } else {
      const acct = accounts.find((a) => a.id === source);
      if (!acct) next.source = 'Account not found';
      else if (!acct.isActive) next.source = 'Account is inactive';
    }
    if (tab === 'transfer') {
      if (!destination) next.destination = 'Select a destination account';
      else if (source && destination === source) next.destination = 'Source and destination must differ';
      else {
        const acct = accounts.find((a) => a.id === destination);
        if (!acct) next.destination = 'Account not found';
        else if (!acct.isActive) next.destination = 'Account is inactive';
      }
    }
  }
  return next;
}
