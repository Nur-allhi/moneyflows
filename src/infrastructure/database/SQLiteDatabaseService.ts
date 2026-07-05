import initSqlJs, { type Database as SqlJsDb } from 'sql.js';
import { Member } from '../../core/domain/Member';
import { Account } from '../../core/domain/Account';
import { Transaction } from '../../core/domain/Transaction';
import { AccountGroup } from '../../core/domain/AccountGroup';
import type { IDatabaseService, TransactionFilter, DeletedItem, FamilySummary, GroupBalance, SnapshotInfo } from '../../core/ports/IDatabaseService';
import { STORAGE_KEY, EXPORT_FILENAME_PREFIX, MAX_SNAPSHOTS, SNAPSHOT_COOLDOWN_MS, SNAPSHOT_PREFIX, FOLDER_SYNC_COOLDOWN_MS } from '../../presentation/constants/config';
import { folderSync } from './FolderSync';

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY,name TEXT NOT NULL,short_name TEXT,email TEXT,phone TEXT,avatar_url TEXT,is_external INTEGER NOT NULL DEFAULT 0,metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT);",
  'CREATE INDEX IF NOT EXISTS idx_members_deleted ON members(deleted_at);',
  "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY,member_id TEXT REFERENCES members(id),name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('bank','mobile_wallet','cash','savings','business','counterparty')),balance REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'BDT',icon TEXT,color TEXT,is_active INTEGER NOT NULL DEFAULT 1,metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT);",
  'CREATE INDEX IF NOT EXISTS idx_accounts_member ON accounts(member_id);',
  'CREATE INDEX IF NOT EXISTS idx_accounts_deleted ON accounts(deleted_at);',
  'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);',
  "CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY,type TEXT NOT NULL CHECK(type IN ('income','expense','transfer','loan_issue','loan_repayment','loan_received','loan_paidback','lend','repay')),description TEXT NOT NULL,amount REAL NOT NULL CHECK(amount > 0),source_account TEXT REFERENCES accounts(id),dest_account TEXT REFERENCES accounts(id),member_id TEXT NOT NULL REFERENCES members(id),debtor_id TEXT REFERENCES members(id),loan_ref TEXT,date TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT,metadata TEXT DEFAULT '{}');",
  'CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(source_account);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_debtor ON transactions(debtor_id);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_loan_ref ON transactions(loan_ref);',
  "CREATE TABLE IF NOT EXISTS loans (id TEXT PRIMARY KEY,lender_account_id TEXT NOT NULL REFERENCES accounts(id),borrower_account_id TEXT NOT NULL REFERENCES accounts(id),principal REAL NOT NULL CHECK(principal > 0),outstanding REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','settled')),description TEXT DEFAULT '',metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT);",
  'CREATE INDEX IF NOT EXISTS idx_loans_lender ON loans(lender_account_id);',
  'CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_account_id);',
  'CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);',
  'CREATE INDEX IF NOT EXISTS idx_loans_deleted ON loans(deleted_at);',
  "CREATE TABLE IF NOT EXISTS account_groups (id TEXT PRIMARY KEY,name TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,metadata TEXT DEFAULT '{}',deleted_at TEXT);",
  'CREATE TABLE IF NOT EXISTS account_group_mappings (id TEXT PRIMARY KEY,account_group_id TEXT NOT NULL REFERENCES account_groups(id),account_id TEXT NOT NULL REFERENCES accounts(id),UNIQUE(account_group_id,account_id));',
].join('\n');



function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function rowToMember(r: Record<string, unknown>): Member {
  return new Member(r.id as string, r.name as string, r.short_name as string, r.email as string,
    r.phone as string, r.avatar_url as string, (r.is_external as number) === 1,
    JSON.parse((r.metadata as string) || '{}'), r.created_at as string, r.updated_at as string, r.deleted_at as string);
}

function rowToAccount(r: Record<string, unknown>): Account {
  return new Account(r.id as string, r.member_id as string | undefined, r.name as string, r.type as Account['type'],
    r.balance as number, r.currency as string, r.icon as string, r.color as string,
    (r.is_active as number) === 1, JSON.parse((r.metadata as string) || '{}'),
    r.created_at as string, r.updated_at as string, r.deleted_at as string);
}

function rowToTransaction(r: Record<string, unknown>): Transaction {
  return new Transaction(r.id as string, r.type as Transaction['type'], r.description as string,
    r.amount as number, r.member_id as string, r.date as string, r.source_account as string,
    r.dest_account as string, r.debtor_id as string, r.loan_ref as string,
    JSON.parse((r.metadata as string) || '{}'), r.created_at as string, r.updated_at as string, r.deleted_at as string);
}

