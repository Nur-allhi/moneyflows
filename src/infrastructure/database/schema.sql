CREATE TABLE IF NOT EXISTS members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  short_name  TEXT,
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  is_external INTEGER NOT NULL DEFAULT 0,
  metadata    TEXT DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_members_deleted ON members(deleted_at);

CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES members(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('bank', 'mobile_wallet', 'cash', 'savings', 'business')),
  balance     REAL NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'BDT',
  icon        TEXT,
  color       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  metadata    TEXT DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounts_member ON accounts(member_id);
CREATE INDEX IF NOT EXISTS idx_accounts_deleted ON accounts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer', 'loan_issue', 'loan_repayment')),
  description     TEXT NOT NULL,
  amount          REAL NOT NULL CHECK(amount > 0),
  source_account  TEXT REFERENCES accounts(id),
  dest_account    TEXT REFERENCES accounts(id),
  member_id       TEXT NOT NULL REFERENCES members(id),
  debtor_id       TEXT REFERENCES members(id),
  loan_ref        TEXT,
  date            TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT,
  metadata        TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(source_account);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_debtor ON transactions(debtor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_loan_ref ON transactions(loan_ref);

CREATE TABLE IF NOT EXISTS account_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  metadata    TEXT DEFAULT '{}',
  deleted_at  TEXT
);

CREATE TABLE IF NOT EXISTS account_group_mappings (
  id              TEXT PRIMARY KEY,
  account_group_id TEXT NOT NULL REFERENCES account_groups(id),
  account_id      TEXT NOT NULL REFERENCES accounts(id),
  UNIQUE(account_group_id, account_id)
);
