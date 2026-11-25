import type { Transaction } from '../../core/domain/Transaction';
import { balanceEffects } from '../../core/domain/balanceEffect';

/**
 * One displayed row of the group ledger. A movement whose two sides are both
 * inside the group is shown twice — once as money leaving one account and once
 * as money arriving in the other — so the reader can follow it. The pair still
 * nets to zero, which is why the group's own balance never changes.
 */
export type GroupLegDirection = 'debit' | 'credit' | 'both';

export interface GroupLeg<T> {
  tx: T;
  direction: GroupLegDirection;
  /** The account this leg belongs to, when there is one. */
  accountId?: string;
  /** Full "source → destination" route, including an outside account. */
  accountLabel: string;
}

// `type` is a plain string here, exactly as in `balanceEffects` — the domain
// rule tolerates odd rows, and so does this display helper.
type LegSource = Pick<Transaction, 'amount' | 'sourceAccount' | 'destAccount'> & { type: string };

/**
 * `balanceEffects` is the single definition of which transaction types move
 * money between two accounts (transfer + every loan type). Only those can
 * produce two legs; income and expense have one side by definition.
 */
export function groupLegs<T extends LegSource>(
  tx: T,
  groupAccountIds: ReadonlySet<string>,
  accountName: (id: string) => string | undefined,
): GroupLeg<T>[] {
  const src = tx.sourceAccount ?? undefined;
  const dst = tx.destAccount ?? undefined;
  const inSrc = src !== undefined && groupAccountIds.has(src);
  const inDst = dst !== undefined && groupAccountIds.has(dst);

  const nameOf = (id?: string) => (id ? (accountName(id) ?? '(deleted account)') : '(deleted account)');
  const route = src && dst ? `${nameOf(src)} \u2192 ${nameOf(dst)}` : nameOf(src ?? dst);

  if (balanceEffects(tx).length === 2 && inSrc && inDst) {
    return [
      { tx, direction: 'debit', accountId: src, accountLabel: route },
      { tx, direction: 'credit', accountId: dst, accountLabel: route },
    ];
  }

  const direction: GroupLegDirection = inDst && !inSrc ? 'credit' : inSrc && !inDst ? 'debit' : 'both';
  return [{ tx, direction, accountId: inDst ? dst : src, accountLabel: route }];
}
