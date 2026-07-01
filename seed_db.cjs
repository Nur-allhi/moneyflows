const initSqlJs = require('sql.js');
const fs = require('fs');

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, short_name TEXT, email TEXT, phone TEXT,
    avatar_url TEXT, is_external INTEGER NOT NULL DEFAULT 0, metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('bank','mobile_wallet','cash','savings','business')),
    balance REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'BDT',
    icon TEXT, color TEXT, is_active INTEGER NOT NULL DEFAULT 1, metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, description TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0), source_account TEXT REFERENCES accounts(id),
    dest_account TEXT REFERENCES accounts(id), member_id TEXT NOT NULL REFERENCES members(id),
    debtor_id TEXT REFERENCES members(id), loan_ref TEXT, date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT,
    metadata TEXT DEFAULT '{}'
  )`);

  db.run("INSERT INTO members (id, name, short_name, is_external) VALUES ('m1', 'Efty', 'Efty', 0)");
  db.run("INSERT INTO members (id, name, short_name, is_external) VALUES ('m2', 'Sarah', 'Sarah', 0)");
  db.run("INSERT INTO members (id, name, short_name, is_external) VALUES ('m3', 'Bank', 'Bank', 1)");

  db.run("INSERT INTO accounts (id, member_id, name, type, balance) VALUES ('a1', 'm1', 'Cash', 'cash', 50000)");
  db.run("INSERT INTO accounts (id, member_id, name, type, balance) VALUES ('a2', 'm1', 'bKash', 'mobile_wallet', 25000)");
  db.run("INSERT INTO accounts (id, member_id, name, type, balance) VALUES ('a3', 'm2', 'Savings', 'savings', 100000)");
  db.run("INSERT INTO accounts (id, member_id, name, type, balance) VALUES ('a4', 'm3', 'Bank Account', 'bank', 500000)");

  for (let i = 0; i < 30; i++) {
    const types = ['income','expense','transfer'];
    const t = types[i % 3];
    const amt = Math.floor(Math.random() * 10000) + 500;
    const txId = 'tx' + i;
    const desc = t.charAt(0).toUpperCase() + t.slice(1) + ' #' + (i + 1);

    if (t === 'income') {
      const src = i % 2 === 0 ? null : 'a3';
      const dst = i % 2 === 0 ? 'a1' : 'a3';
      const mid = i % 2 === 0 ? 'm1' : 'm2';
      db.run("INSERT INTO transactions (id, type, description, amount, source_account, dest_account, member_id, date) VALUES (?, 'income', ?, ?, ?, ?, ?, datetime('now', ?))",
        [txId, desc, amt, src, dst, mid, '-' + (29 - i) + ' days']);
    } else if (t === 'expense') {
      const src = i % 2 === 0 ? 'a1' : 'a2';
      const mid = 'm1';
      db.run("INSERT INTO transactions (id, type, description, amount, source_account, dest_account, member_id, date) VALUES (?, 'expense', ?, ?, ?, NULL, ?, datetime('now', ?))",
        [txId, desc, amt, src, mid, '-' + (29 - i) + ' days']);
    } else {
      const src = i % 2 === 0 ? 'a1' : 'a2';
      const dst = i % 2 === 0 ? 'a2' : 'a1';
      db.run("INSERT INTO transactions (id, type, description, amount, source_account, dest_account, member_id, date) VALUES (?, 'transfer', ?, ?, ?, ?, ?, datetime('now', ?))",
        [txId, desc, amt, src, dst, 'm1', '-' + (29 - i) + ' days']);
    }
  }

  const data = db.export();
  const base64 = Buffer.from(data).toString('base64');
  console.log(base64);
}

main().catch(console.error);
