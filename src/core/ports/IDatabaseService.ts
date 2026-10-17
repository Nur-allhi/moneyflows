import type { Member } from '../domain/Member';
import type { Account } from '../domain/Account';
import type { Transaction } from '../domain/Transaction';
import type { AccountGroup } from '../domain/AccountGroup';
import type { IntegrityReport } from '../domain/transactionIntegrity';
import type { OtherLedger, OtherLedgerEntry } from '../../otherLedgers/domain/types';

export interface TransactionFilter {
  memberId?: string;
  accountId?: string;
  accountIds?: string[];
  type?: string;
  loanRef?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface DeletedItem {
  id: string;
  type: 'transaction' | 'account' | 'other_ledger' | 'other_entry';
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

export interface SnapshotInfo {
  time: string;
  hash: string;
}

export interface StorageHealth {
  backend: 'opfs' | 'localStorage';
  lastFlushAt: number;
  lastFlushFailed: boolean;
}

/** Cloud sync state (Phase 19). lastError: 'reconnect' | 'upload-failed' | 'download-failed' | 'remote-corrupt' | 'conflict' | null. */
export interface CloudStatus {
  signedIn: boolean;
  email: string | null;
  /** Display name from the profile scope (T-158); null when absent/signed out. */
  profileName: string | null;
  /** Photo URL from the profile scope (T-158); sidebar only, never logged. */
  profilePhoto: string | null;
  lastSyncAt: number;
  lastError: string | null;
  conflictPending: boolean;
}

/** reconcileAfterSignIn outcome: silent paths need no UI, 'choice' opens the dialog. */
export type CloudReconcile = 'downloaded' | 'uploaded' | 'idle' | 'choice' | 'signed-out';

/** Boot progress callback (T-161): fraction 0..1 with a plain-language stage label. */
export type BootProgress = (fraction: number, label: string) => void;

/** One latest-transaction line in a conflict comparison card (T-169). */
export interface PreviewTx {
  description: string;
  /** Signed amount: outflows negative, inflows positive, transfers as-is. */
  amount: number;
  /** YYYY-MM-DD. */
  date: string;
}

/** One side of a conflict comparison card (T-169). */
export interface SideSummary {
  transactions: number;
  accounts: number;
  members: number;
  latest: PreviewTx[];
  /** MAX(updated_at) across tables, ISO-ish string, or null when empty. */
  lastChange: string | null;
}

/** Side-by-side conflict comparison for the dialog (T-169). */
export interface ConflictPreview {
  local: SideSummary;
  remote: SideSummary;
  /** Drive server-side saved time of the remote copy (may be null). */
  remoteSavedAt: string | null;
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
  saveAccountGroup(group: AccountGroup): Promise<void>;
  softDeleteAccountGroup(id: string): Promise<void>;
  addGroupAccount(groupId: string, accountId: string): Promise<void>;
  removeGroupAccount(groupId: string, accountId: string): Promise<void>;
  getGroupAccountIds(groupId: string): Promise<string[]>;

  getOtherLedgers(): Promise<OtherLedger[]>;
  getOtherLedgerById(id: string): Promise<OtherLedger | null>;
  saveOtherLedger(ledger: OtherLedger): Promise<void>;
  softDeleteOtherLedger(id: string): Promise<void>;
  restoreOtherLedger(id: string): Promise<void>;
  purgeOtherLedger(id: string): Promise<void>;

  getOtherLedgerEntries(ledgerId: string): Promise<OtherLedgerEntry[]>;
  getOtherLedgerEntryById(id: string): Promise<OtherLedgerEntry | null>;
  saveOtherLedgerEntry(entry: OtherLedgerEntry): Promise<void>;
  updateOtherLedgerEntry(id: string, entry: OtherLedgerEntry): Promise<void>;
  softDeleteOtherLedgerEntry(id: string): Promise<void>;
  restoreOtherLedgerEntry(id: string): Promise<void>;
  purgeOtherLedgerEntry(id: string): Promise<void>;

  getDeletedItems(type?: 'transaction' | 'account' | 'other_ledger' | 'other_entry'): Promise<DeletedItem[]>;
  restoreItem(id: string, type: 'transaction' | 'account' | 'other_ledger' | 'other_entry'): Promise<void>;
  purgeItem(id: string, type: 'transaction' | 'account' | 'other_ledger' | 'other_entry'): Promise<void>;
  purgeExpiredItems(daysRetained: number): Promise<number>;

  getSnapshots(): Promise<SnapshotInfo[]>;
  restoreSnapshot(index: number): Promise<void>;
  /** Exact-slot restore for the recovery screen — no fallback, throws per-slot errors. */
  restoreSnapshotExact(index: number): Promise<void>;
  restoreNewestSnapshot(): Promise<boolean>;
  resetStorage(): Promise<void>;
  getStorageHealth(): StorageHealth;
  getCloudStatus(): Promise<CloudStatus>;
  syncNow(): Promise<CloudStatus>;
  /** Open-tab poll: 'available' when remote moved and local is clean. Null when signed out/offline. */
  checkRemoteUpdate(): Promise<'up-to-date' | 'available' | 'conflict' | null>;
  /** Downloads + imports the newer remote. True on success. */
  applyRemoteUpdate(): Promise<boolean>;
  /** Resolves a both-sides-moved conflict. 'mine' uploads local, 'theirs' loads remote. */
  resolveConflict(choice: 'mine' | 'theirs'): Promise<boolean>;
  /**
   * Post-sign-in reconcile (Phase 19, T-152): deterministic — empty local +
   * remote downloads, local data + empty remote uploads, same hash idles,
   * both-differ flags choice. Null-safe: 'signed-out' when no token.
   */
  reconcileAfterSignIn(): Promise<CloudReconcile>;
  /** Remote diagnostics for Settings (T-160): file count + newest modified time. Null when signed out/offline. */
  remoteInfo(): Promise<{ dbFiles: number; hashPresent: boolean; modifiedTime: string | null } | null>;
  /** Explicit user escape hatch for a corrupt remote: replaces cloud with this device. Warned button only. */
  overwriteRemote(): Promise<boolean>;
  /** Side-by-side data for the conflict dialog (T-169). Null when unavailable — plain dialog fallback. */
  getConflictPreview(): Promise<ConflictPreview | null>;
  /** What-changed data for the update prompt (T-170): verified download, no import, no state change. */
  getUpdatePreview(): Promise<ConflictPreview | null>;

  getFamilySummary(): Promise<FamilySummary>;
  getMemberBalance(memberId: string): Promise<number>;
  getAccountGroupBalances(): Promise<GroupBalance[]>;

  exportToFile(): Promise<void>;
  importFromFile(): Promise<void>;
  /** Replaces the in-memory database with the given .db bytes and persists it. */
  importFromBytes(data: Uint8Array): Promise<void>;

  recalculateBalances(): Promise<void>;

  /**
   * BUG-41: read-only scan of stored transactions against the rules the write
   * path enforces today. Detects and reports only — it must never write, so no
   * financial record is silently rewritten by looking at it.
   */
  findInvalidTransactions(): Promise<IntegrityReport>;
}