function rowToGroup(r: Record<string, unknown>): AccountGroup {
  return new AccountGroup(r.id as string, r.name as string, r.sort_order as number,
    JSON.parse((r.metadata as string) || '{}'), r.deleted_at as string);
}

export class SQLiteDatabaseService implements IDatabaseService {
  private db: SqlJsDb | null = null;
  private SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;
  private lastSnapshotTime = 0;
  private lastFolderSyncTime = 0;

  getSqlJsDb(): SqlJsDb | null { return this.db; }

  async init(): Promise<void> {
    this.SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const buffer = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
        this.db = new this.SQL.Database(buffer);
        await this._migrate();
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        this.db = new this.SQL.Database();
        this.db.run(SCHEMA);
      }
    } else {
      this.db = new this.SQL.Database();
      this.db.run(SCHEMA);
    }
    this.save();
  }

  private async _migrate(): Promise<void> {
    if (!this.db) return;
    const hasLoans = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='loans'");
    const loansExists = hasLoans.length > 0 && hasLoans[0] && hasLoans[0].values.length > 0;
    if (!loansExists) {
      this.db.run("CREATE TABLE IF NOT EXISTS loans (id TEXT PRIMARY KEY,direction TEXT NOT NULL CHECK(direction IN ('given','received')),counterparty_id TEXT NOT NULL REFERENCES members(id),amount REAL NOT NULL CHECK(amount>0),outstanding REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','settled')),description TEXT DEFAULT '',metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT)");
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_counterparty ON loans(counterparty_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_direction ON loans(direction)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_deleted ON loans(deleted_at)');
    }
    const hasNewTypes = this.db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions' AND sql LIKE '%loan_received%'");
    if (hasNewTypes.length === 0 || !hasNewTypes[0] || hasNewTypes[0].values.length === 0) {
      this.db.run("CREATE TABLE transactions_v2 (id TEXT PRIMARY KEY,type TEXT NOT NULL CHECK(type IN ('income','expense','transfer','loan_issue','loan_repayment','loan_received','loan_paidback')),description TEXT NOT NULL,amount REAL NOT NULL CHECK(amount>0),source_account TEXT REFERENCES accounts(id),dest_account TEXT REFERENCES accounts(id),member_id TEXT NOT NULL REFERENCES members(id),debtor_id TEXT REFERENCES members(id),loan_ref TEXT,date TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT,metadata TEXT DEFAULT '{}')");
      this.db.run('INSERT INTO transactions_v2 SELECT * FROM transactions');
      this.db.run('DROP TABLE transactions');
      this.db.run('ALTER TABLE transactions_v2 RENAME TO transactions');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(source_account)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_debtor ON transactions(debtor_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_loan_ref ON transactions(loan_ref)');
    }
    const hasCounterpartyType = this.db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='accounts' AND sql LIKE '%counterparty%'");
    if (hasCounterpartyType.length === 0 || !hasCounterpartyType[0] || hasCounterpartyType[0].values.length === 0) {
      this.db.run("CREATE TABLE accounts_v2 (id TEXT PRIMARY KEY,member_id TEXT REFERENCES members(id),name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('bank','mobile_wallet','cash','savings','business','counterparty')),balance REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'BDT',icon TEXT,color TEXT,is_active INTEGER NOT NULL DEFAULT 1,metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT)");
      this.db.run('INSERT INTO accounts_v2 SELECT * FROM accounts');
      this.db.run('DROP TABLE accounts');
      this.db.run('ALTER TABLE accounts_v2 RENAME TO accounts');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_accounts_member ON accounts(member_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_accounts_deleted ON accounts(deleted_at)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type)');
    }
    const untaggedCp = this.query<{ id: string }>(
      "SELECT id FROM accounts WHERE type='counterparty' AND (metadata IS NULL OR metadata = '{}' OR metadata NOT LIKE '%counterpartyType%')"
    );
    if (untaggedCp.length > 0) {
      const stmt = this.db!.prepare("UPDATE accounts SET metadata = '{\"counterpartyType\":\"debtor\"}' WHERE id = $id");
      for (const row of untaggedCp) { stmt.bind({ $id: row.id }); stmt.step(); stmt.reset(); }
      stmt.free();
      this.save();
    }
    const loansRefAccounts = this.db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='loans' AND sql LIKE '%REFERENCES accounts%'");
    if (loansRefAccounts.length === 0 || !loansRefAccounts[0] || loansRefAccounts[0].values.length === 0) {
      this.db.run("CREATE TABLE loans_v2 (id TEXT PRIMARY KEY,direction TEXT NOT NULL CHECK(direction IN ('given','received')),counterparty_id TEXT NOT NULL REFERENCES accounts(id),amount REAL NOT NULL CHECK(amount>0),outstanding REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','settled')),description TEXT DEFAULT '',metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT)");
      this.db.run('INSERT INTO loans_v2 SELECT * FROM loans');
      this.db.run('DROP TABLE loans');
      this.db.run('ALTER TABLE loans_v2 RENAME TO loans');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_counterparty ON loans(counterparty_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_direction ON loans(direction)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_deleted ON loans(deleted_at)');
    }
    const hasOldLoans = this.db.exec("SELECT name FROM pragma_table_info('loans') WHERE name='direction'");
    if (hasOldLoans.length > 0 && hasOldLoans[0] && hasOldLoans[0].values.length > 0) {
      this.db.run("CREATE TABLE loans_v3 (id TEXT PRIMARY KEY,lender_account_id TEXT NOT NULL REFERENCES accounts(id),borrower_account_id TEXT NOT NULL REFERENCES accounts(id),principal REAL NOT NULL CHECK(principal > 0),outstanding REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','settled')),description TEXT DEFAULT '',metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT)");
      this.db.run('DROP TABLE IF EXISTS loans');
      this.db.run('ALTER TABLE loans_v3 RENAME TO loans');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_lender ON loans(lender_account_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_account_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_loans_deleted ON loans(deleted_at)');
    }
    const hasLendRepay = this.db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions' AND sql LIKE '%lend%'");
    if (hasLendRepay.length === 0 || !hasLendRepay[0] || hasLendRepay[0].values.length === 0) {
      this.db.run("CREATE TABLE transactions_v3 (id TEXT PRIMARY KEY,type TEXT NOT NULL CHECK(type IN ('income','expense','transfer','loan_issue','loan_repayment','loan_received','loan_paidback','lend','repay')),description TEXT NOT NULL,amount REAL NOT NULL CHECK(amount>0),source_account TEXT REFERENCES accounts(id),dest_account TEXT REFERENCES accounts(id),member_id TEXT NOT NULL REFERENCES members(id),debtor_id TEXT REFERENCES members(id),loan_ref TEXT,date TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT,metadata TEXT DEFAULT '{}')");
      this.db.run('INSERT INTO transactions_v3 SELECT * FROM transactions');
      this.db.run('DROP TABLE transactions');
      this.db.run('ALTER TABLE transactions_v3 RENAME TO transactions');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(source_account)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_debtor ON transactions(debtor_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_transactions_loan_ref ON transactions(loan_ref)');
    }
  }

  private save(): void {
    if (!this.db) return;
    const data = this.db.export();
    const binary = Array.from(data).map((b) => String.fromCharCode(b)).join('');
    localStorage.setItem(STORAGE_KEY, btoa(binary));
    this._maybeSnapshot(data).catch(() => {});
    this._maybeFolderSync(data).catch(() => {});
  }

  private async sha256(str: string): Promise<string> {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async _maybeSnapshot(data: Uint8Array): Promise<void> {
    const now = Date.now();
    if (now - this.lastSnapshotTime < SNAPSHOT_COOLDOWN_MS) return;
    this.lastSnapshotTime = now;
    const base64 = btoa(Array.from(data).map((b) => String.fromCharCode(b)).join(''));
    const hash = await this.sha256(base64);
    const snapshot = JSON.stringify({ data: base64, time: new Date().toISOString(), hash });
    for (let i = MAX_SNAPSHOTS - 2; i >= 0; i--) {
      const val = localStorage.getItem(`${SNAPSHOT_PREFIX}${i}`);
      if (val !== null) localStorage.setItem(`${SNAPSHOT_PREFIX}${i + 1}`, val);
    }
    try {
      localStorage.setItem(`${SNAPSHOT_PREFIX}0`, snapshot);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        localStorage.removeItem(`${SNAPSHOT_PREFIX}${MAX_SNAPSHOTS - 1}`);
        localStorage.setItem(`${SNAPSHOT_PREFIX}0`, snapshot);
      }
    }
  }

  private async _maybeFolderSync(data: Uint8Array): Promise<void> {
    const now = Date.now();
    if (now - this.lastFolderSyncTime < FOLDER_SYNC_COOLDOWN_MS) return;
    this.lastFolderSyncTime = now;
    if (await folderSync.hasPermission()) {
      await folderSync.sync(data);
    }
  }

  getSnapshots(): SnapshotInfo[] {
    const result: SnapshotInfo[] = [];
    for (let i = 0; i < MAX_SNAPSHOTS; i++) {
      try {
        const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}${i}`);
        if (raw) {
          const snap = JSON.parse(raw);
          if (snap?.time && snap?.hash) result.push({ time: snap.time, hash: snap.hash });
        }
      } catch { /* skip corrupt entries */ }
    }
    return result;
  }

  async restoreSnapshot(index: number): Promise<void> {
    const corrupted: number[] = [];
    for (let i = index; i >= 0; i--) {
      const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}${i}`);
      if (!raw) continue;
      let snap: { data: string; time: string; hash: string };
      try { snap = JSON.parse(raw); } catch {
        corrupted.push(i);
        continue;
      }
      if (!snap.data || !snap.time || !snap.hash) {
        corrupted.push(i);
        continue;
      }
      const computedHash = await this.sha256(snap.data);
      if (computedHash !== snap.hash) {
        corrupted.push(i);
        continue;
      }
      const buffer = Uint8Array.from(atob(snap.data), (c) => c.charCodeAt(0));
      if (this.SQL) {
        this.db = new this.SQL.Database(buffer);
        this.save();
        window.location.reload();
      }
      return;
    }
    const msg = corrupted.length > 0
      ? `All snapshots corrupted (slots ${corrupted.join(', ')})`
      : 'No snapshots available to restore';
    throw new Error(msg);
  }

  async exportToFile(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${EXPORT_FILENAME_PREFIX}${new Date().toISOString().slice(0, 10)}.db`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importFromFile(): Promise<void> {
    const sql = this.SQL;
    if (!sql || !this.db) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db';
    const file = await new Promise<File | null>((resolve) => {
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.click();
    });
    if (!file) return;
    const buffer = await file.arrayBuffer();
    this.db = new sql.Database(new Uint8Array(buffer));
    this.save();
    window.location.reload();
  }

  /** Reset database — clears all data and starts fresh */
  static clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private run(sql: string, params?: Record<string, string | number | null>): void {
    this.db!.run(sql, params as Parameters<SqlJsDb['run']>[1]);
    this.save();
  }

  private query<T>(sql: string, params?: Record<string, string | number | null>): T[] {
    const stmt = this.db!.prepare(sql);
    if (params) stmt.bind(params as Parameters<typeof stmt.bind>[0]);
    const results: T[] = [];
    while (stmt.step()) results.push(stmt.getAsObject() as T);
    stmt.free();
    return results;
  }

  private queryOne<T>(sql: string, params?: Record<string, string | number | null>): T | null {
    const rows = this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  getMembers(includeDeleted?: boolean): Promise<Member[]> {
    const sql = includeDeleted ? 'SELECT * FROM members ORDER BY name' : 'SELECT * FROM members WHERE deleted_at IS NULL ORDER BY name';
    return Promise.resolve(this.query<Record<string, unknown>>(sql).map(rowToMember));
  }

  getMemberById(id: string): Promise<Member | null> {
    const r = this.queryOne<Record<string, unknown>>('SELECT * FROM members WHERE id = $id', { $id: id });
    return Promise.resolve(r ? rowToMember(r) : null);
  }

  saveMember(member: Member): Promise<void> {
    this.run(`INSERT INTO members (id,name,short_name,email,phone,avatar_url,is_external,metadata,created_at,updated_at)
      VALUES ($id,$name,$short,$email,$phone,$avatar,$ext,$meta,$created,$updated)
      ON CONFLICT(id) DO UPDATE SET name=$name,short_name=$short,email=$email,phone=$phone,
      avatar_url=$avatar,is_external=$ext,metadata=$meta,updated_at=$updated`,
      { $id: member.id, $name: member.name, $short: member.shortName ?? null, $email: member.email ?? null,
        $phone: member.phone ?? null, $avatar: member.avatarUrl ?? null, $ext: member.isExternal ? 1 : 0,
        $meta: JSON.stringify(member.metadata), $created: member.createdAt, $updated: now() });
    return Promise.resolve();
  }

  softDeleteMember(id: string): Promise<void> { this.run('UPDATE members SET deleted_at=$now,updated_at=$now WHERE id=$id',{$id:id,$now:now()}); return Promise.resolve(); }
  restoreMember(id: string): Promise<void> { this.run('UPDATE members SET deleted_at=NULL,updated_at=$now WHERE id=$id',{$id:id,$now:now()}); return Promise.resolve(); }
  purgeMember(id: string): Promise<void> { this.run('DELETE FROM members WHERE id=$id',{$id:id}); return Promise.resolve(); }

  getAccounts(memberId?: string): Promise<Account[]> {
    let sql = 'SELECT * FROM accounts WHERE deleted_at IS NULL';
    const params: Record<string, string | number | null> = {};
    if (memberId) { sql += ' AND member_id=$mid'; params.$mid = memberId; }
    return Promise.resolve(this.query<Record<string, unknown>>(sql, params).map(rowToAccount));
  }

  getAccountById(id: string): Promise<Account | null> {
    const r = this.queryOne<Record<string, unknown>>('SELECT * FROM accounts WHERE id=$id', { $id: id });
    return Promise.resolve(r ? rowToAccount(r) : null);
  }

  saveAccount(account: Account): Promise<void> {
    this.run(`INSERT INTO accounts (id,member_id,name,type,balance,currency,icon,color,is_active,metadata,created_at,updated_at)
      VALUES ($id,$mid,$name,$type,$bal,$cur,$icon,$color,$active,$meta,$created,$updated)
      ON CONFLICT(id) DO UPDATE SET member_id=$mid,name=$name,type=$type,balance=$bal,
      currency=$cur,icon=$icon,color=$color,is_active=$active,metadata=$meta,updated_at=$updated`,
      { $id: account.id, $mid: account.memberId ?? null, $name: account.name, $type: account.type, $bal: account.balance,
        $cur: account.currency, $icon: account.icon ?? null, $color: account.color ?? null,
        $active: account.isActive ? 1 : 0, $meta: JSON.stringify(account.metadata),
        $created: account.createdAt, $updated: now() });
    return Promise.resolve();
  }

  softDeleteAccount(id: string): Promise<void> { this.run('UPDATE accounts SET deleted_at=$now,updated_at=$now WHERE id=$id',{$id:id,$now:now()}); return Promise.resolve(); }
  restoreAccount(id: string): Promise<void> { this.run('UPDATE accounts SET deleted_at=NULL,updated_at=$now WHERE id=$id',{$id:id,$now:now()}); return Promise.resolve(); }
  purgeAccount(id: string): Promise<void> { this.run('DELETE FROM accounts WHERE id=$id',{$id:id}); return Promise.resolve(); }

  getTransactions(filters?: TransactionFilter): Promise<Transaction[]> {
    let sql = 'SELECT * FROM transactions WHERE deleted_at IS NULL';
    const params: Record<string, string | number | null> = {};
    if (filters?.memberId) { sql += ' AND member_id=$mid'; params.$mid = filters.memberId; }
    if (filters?.accountId) { sql += ' AND (source_account=$aid OR dest_account=$aid)'; params.$aid = filters.accountId; }
    if (filters?.accountIds && filters.accountIds.length > 0) {
      const clauses = filters.accountIds.map((_, i) => `$aid${i}`);
      sql += ` AND (source_account IN (${clauses.join(',')}) OR dest_account IN (${clauses.join(',')}))`;
      filters.accountIds.forEach((id, i) => { params[`$aid${i}`] = id; });
    }
    if (filters?.type) { sql += ' AND type=$type'; params.$type = filters.type; }
    if (filters?.loanRef) { sql += ' AND loan_ref=$ref'; params.$ref = filters.loanRef; }
    if (filters?.startDate) { sql += ' AND date>=$start'; params.$start = filters.startDate; }
    if (filters?.endDate) { sql += ' AND date<=$end'; params.$end = filters.endDate; }
    sql += ' ORDER BY date DESC, created_at DESC';
    if (filters?.limit) sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) sql += ` OFFSET ${filters.offset}`;
    return Promise.resolve(this.query<Record<string, unknown>>(sql, params).map(rowToTransaction));
  }

  getTransactionById(id: string): Promise<Transaction | null> {
    const r = this.queryOne<Record<string, unknown>>('SELECT * FROM transactions WHERE id=$id', { $id: id });
    return Promise.resolve(r ? rowToTransaction(r) : null);
  }

  private validateTransaction(tx: Transaction): void {
    if (!tx.amount || !isFinite(tx.amount) || tx.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
    const desc = (tx.description ?? '').trim();
    if (desc.length < 1) throw new Error('Description is required');
    if (desc.length > 200) throw new Error('Description must be 200 characters or less');

    if (!tx.date || isNaN(Date.parse(tx.date))) throw new Error('Valid date is required');

    if (!tx.memberId) throw new Error('Member is required');
    const member = this.queryOne<Record<string, unknown>>('SELECT id FROM members WHERE id=$id AND deleted_at IS NULL', { $id: tx.memberId });
    if (!member) throw new Error('Member not found');

    if (tx.type === 'expense' || tx.type === 'transfer' || tx.type === 'loan_issue' || tx.type === 'loan_paidback' || tx.type === 'lend' || tx.type === 'repay') {
      if (!tx.sourceAccount) throw new Error('Source account is required');
      const src = this.queryOne<Record<string, unknown>>('SELECT id,is_active,balance FROM accounts WHERE id=$id AND deleted_at IS NULL', { $id: tx.sourceAccount });
      if (!src) throw new Error('Source account not found');
      if ((src.is_active as number) !== 1) throw new Error('Source account is inactive');
    }

    if (tx.type === 'income' || tx.type === 'transfer' || tx.type === 'loan_repayment' || tx.type === 'loan_received' || tx.type === 'lend' || tx.type === 'repay') {
      if (!tx.destAccount) throw new Error('Destination account is required');
      const dst = this.queryOne<Record<string, unknown>>('SELECT id,is_active FROM accounts WHERE id=$id AND deleted_at IS NULL', { $id: tx.destAccount });
      if (!dst) throw new Error('Destination account not found');
      if ((dst.is_active as number) !== 1) throw new Error('Destination account is inactive');
    }

    if (tx.type === 'transfer') {
      if (tx.sourceAccount === tx.destAccount) throw new Error('Source and destination must differ');
    }

    if (tx.type === 'loan_issue' && tx.sourceAccount && tx.destAccount && tx.sourceAccount === tx.destAccount) {
      throw new Error('Source and destination must differ for account-to-account loans');
    }
    if (tx.type === 'loan_repayment' && tx.sourceAccount && tx.destAccount && tx.sourceAccount === tx.destAccount) {
      throw new Error('Repayment source and destination must differ');
    }
    if ((tx.type === 'lend' || tx.type === 'repay') && tx.sourceAccount && tx.destAccount && tx.sourceAccount === tx.destAccount) {
      throw new Error('Source and destination must differ for lend/repay transactions');
    }
  }

  private saveTransactionToDb(tx: Transaction): void {
    this.run(`INSERT INTO transactions (id,type,description,amount,source_account,dest_account,member_id,debtor_id,loan_ref,date,metadata,created_at,updated_at)
      VALUES ($id,$type,$desc,$amt,$src,$dst,$mid,$did,$loan,$date,$meta,$created,$updated)
      ON CONFLICT(id) DO UPDATE SET type=$type,description=$desc,amount=$amt,
      source_account=$src,dest_account=$dst,member_id=$mid,debtor_id=$did,
      loan_ref=$loan,date=$date,metadata=$meta,updated_at=$updated`,
      { $id: tx.id, $type: tx.type, $desc: tx.description, $amt: tx.amount, $src: tx.sourceAccount ?? null,
        $dst: tx.destAccount ?? null, $mid: tx.memberId, $did: tx.debtorId ?? null, $loan: tx.loanRef ?? null,
        $date: tx.date, $meta: JSON.stringify(tx.metadata), $created: tx.createdAt, $updated: now() });
  }

  saveTransaction(tx: Transaction): Promise<void> {
    this.validateTransaction(tx);
    this.saveTransactionToDb(tx);
    this.applyBalanceChange(tx.type, tx.amount, tx.sourceAccount, tx.destAccount);
    return Promise.resolve();
  }

  updateTransaction(id: string, tx: Transaction): Promise<void> {
    const old = this.queryOne<Record<string, unknown>>('SELECT * FROM transactions WHERE id=$id', { $id: id });
    if (old) {
      const oldTx = rowToTransaction(old);
      this.applyBalanceChange(oldTx.type, -oldTx.amount, oldTx.sourceAccount, oldTx.destAccount);
    }
    this.saveTransactionToDb(tx);
    this.applyBalanceChange(tx.type, tx.amount, tx.sourceAccount, tx.destAccount);
    return Promise.resolve();
  }

  softDeleteTransaction(id: string): Promise<void> {
    const tx = this.queryOne<Record<string, unknown>>('SELECT * FROM transactions WHERE id=$id AND deleted_at IS NULL', { $id: id });
    if (tx) {
      const t = rowToTransaction(tx);
      this.applyBalanceChange(t.type, -t.amount, t.sourceAccount, t.destAccount);
    }
    this.run('UPDATE transactions SET deleted_at=$now,updated_at=$now WHERE id=$id',{$id:id,$now:now()});
    return Promise.resolve();
  }
  restoreTransaction(id: string): Promise<void> {
    const tx = this.queryOne<Record<string, unknown>>('SELECT * FROM transactions WHERE id=$id AND deleted_at IS NOT NULL', { $id: id });
    if (tx) {
      const t = rowToTransaction(tx);
      this.applyBalanceChange(t.type, t.amount, t.sourceAccount, t.destAccount);
    }
    this.run('UPDATE transactions SET deleted_at=NULL,updated_at=$now WHERE id=$id',{$id:id,$now:now()});
    return Promise.resolve();
  }
  purgeTransaction(id: string): Promise<void> { this.run('DELETE FROM transactions WHERE id=$id',{$id:id}); return Promise.resolve(); }

  private applyBalanceChange(type: string, amount: number, sourceAccount?: string, destAccount?: string): void {
    if (type === 'income' && destAccount) {
      this.run('UPDATE accounts SET balance=balance+$amt,updated_at=$now WHERE id=$id',{$id:destAccount,$amt:amount,$now:now()});
    } else if (type === 'expense' && sourceAccount) {
      this.run('UPDATE accounts SET balance=balance-$amt,updated_at=$now WHERE id=$id',{$id:sourceAccount,$amt:amount,$now:now()});
    } else if (type === 'transfer') {
      if (sourceAccount) this.run('UPDATE accounts SET balance=balance-$amt,updated_at=$now WHERE id=$id',{$id:sourceAccount,$amt:amount,$now:now()});
      if (destAccount) this.run('UPDATE accounts SET balance=balance+$amt,updated_at=$now WHERE id=$id',{$id:destAccount,$amt:amount,$now:now()});
    } else if (type === 'loan_issue' || type === 'loan_repayment' || type === 'loan_received' || type === 'loan_paidback' || type === 'lend' || type === 'repay') {
      if (sourceAccount) this.run('UPDATE accounts SET balance=balance-$amt,updated_at=$now WHERE id=$id',{$id:sourceAccount,$amt:amount,$now:now()});
      if (destAccount) this.run('UPDATE accounts SET balance=balance+$amt,updated_at=$now WHERE id=$id',{$id:destAccount,$amt:amount,$now:now()});
    }
  }

  getAccountGroups(): Promise<AccountGroup[]> {
    return Promise.resolve(this.query<Record<string, unknown>>('SELECT * FROM account_groups WHERE deleted_at IS NULL ORDER BY sort_order').map(rowToGroup));
  }

  async getAccountGroupsWithMembers(): Promise<(AccountGroup & { accountIds: string[] })[]> {
    const groups = await this.getAccountGroups();
    return groups.map((g) => ({
      ...g, accountIds: this.query<{ account_id: string }>(
        'SELECT account_id FROM account_group_mappings WHERE account_group_id=$gid', { $gid: g.id },
      ).map((r) => r.account_id),
    }));
  }

  saveAccountGroup(group: AccountGroup): Promise<void> {
    this.run(`INSERT INTO account_groups (id,name,sort_order,metadata)
      VALUES ($id,$name,$sort,$meta)
      ON CONFLICT(id) DO UPDATE SET name=$name,sort_order=$sort,metadata=$meta`,
      { $id: group.id, $name: group.name, $sort: group.sortOrder, $meta: JSON.stringify(group.metadata) });
    return Promise.resolve();
  }

  softDeleteAccountGroup(id: string): Promise<void> {
    this.run('UPDATE account_groups SET deleted_at=$now WHERE id=$id',{$id:id,$now:now()});
    return Promise.resolve();
  }

  addGroupAccount(groupId: string, accountId: string): Promise<void> {
    this.run('INSERT OR IGNORE INTO account_group_mappings (id,account_group_id,account_id) VALUES ($id,$gid,$aid)',
      { $id: `${groupId}_${accountId}`, $gid: groupId, $aid: accountId });
    return Promise.resolve();
  }

  removeGroupAccount(groupId: string, accountId: string): Promise<void> {
    this.run('DELETE FROM account_group_mappings WHERE account_group_id=$gid AND account_id=$aid',
      { $gid: groupId, $aid: accountId });
    return Promise.resolve();
  }

  getGroupAccountIds(groupId: string): Promise<string[]> {
    return Promise.resolve(this.query<{ account_id: string }>(
      'SELECT account_id FROM account_group_mappings WHERE account_group_id=$gid', { $gid: groupId },
    ).map((r) => r.account_id));
  }

  getDeletedItems(type?: 'transaction' | 'account'): Promise<DeletedItem[]> {
    const items: DeletedItem[] = [];
    const types = type ? [type] : ['transaction', 'account'];
    if (types.includes('transaction')) items.push(...this.query<Record<string, unknown>>(
      "SELECT id, 'transaction' as t, description as name, amount, deleted_at FROM transactions WHERE deleted_at IS NOT NULL",
    ).map((r) => ({ id: r.id as string, type: 'transaction' as const, name: r.name as string, amount: r.amount as number, deletedAt: r.deleted_at as string })));
    if (types.includes('account')) items.push(...this.query<Record<string, unknown>>(
      "SELECT id, 'account' as t, name, balance as amount, deleted_at FROM accounts WHERE deleted_at IS NOT NULL",
    ).map((r) => ({ id: r.id as string, type: 'account' as const, name: r.name as string, amount: r.amount as number, deletedAt: r.deleted_at as string })));
    items.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
    return Promise.resolve(items);
  }

  restoreItem(id: string, type: 'transaction' | 'account'): Promise<void> { return type === 'transaction' ? this.restoreTransaction(id) : this.restoreAccount(id); }
  purgeItem(id: string, type: 'transaction' | 'account'): Promise<void> { return type === 'transaction' ? this.purgeTransaction(id) : this.purgeAccount(id); }

  async purgeExpiredItems(daysRetained: number): Promise<number> {
    const cutoff = new Date(Date.now() - daysRetained * 86400000).toISOString().replace('T', ' ').slice(0, 19);
    let count = 0;
    for (const table of ['transactions', 'accounts']) {
      const result = this.db!.exec(`DELETE FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < '${cutoff}'`);
      if (result[0]) count += result[0].values.length;
    }
    this.save();
    return count;
  }

  async getFamilySummary(): Promise<FamilySummary> {
    const r = this.queryOne<{ assets: number; cash: number; loans: number }>(
      "SELECT COALESCE(SUM(CASE WHEN type IN ('bank','savings') THEN balance ELSE 0 END),0) as assets, COALESCE(SUM(CASE WHEN type='cash' THEN balance ELSE 0 END),0) as cash, COALESCE(SUM(CASE WHEN type IN ('mobile_wallet','business') THEN balance ELSE 0 END),0) as loans FROM accounts WHERE deleted_at IS NULL",
    );
    const total = (r?.assets ?? 0) + (r?.cash ?? 0) + (r?.loans ?? 0);
    return { totalAssets: total, cashInHand: r?.cash ?? 0, activeLoans: r?.loans ?? 0, netWorth: total };
  }

  getMemberBalance(memberId: string): Promise<number> {
    const r = this.queryOne<{ total: number }>(
      'SELECT COALESCE(SUM(balance),0) as total FROM accounts WHERE member_id=$mid AND deleted_at IS NULL',
      { $mid: memberId },
    );
    return Promise.resolve(r?.total ?? 0);
  }

  getAccountGroupBalances(): Promise<GroupBalance[]> {
    return Promise.resolve(this.query<GroupBalance>(
      'SELECT g.name as groupName, COALESCE(SUM(a.balance),0) as totalBalance, COUNT(a.id) as accountCount FROM account_groups g LEFT JOIN account_group_mappings m ON m.account_group_id=g.id LEFT JOIN accounts a ON a.id=m.account_id AND a.deleted_at IS NULL WHERE g.deleted_at IS NULL GROUP BY g.id ORDER BY g.sort_order',
    ));
  }

  recalculateBalances(): Promise<void> {
    this.run('UPDATE accounts SET balance=0,updated_at=$now',{ $now: now() });
    const rows = this.query<Record<string, unknown>>(
      "SELECT type,amount,source_account,dest_account FROM transactions WHERE deleted_at IS NULL ORDER BY created_at,rowid",
    );
    for (const row of rows) {
      this.applyBalanceChange(
        row.type as string,
        row.amount as number,
        (row.source_account as string) ?? undefined,
        (row.dest_account as string) ?? undefined,
      );
    }
    return Promise.resolve();
  }
}
