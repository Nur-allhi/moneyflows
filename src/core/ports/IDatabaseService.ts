import type { Member } from '../domain/Member';
import type { Account } from '../domain/Account';
import type { Transaction } from '../domain/Transaction';
import type { AccountGroup } from '../domain/AccountGroup';

export interface TransactionFilter {
  memberId?: string;
  accountId?: string;
  type?: string;
  loanRef?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface DeletedItem {
  id: string;
  type: 'transaction' | 'account';
  name: string;
  amount?: number;
  deletedAt: string;
}

export interface FamilySummary {
  totalAssets: number;
  cashInHand: number;
  activeLoans: number;
  netWorth: number;
}

export interface GroupBalance {
  groupName: string;
  totalBalance: number;
  accountCount: number;
}

export interface IDatabaseService {
  init(): Promise<void>;
  getSqlJsDb(): unknown;

  getMembers(includeDeleted?: boolean): Promise<Member[]>;
  getMemberById(id: string): Promise<Member | null>;
  saveMember(member: Member): Promise<void>;
  softDeleteMember(id: string): Promise<void>;
  restoreMember(id: string): Promise<void>;
  purgeMember(id: string): Promise<void>;

  getAccounts(memberId?: string): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | null>;
  saveAccount(account: Account): Promise<void>;
  softDeleteAccount(id: string): Promise<void>;
  restoreAccount(id: string): Promise<void>;
  purgeAccount(id: string): Promise<void>;

  getTransactions(filters?: TransactionFilter): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  saveTransaction(tx: Transaction): Promise<void>;
  updateTransaction(id: string, tx: Transaction): Promise<void>;
  softDeleteTransaction(id: string): Promise<void>;
  restoreTransaction(id: string): Promise<void>;
  purgeTransaction(id: string): Promise<void>;

  getAccountGroups(): Promise<AccountGroup[]>;
  getAccountGroupsWithMembers(): Promise<(AccountGroup & { accountIds: string[] })[]>;

  getDeletedItems(type?: 'transaction' | 'account'): Promise<DeletedItem[]>;
  restoreItem(id: string, type: 'transaction' | 'account'): Promise<void>;
  purgeItem(id: string, type: 'transaction' | 'account'): Promise<void>;
  purgeExpiredItems(daysRetained: number): Promise<number>;

  getFamilySummary(): Promise<FamilySummary>;
  getMemberBalance(memberId: string): Promise<number>;
  getAccountGroupBalances(): Promise<GroupBalance[]>;
}
