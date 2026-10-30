/**
 * The one sign rule: what a transaction does to the accounts it names.
 *
 * It used to exist in two places that had to agree but could drift — the boot
 * replay in `computeBalances` (which reconciles `accounts.balance` against the
 * transactions) and, implicitly, whatever a screen needed. BUG-21 made the drift
 * visible: the dashboard shifted every metric's baseline by the *family-wide*
 * income/expense net, so an expense paid from a bank moved the Cash-in-Hand
 * baseline it never touched.
 *
 * Keeping the rule here in the domain means a metric can ask "what moved these
 * accounts?" and get the same answer the balance reconciliation uses.
 *
 * `transfer` and every loan type move money between two named accounts — one
 * side out, the other in — so they are not income or expenses of the family;
 * `LOAN_TX_TYPES` only describes the *balance* effect, and the income/expense
 * classification lives separately in `transactionCategory`.
 */
import type { TransactionType } from './Transaction';

/** Types whose balance effect is "out of the source, into the destination". */
export const LOAN_TX_TYPES: ReadonlySet<TransactionType> = new Set<TransactionType>([
  'loan_issue',
  'loan_repayment',
  'loan_received',
  'loan_paidback',
  'lend',
  'repay',
]);

export interface BalanceEffectTx {
  type: string;
  amount: number;
  sourceAccount?: string | null;
  destAccount?: string | null;
}

/** One account's balance change caused by one transaction. */
export interface AccountEffect {
  accountId: string;
  /** Signed: positive is money arriving, negative is money leaving. */
  delta: number;
}

/**
 * Every account this transaction moves, and by how much. Unknown types, and a
 * type without the account side it needs, move nothing — the same tolerance the
 * boot replay has always had for odd rows.
 */
export function balanceEffects(tx: BalanceEffectTx): AccountEffect[] {
  if (tx.type === 'income') {
    return tx.destAccount ? [{ accountId: tx.destAccount, delta: tx.amount }] : [];
  }
  if (tx.type === 'expense') {
    return tx.sourceAccount ? [{ accountId: tx.sourceAccount, delta: -tx.amount }] : [];
  }
  if (tx.type === 'transfer' || LOAN_TX_TYPES.has(tx.type as TransactionType)) {
    const effects: AccountEffect[] = [];
    if (tx.sourceAccount) effects.push({ accountId: tx.sourceAccount, delta: -tx.amount });
    if (tx.destAccount) effects.push({ accountId: tx.destAccount, delta: tx.amount });
    return effects;
  }
  return [];
}

/**
 * Change in the loans module's outstanding stock caused by one transaction.
 *
 * A loan you give out is new money owed to you (`lend`), and a repayment reduces
 * that stock (`repay`). The legacy account-to-account loan types move money
 * between your own accounts instead, so they leave this stock alone.
 */
export function loanStockDelta(tx: { type: string; amount: number }): number {
  if (tx.type === 'lend') return tx.amount;
  if (tx.type === 'repay') return -tx.amount;
  return 0;
}
