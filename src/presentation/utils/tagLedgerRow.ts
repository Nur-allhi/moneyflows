import type { Account } from '../../core/domain/Account';
import type { Member } from '../../core/domain/Member';
import type { Transaction } from '../../core/domain/Transaction';

export type TagLedgerTxRef = Pick<Transaction, 'type' | 'sourceAccount' | 'destAccount' | 'memberId'>;

export interface TagLedgerRowResolver {
  /** The account the row is booked against — the one shown in the Account column. */
  accountId(tx: TagLedgerTxRef): string | undefined;
  accountLabel(tx: TagLedgerTxRef): string;
  /** BUG-65: the owner of the account shown in this row, not the recording member. */
  memberName(tx: TagLedgerTxRef): string;
  /** Full source -> destination route for the PDF's second description line. */
  routeLabel(tx: TagLedgerTxRef): string;
}

/**
 * One display rule for the tag ledger's Member and Account columns, shared by
 * the screen and the PDF export so the two can never disagree. `tx.memberId` is
 * the member who recorded the transaction (the primary member), so it cannot
 * identify whose account the money actually moved through.
 */
export function createTagLedgerRowResolver(
  accounts: readonly Account[],
  members: readonly Member[],
  isCredit: (tx: TagLedgerTxRef) => boolean,
): TagLedgerRowResolver {
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const memberById = new Map(members.map((m) => [m.id, m]));

  const accountId = (tx: TagLedgerTxRef) =>
    isCredit(tx) ? (tx.destAccount ?? tx.sourceAccount) : (tx.sourceAccount ?? tx.destAccount);

  const nameOf = (id: string | undefined, fallback: string) =>
    id ? (memberById.get(id)?.name ?? fallback) : '';

  return {
    accountId,
    accountLabel: (tx) => nameOfAccount(accountById, accountId(tx)),
    memberName: (tx) => {
      const ownerId = accountById.get(accountId(tx) ?? '')?.memberId;
      return ownerId
        ? nameOf(ownerId, '(deleted member)')
        : nameOf(tx.memberId, '(deleted member)');
    },
    routeLabel: (tx) =>
      [tx.sourceAccount, tx.destAccount]
        .filter((id): id is string => !!id)
        .map((id) => nameOfAccount(accountById, id))
        .join(' -> '),
  };
}

function nameOfAccount(accounts: ReadonlyMap<string, Account>, id: string | undefined): string {
  if (!id) return '';
  const account = accounts.get(id);
  return account ? account.name : '(deleted account)';
}
