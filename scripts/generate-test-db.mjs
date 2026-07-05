import initSqlJs from 'sql.js';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

function id(label = 'x') {
  const u = randomUUID();
  return `${label}_${u.slice(0, 8)}`;
}

// ---------------------------------------------------------------------------
// Schema (mirrors SQLiteDatabaseService.SCHEMA)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Generate data
// ---------------------------------------------------------------------------
const SQL = await initSqlJs();
const db = new SQL.Database();
db.run(SCHEMA);

// ── Members ────────────────────────────────────────────────────────────────
const members = [
  { name: 'এফটি নূর', short: 'Efty', email: 'efty@example.com', phone: '01711-111111', ext: 0 },
  { name: 'নুসরাত জাহান', short: 'Nusrat', email: 'nusrat@example.com', phone: '01711-111112', ext: 0 },
  { name: 'শাহিদুল ইসলাম', short: 'Shahid', email: 'shahid@example.com', phone: '01711-111113', ext: 0 },
  { name: 'ফারজানা বেগম', short: 'Farzana', email: 'farzana@example.com', phone: '01711-111114', ext: 0 },
];
const memIds = members.map(() => id('mem'));
for (const m of members) {
  db.run(
    `INSERT INTO members (id,name,short_name,email,phone,is_external,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
    { $1: memIds[members.indexOf(m)], $2: m.name, $3: m.short, $4: m.email, $5: m.phone, $6: m.ext, $7: now },
  );
}

// ── Counterparties (external debtors) ──────────────────────────────────────
const counterpartyMembers = [
  { name: 'রফিকুল ইসলাম', short: 'Rafiq', phone: '01722-222221' },
  { name: 'জসিম উদ্দিন', short: 'Jashim', phone: '01722-222222' },
  { name: 'মালেকা খাতুন', short: 'Maleka', phone: '01722-222223' },
];
const cpMemberIds = counterpartyMembers.map(() => id('mcp'));
for (const cpm of counterpartyMembers) {
  db.run(
    `INSERT INTO members (id,name,short_name,phone,is_external,created_at,updated_at)
     VALUES ($1,$2,$3,$4,1,$5,$5)`,
    { $1: cpMemberIds[counterpartyMembers.indexOf(cpm)], $2: cpm.name, $3: cpm.short, $4: cpm.phone, $5: now },
  );
}

// ── Accounts ───────────────────────────────────────────────────────────────
const accs = [
  // member 0 — Efty
  { mid: memIds[0], name: 'ডাচ্-বাংলা ব্যাংক', type: 'bank', bal: 125000, icon: '🏦', color: '#6366f1' },
  { mid: memIds[0], name: 'বিকাশ', type: 'mobile_wallet', bal: 45000, icon: '📱', color: '#ec4899' },
  { mid: memIds[0], name: 'নগদ', type: 'cash', bal: 32000, icon: '💵', color: '#22c55e' },
  // member 1 — Nusrat
  { mid: memIds[1], name: 'নগদ', type: 'mobile_wallet', bal: 28000, icon: '📱', color: '#f59e0b' },
  { mid: memIds[1], name: 'হাত খরচ', type: 'cash', bal: 12000, icon: '💵', color: '#22c55e' },
  // member 2 — Shahid
  { mid: memIds[2], name: 'নগদ', type: 'cash', bal: 85000, icon: '💵', color: '#22c55e' },
  // member 3 — Farzana
  { mid: memIds[3], name: 'সঞ্চয়', type: 'savings', bal: 60000, icon: '🏦', color: '#8b5cf6' },
  // counterparty accounts
  { mid: null, name: 'রফিকুল ইসলাম', type: 'counterparty', bal: 0, icon: '👤', color: '#ef4444' },
  { mid: null, name: 'জসিম উদ্দিন', type: 'counterparty', bal: 0, icon: '👤', color: '#ef4444' },
  { mid: null, name: 'মালেকা খাতুন', type: 'counterparty', bal: 0, icon: '👤', color: '#ef4444' },
];
const accIds = accs.map(() => id('acc'));
for (const a of accs) {
  db.run(
    `INSERT INTO accounts (id,member_id,name,type,balance,currency,icon,color,is_active,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,'BDT',$6,$7,1,$8,$8)`,
    {
      $1: accIds[accs.indexOf(a)], $2: a.mid, $3: a.name, $4: a.type,
      $5: a.bal, $6: a.icon, $7: a.color, $8: now,
    },
  );
}

// Named references for readability
const EFTY_DBB = accIds[0];
const EFTY_BKASH = accIds[1];
const EFTY_CASH = accIds[2];
const NUSRAT_NAGAD = accIds[3];
const NUSRAT_CASH = accIds[4];
const SHAHID_CASH = accIds[5];
const FARZANA_SAVINGS = accIds[6];
const RAFIQ_ACC = accIds[7];
const JASHIM_ACC = accIds[8];
const MALEKA_ACC = accIds[9];

// ── Account Groups ─────────────────────────────────────────────────────────
const groupId1 = id('grp');
const groupId2 = id('grp');
db.run(
  `INSERT INTO account_groups (id,name,sort_order) VALUES ($1,'পারিবারিক তহবিল',0)`,
  { $1: groupId1 },
);
db.run(
  `INSERT INTO account_groups (id,name,sort_order) VALUES ($1,'স্থায়ী সম্পদ',1)`,
  { $1: groupId2 },
);
for (const aid of [EFTY_CASH, NUSRAT_CASH, SHAHID_CASH]) {
  db.run(
    `INSERT INTO account_group_mappings (id,account_group_id,account_id) VALUES ($1,$2,$3)`,
    { $1: id('map'), $2: groupId1, $3: aid },
  );
}
for (const aid of [EFTY_DBB, FARZANA_SAVINGS]) {
  db.run(
    `INSERT INTO account_group_mappings (id,account_group_id,account_id) VALUES ($1,$2,$3)`,
    { $1: id('map'), $2: groupId2, $3: aid },
  );
}

// ── Transactions ───────────────────────────────────────────────────────────
// Helper: insert a transaction and update account balances
function insertTx(type, desc, amount, src, dst, mid, date, loanRef = null, debtorId = null) {
  const tid = id('tx');
  const member = mid ?? memIds[0];
  const metadata = '{}';
  db.run(
    `INSERT INTO transactions (id,type,description,amount,source_account,dest_account,member_id,debtor_id,loan_ref,date,created_at,updated_at,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12)`,
    {
      $1: tid, $2: type, $3: desc, $4: amount,
      $5: src, $6: dst, $7: member, $8: debtorId, $9: loanRef,
      $10: date, $11: now, $12: metadata,
    },
  );
  return tid;
}

// Helper: update outstanding on a loan
function setOutstanding(loanId, outstanding) {
  db.run('UPDATE loans SET outstanding=$1,updated_at=$2 WHERE id=$3', { $1: outstanding, $2: now, $3: loanId });
}

// -- Salary income (Efty) --
insertTx('income', 'বেতন - জানুয়ারি ২০২৬', 85000, null, EFTY_DBB, memIds[0], '2026-01-05');
insertTx('income', 'বেতন - ফেব্রুয়ারি ২০২৬', 85000, null, EFTY_DBB, memIds[0], '2026-02-05');
insertTx('income', 'বেতন - মার্চ ২০২৬', 90000, null, EFTY_DBB, memIds[0], '2026-03-05');
insertTx('income', 'ফ্রিল্যান্সিং আয়', 45000, null, EFTY_DBB, memIds[0], '2026-03-12');
insertTx('income', 'বেতন - এপ্রিল ২০২৬', 90000, null, EFTY_DBB, memIds[0], '2026-04-05');
insertTx('income', 'বেতন - মে ২০২৬', 90000, null, EFTY_DBB, memIds[0], '2026-05-05');
insertTx('income', 'বেতন - জুন ২০২৬', 95000, null, EFTY_DBB, memIds[0], '2026-06-05');

// -- Expenses --
insertTx('expense', 'বাজার খরচ', 8500, EFTY_CASH, null, memIds[0], '2026-01-08');
insertTx('expense', 'ইলেকট্রিক বিল', 4200, EFTY_DBB, null, memIds[0], '2026-01-12');
insertTx('expense', 'বাজার খরচ', 7200, EFTY_CASH, null, memIds[0], '2026-02-10');
insertTx('expense', 'গ্যাস বিল', 1850, EFTY_DBB, null, memIds[0], '2026-02-15');
insertTx('expense', 'পরিবার ভ্রমণ - কক্সবাজার', 25000, EFTY_DBB, null, memIds[0], '2026-03-20');
insertTx('expense', 'ঔষধ', 2300, EFTY_CASH, null, memIds[0], '2026-04-05');
insertTx('expense', 'বাজার খরচ', 9100, EFTY_CASH, null, memIds[0], '2026-04-12');
insertTx('expense', 'মোবাইল রিচার্জ', 500, EFTY_BKASH, null, memIds[0], '2026-04-15');
insertTx('expense', 'বাজার খরচ', 7800, EFTY_CASH, null, memIds[0], '2026-05-08');
insertTx('expense', 'ঈদ বাজার', 32000, EFTY_CASH, null, memIds[0], '2026-05-20');
insertTx('expense', 'ডাক্তার ফি', 1500, EFTY_CASH, null, memIds[0], '2026-06-02');
insertTx('expense', 'বাজার খরচ', 6500, EFTY_CASH, null, memIds[0], '2026-06-10');

// -- Transfers --
insertTx('transfer', 'এটিএম থেকে টাকা তোলা', 15000, EFTY_DBB, EFTY_CASH, memIds[0], '2026-01-06');
insertTx('transfer', 'বিকাশে টাকা', 10000, EFTY_DBB, EFTY_BKASH, memIds[0], '2026-02-01');
insertTx('transfer', 'এটিএম থেকে টাকা তোলা', 20000, EFTY_DBB, EFTY_CASH, memIds[0], '2026-03-01');
insertTx('transfer', 'বিকাশে টাকা', 8000, EFTY_DBB, EFTY_BKASH, memIds[0], '2026-04-01');
insertTx('transfer', 'নুসরাতকে নগদ', 10000, EFTY_CASH, NUSRAT_CASH, memIds[0], '2026-04-10');
insertTx('transfer', 'এটিএম থেকে টাকা তোলা', 12000, EFTY_DBB, EFTY_CASH, memIds[0], '2026-05-01');
insertTx('transfer', 'বিকাশ থেকে নগদ', 5000, EFTY_BKASH, EFTY_CASH, memIds[0], '2026-05-15');
insertTx('transfer', 'নাগাদে টাকা', 7000, EFTY_DBB, NUSRAT_NAGAD, memIds[0], '2026-05-22');
insertTx('transfer', 'বাবার জন্য নগদ', 5000, EFTY_DBB, SHAHID_CASH, memIds[2], '2026-06-01');
insertTx('transfer', 'এটিএম থেকে টাকা তোলা', 10000, EFTY_DBB, EFTY_CASH, memIds[0], '2026-06-05');

// Nusrat's expenses
insertTx('expense', 'বাজার খরচ', 3400, NUSRAT_CASH, null, memIds[1], '2026-04-12');
insertTx('expense', 'কসমেটিক্স', 2200, NUSRAT_NAGAD, null, memIds[1], '2026-04-18');
insertTx('expense', 'বাজার খরচ', 4100, NUSRAT_CASH, null, memIds[1], '2026-05-10');

// -- Loans given to external counterparties --
// Loan 1: Efty lends 50000 to Rafiq
const loan1Id = id('loan');
db.run(
  `INSERT INTO loans (id,lender_account_id,borrower_account_id,principal,outstanding,status,description,created_at,updated_at)
   VALUES ($1,$2,$3,50000,30000,'active','ব্যবসার জন্য ঋণ',$4,$4)`,
  { $1: loan1Id, $2: EFTY_DBB, $3: RAFIQ_ACC, $4: now },
);
insertTx('lend', 'রফিককে ঋণ দিয়েছি', 50000, EFTY_DBB, RAFIQ_ACC, memIds[0], '2026-01-15', loan1Id);

// Loan 2: Efty lends 30000 to Jashim
const loan2Id = id('loan');
db.run(
  `INSERT INTO loans (id,lender_account_id,borrower_account_id,principal,outstanding,status,description,created_at,updated_at)
   VALUES ($1,$2,$3,30000,15000,'active','জরুরি প্রয়োজনে ঋণ',$4,$4)`,
  { $1: loan2Id, $2: EFTY_DBB, $3: JASHIM_ACC, $4: now },
);
insertTx('lend', 'জসিমকে ঋণ দিয়েছি', 30000, EFTY_DBB, JASHIM_ACC, memIds[0], '2026-02-10', loan2Id);

// Loan 3: Nusrat lends 20000 to Maleka
const loan3Id = id('loan');
db.run(
  `INSERT INTO loans (id,lender_account_id,borrower_account_id,principal,outstanding,status,description,created_at,updated_at)
   VALUES ($1,$2,$3,20000,5000,'active','ব্যবসায়িক ঋণ',$4,$4)`,
  { $1: loan3Id, $2: NUSRAT_NAGAD, $3: MALEKA_ACC, $4: now },
);
insertTx('lend', 'মালেকাকে ঋণ দিয়েছি', 20000, NUSRAT_NAGAD, MALEKA_ACC, memIds[1], '2026-03-01', loan3Id);

// -- Loan repayments received --
insertTx('repay', 'রফিকের কিস্তি', 10000, RAFIQ_ACC, EFTY_DBB, memIds[0], '2026-02-15', loan1Id);
setOutstanding(loan1Id, 40000);
insertTx('repay', 'রফিকের কিস্তি', 10000, RAFIQ_ACC, EFTY_DBB, memIds[0], '2026-04-10', loan1Id);
setOutstanding(loan1Id, 30000);
insertTx('repay', 'জসিমের কিস্তি', 10000, JASHIM_ACC, EFTY_DBB, memIds[0], '2026-03-15', loan2Id);
setOutstanding(loan2Id, 20000);
insertTx('repay', 'জসিমের কিস্তি', 5000, JASHIM_ACC, EFTY_DBB, memIds[0], '2026-05-10', loan2Id);
setOutstanding(loan2Id, 15000);
insertTx('repay', 'মালেকার কিস্তি', 15000, MALEKA_ACC, NUSRAT_NAGAD, memIds[1], '2026-04-15', loan3Id);
setOutstanding(loan3Id, 5000);

// -- Internal loan (Efty lends to Shahid) --
const loan4Id = id('loan');
db.run(
  `INSERT INTO loans (id,lender_account_id,borrower_account_id,principal,outstanding,status,description,created_at,updated_at)
   VALUES ($1,$2,$3,30000,0,'settled','বাবাকে দেওয়া ঋণ (পরিশোধিত)',$4,$4)`,
  { $1: loan4Id, $2: EFTY_DBB, $3: SHAHID_CASH, $4: now },
);
insertTx('lend', 'বাবাকে ঋণ', 30000, EFTY_DBB, SHAHID_CASH, memIds[0], '2026-01-20', loan4Id, memIds[2]);
insertTx('repay', 'বাবার ঋণ শোধ', 30000, SHAHID_CASH, EFTY_DBB, memIds[2], '2026-03-10', loan4Id, memIds[2]);
setOutstanding(loan4Id, 0);
db.run('UPDATE loans SET status=\'settled\' WHERE id=$1', { $1: loan4Id });

// -- Future-dated transaction (for testing upcoming) --
insertTx('income', 'বেতন - জুলাই ২০২৬', 95000, null, EFTY_DBB, memIds[0], '2026-07-05');
insertTx('expense', 'বাড়ি ভাড়া', 15000, EFTY_DBB, null, memIds[0], '2026-07-01');

// Recalculate balances from scratch
db.run("UPDATE accounts SET balance=0,updated_at=$1", { $1: now });
const txRows = db.exec(
  "SELECT type,amount,source_account,dest_account FROM transactions WHERE deleted_at IS NULL ORDER BY created_at,rowid",
);
for (const row of txRows) {
  for (const vals of row.values) {
    const [type, amount, src, dst] = vals;
    if (type === 'income' && dst) {
      db.run('UPDATE accounts SET balance=balance+$1 WHERE id=$2', { $1: amount, $2: dst });
    } else if ((type === 'expense' || type === 'transfer') && src) {
      db.run('UPDATE accounts SET balance=balance-$1 WHERE id=$2', { $1: amount, $2: src });
    }
    if (type === 'transfer' && dst) {
      db.run('UPDATE accounts SET balance=balance+$1 WHERE id=$2', { $1: amount, $2: dst });
    }
    if (['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback'].includes(type)) {
      if (src) db.run('UPDATE accounts SET balance=balance-$1 WHERE id=$2', { $1: amount, $2: src });
      if (dst) db.run('UPDATE accounts SET balance=balance+$1 WHERE id=$2', { $1: amount, $2: dst });
    }
  }
}

// ── Export ─────────────────────────────────────────────────────────────────
const outPath = resolve(__dirname, '..', 'test.db');
const data = db.export();
writeFileSync(outPath, Buffer.from(data));
console.log(`✅ test.db created at ${outPath}`);
console.log(`   Members:       ${members.length + counterpartyMembers.length}`);
console.log(`   Accounts:      ${accs.length}`);
console.log(`   Transactions:  ${db.exec('SELECT COUNT(*) as c FROM transactions')[0].values[0][0]}`);
console.log(`   Loans:         ${db.exec('SELECT COUNT(*) as c FROM loans')[0].values[0][0]}`);
console.log('');
console.log('📥 Import this file via app Settings → Import .db file');
db.close();
