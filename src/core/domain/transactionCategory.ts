import type { Transaction, TransactionType } from './Transaction';

/**
 * Cash-flow classification behind every "Income" and "Expenses" total.
 *
 * Each transaction type describes money moving, so it either arrives (income)
 * or leaves (expenses). Loan principal sits on **both** sides on purpose: money
 * lent out has left your accounts and money repaid has come back, and counting
 * only one side made a member look steadily poorer for every loan they made and
 * recovered (BUG-26: the member profile counted `lend`/`loan_issue` as expenses
 * but nothing on the income side).
 *
 * BUG-25 asked whether loan principal belongs in these totals at all. Decided
 * 2026-10-30: it stays — loan movements keep counting as income and expense.
 * This module remains the single place that decision lands, so changing it later
 * is a one-file change. Either way the dashboard metric trends no longer depend
 * on these totals (BUG-21 compares each metric with its own past value), so they
 * feed the Month Summary panel and plain income/expense sums only.
 *
 * Account opening balances are `income` transactions by construction (the setup
 * wizard records them as such, BUG-19), so they count as income here.
 *
 * `transfer` is deliberately in neither set: it only moves money between your
 * own accounts, so it is neither income nor an expense.
 */
export const INCOME_TX_TYPES: ReadonlySet<TransactionType> = new Set<TransactionType>([
  'income',
  'loan_repayment',
  'repay',
  'loan_received',
]);

export const EXPENSE_TX_TYPES: ReadonlySet<TransactionType> = new Set<TransactionType>([
  'expense',
  'loan_issue',
  'lend',
  'loan_paidback',
]);

export function isIncomeTx(tx: Pick<Transaction, 'type'>): boolean {
  return INCOME_TX_TYPES.has(tx.type);
}

export function isExpenseTx(tx: Pick<Transaction, 'type'>): boolean {
  return EXPENSE_TX_TYPES.has(tx.type);
}

export interface IncomeExpenseTotals {
  income: number;
  expense: number;
  /** income − expense */
  net: number;
}

/** Income / expense / net across one set of transactions (any period). */
export function sumIncomeExpense(txs: readonly Transaction[]): IncomeExpenseTotals {
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    if (isIncomeTx(tx)) income += tx.amount;
    else if (isExpenseTx(tx)) expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}
