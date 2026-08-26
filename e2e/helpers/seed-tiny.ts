import initSqlJs from 'sql.js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function id(label = 'x') {
  return `${label}_${randomUUID().slice(0, 8)}`;
}

let cachedB64: string | null = null;

/**
 * Deterministic tiny DB for e2e: 2 members, 4 accounts, ~12 txs.
 * Keywords: Travel / Groceries / Salary are searchable.
 * Returns base64 that can be injected via localStorage `moneyflows_db`.
 */
export async function seedTinyB64(): Promise<string> {
  if (cachedB64) return cachedB64;

  // Use the runtime SCHEMA from SQLiteDatabaseService (includes lend/repay + lender_account_id loans).
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

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const tinyDb = await buildTiny(SCHEMA, now);
  const b64 = Buffer.from(tinyDb).toString('base64');
  cachedB64 = b64;
  return b64;
}

async function buildTiny(schema: string, now: string): Promise<Uint8Array> {
  const initSqlJs = (await import('sql.js')).default as unknown as (opts: unknown) => Promise<{ Database: new () => { run: (s: string, p?: unknown) => void; export: () => Uint8Array; close: () => void } }>;
  const SQL = await initSqlJs({});
  const db = new SQL.Database();
  db.run(schema);

  const m1 = id('mem'), m2 = id('mem');
  db.run(`INSERT INTO members (id,name,short_name,is_external,created_at,updated_at) VALUES ($1,'Admin','Admin',0,$2,$2)`, { $1: m1, $2: now });
  db.run(`INSERT INTO members (id,name,short_name,is_external,created_at,updated_at) VALUES ($1,'Family','Fam',0,$2,$2)`, { $1: m2, $2: now });

  const aBank = id('acc'), aCash = id('acc'), aBkash = id('acc');
  db.run(`INSERT INTO accounts (id,member_id,name,type,balance,created_at,updated_at) VALUES ($1,$2,'DBBL','bank',100000,$3,$3)`, { $1: aBank, $2: m1, $3: now });
  db.run(`INSERT INTO accounts (id,member_id,name,type,balance,created_at,updated_at) VALUES ($1,$2,'Cash','cash',50000,$3,$3)`, { $1: aCash, $2: m1, $3: now });
  db.run(`INSERT INTO accounts (id,member_id,name,type,balance,created_at,updated_at) VALUES ($1,$2,'bKash','mobile_wallet',20000,$3,$3)`, { $1: aBkash, $2: m1, $3: now });

  const cp = id('acc');
  db.run(`INSERT INTO accounts (id,member_id,name,type,balance,created_at,updated_at) VALUES ($1,NULL,'Rafiq','counterparty',0,$2,$2)`, { $1: cp, $2: now });

  const tx = (type: string, desc: string, amt: number, src: string | null, dst: string | null, date: string) =>
    db.run(`INSERT INTO transactions (id,type,description,amount,source_account,dest_account,member_id,date,created_at,updated_at,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,'{}')`,
      { $1: id('tx'), $2: type, $3: desc, $4: amt, $5: src, $6: dst, $7: m1, $8: date, $9: now });

  tx('income', 'Salary January', 50000, null, aBank, '2026-01-05');
  tx('expense', 'Groceries - Weekly', 2500, aCash, null, '2026-01-08');
  tx('expense', 'Travel to Cox Bazar', 12000, aBank, null, '2026-01-10');
  tx('transfer', 'ATM Cash', 10000, aBank, aCash, '2026-01-11');
  tx('expense', 'Groceries - Eid', 8000, aCash, null, '2026-01-12');
  tx('income', 'Salary February', 50000, null, aBank, '2026-02-05');
  tx('expense', 'Travel to Dhaka', 3000, aCash, null, '2026-02-08');
  tx('expense', 'Medical Groceries', 1500, aCash, null, '2026-02-09');
  tx('lend', 'Loan to Rafiq', 20000, aBank, cp, '2026-02-10');
  tx('repay', 'Rafiq Repay Travel', 5000, cp, aBank, '2026-02-15');
  tx('expense', 'Travel Groceries mix', 1000, aCash, null, '2026-02-16');
  tx('income', 'Freelance Travel', 7000, null, aBank, '2026-02-17');

  // Recalc balances
  db.run('UPDATE accounts SET balance=0');
  const rows = (db as unknown as { exec: (s: string) => { values: unknown[][] }[] }).exec("SELECT type,amount,source_account,dest_account FROM transactions WHERE deleted_at IS NULL");
  for (const vs of rows[0]?.values ?? []) {
    const [type, amount, src, dst] = vs as [string, number, string | null, string | null];
    if (type === 'income' && dst) db.run('UPDATE accounts SET balance=balance+$1 WHERE id=$2', { $1: amount, $2: dst });
    if ((type === 'expense' || type === 'transfer') && src) db.run('UPDATE accounts SET balance=balance-$1 WHERE id=$2', { $1: amount, $2: src });
    if (type === 'transfer' && dst) db.run('UPDATE accounts SET balance=balance+$1 WHERE id=$2', { $1: amount, $2: dst });
    if (['lend','repay'].includes(type)) {
      if (src) db.run('UPDATE accounts SET balance=balance-$1 WHERE id=$2', { $1: amount, $2: src });
      if (dst) db.run('UPDATE accounts SET balance=balance+$1 WHERE id=$2', { $1: amount, $2: dst });
    }
  }

  const data = db.export();
  db.close();
  return data;
}
