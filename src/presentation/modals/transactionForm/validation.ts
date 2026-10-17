import type { Account } from '../../../core/domain/Account';
import { parseAmountInput, validateTransactionFields } from '../../../core/domain/transactionRules';

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
  // Amount + description rules come from the same module the database guard and
  // the edit form use, so the three can no longer drift apart (BUG-24/BUG-31).
  // They live in one place only; this form just maps them onto field names. The
  // `date` slot is not this function's concern (the DatePicker owns it), so it
  // is passed empty and its issue ignored.
  const shared = validateTransactionFields({
    amount: parseAmountInput(rawAmount),
    description,
    date: '',
  });
  if (!rawAmount || rawAmount.trim() === '') next.amount = 'Amount is required';
  else if (shared.amount) next.amount = shared.amount;
  if (shared.description) next.description = shared.description;
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
