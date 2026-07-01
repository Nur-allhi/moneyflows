const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY,name TEXT NOT NULL,short_name TEXT,email TEXT,phone TEXT,avatar_url TEXT,is_external INTEGER NOT NULL DEFAULT 0,metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT)",
  'CREATE INDEX IF NOT EXISTS idx_members_deleted ON members(deleted_at)',
  "CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY,member_id TEXT REFERENCES members(id),name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('bank','mobile_wallet','cash','savings','business','counterparty')),balance REAL NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'BDT',icon TEXT,color TEXT,is_active INTEGER NOT NULL DEFAULT 1,metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT)",
  'CREATE INDEX IF NOT EXISTS idx_accounts_member ON accounts(member_id)',
  'CREATE INDEX IF NOT EXISTS idx_accounts_deleted ON accounts(deleted_at)',
  'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type)',
  "CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY,type TEXT NOT NULL CHECK(type IN ('income','expense','transfer','loan_issue','loan_repayment','loan_received','loan_paidback')),description TEXT NOT NULL,amount REAL NOT NULL CHECK(amount > 0),source_account TEXT REFERENCES accounts(id),dest_account TEXT REFERENCES accounts(id),member_id TEXT NOT NULL REFERENCES members(id),debtor_id TEXT REFERENCES members(id),loan_ref TEXT,date TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT,metadata TEXT DEFAULT '{}')",
  'CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(source_account)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_debtor ON transactions(debtor_id)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_loan_ref ON transactions(loan_ref)',
  "CREATE TABLE IF NOT EXISTS loans (id TEXT PRIMARY KEY,direction TEXT NOT NULL CHECK(direction IN ('given','received')),counterparty_id TEXT NOT NULL REFERENCES accounts(id),amount REAL NOT NULL CHECK(amount>0),outstanding REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','settled')),description TEXT DEFAULT '',metadata TEXT DEFAULT '{}',created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')),deleted_at TEXT)",
  'CREATE INDEX IF NOT EXISTS idx_loans_counterparty ON loans(counterparty_id)',
  'CREATE INDEX IF NOT EXISTS idx_loans_direction ON loans(direction)',
  'CREATE INDEX IF NOT EXISTS idx_loans_deleted ON loans(deleted_at)',
  "CREATE TABLE IF NOT EXISTS account_groups (id TEXT PRIMARY KEY,name TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,metadata TEXT DEFAULT '{}',deleted_at TEXT)",
  'CREATE TABLE IF NOT EXISTS account_group_mappings (id TEXT PRIMARY KEY,account_group_id TEXT NOT NULL REFERENCES account_groups(id),account_id TEXT NOT NULL REFERENCES accounts(id),UNIQUE(account_group_id,account_id))',
];

function rng(seed) {
  let s = seed;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min, max, rand) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  const rand = rng(42);

  for (const sql of SCHEMA) db.run(sql);

  // --- Members ---
  const members = [
    { id: 'm1', name: 'Alice Rahman', shortName: 'Alice', isExternal: 0 },
    { id: 'm2', name: 'Bob Hasan', shortName: 'Bob', isExternal: 0 },
  ];
  for (const m of members) {
    db.run(
      "INSERT INTO members (id, name, short_name, is_external, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [m.id, m.name, m.shortName, m.isExternal, daysAgo(90), daysAgo(0)]
    );
  }

  // --- Accounts (3 per member) ---
  const accountDefs = [
    { id: 'a1', memberId: 'm1', name: 'Cash Wallet', type: 'cash', currency: 'BDT', icon: 'wallet', color: '#22c55e' },
    { id: 'a2', memberId: 'm1', name: 'bKash', type: 'mobile_wallet', currency: 'BDT', icon: 'smartphone', color: '#e11d48' },
    { id: 'a3', memberId: 'm1', name: 'Savings Account', type: 'savings', currency: 'BDT', icon: 'landmark', color: '#3b82f6' },
    { id: 'a4', memberId: 'm2', name: 'Cash', type: 'cash', currency: 'BDT', icon: 'wallet', color: '#eab308' },
    { id: 'a5', memberId: 'm2', name: 'DBBL Bank', type: 'bank', currency: 'BDT', icon: 'landmark', color: '#8b5cf6' },
    { id: 'a6', memberId: 'm2', name: 'Nagad', type: 'mobile_wallet', currency: 'BDT', icon: 'smartphone', color: '#06b6d4' },
  ];
  for (const a of accountDefs) {
    db.run(
      "INSERT INTO accounts (id, member_id, name, type, balance, currency, icon, color, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
      [a.id, a.memberId, a.name, a.type, 0, a.currency, a.icon, a.color, daysAgo(90), daysAgo(0)]
    );
  }

  const accountIds = accountDefs.map(a => a.id);

  // --- Transactions: 20 per account = 120 total ---
  const incomeDescs = ['Salary deposit', 'Freelance payment', 'Gift received', 'Dividend payout', 'Bonus credited', 'Refund received', 'Commission earned', 'Consulting fee', 'Investment return', 'Rental income', 'Cashback reward', 'Interest earned', 'Incentive bonus', 'Project payment', 'Royalty income', 'Sponsorship', 'Grant received', 'Coupon redemption', 'Tax refund', 'Miscellaneous income'];
  const expenseDescs = ['Grocery shopping', 'Electricity bill', 'Internet payment', 'Dining out', 'Fuel expense', 'Rent payment', 'Insurance premium', 'Medical bill', 'School fees', 'Transport fare', 'Phone recharge', 'Streaming subscription', 'Clothing purchase', 'Home maintenance', 'Car service', 'Pet supplies', 'Book purchase', 'Gym membership', 'Utility bill', 'Miscellaneous expense'];
  const transferDescs = ['Transfer to savings', 'Funds transfer', 'Moving money', 'Account top-up', 'Balance transfer'];

  const transactions = [];

  for (let ai = 0; ai < accountIds.length; ai++) {
    const accId = accountIds[ai];
    const acc = accountDefs[ai];
    const memberId = acc.memberId;
    const sameMemberAccounts = accountDefs.filter(a => a.memberId === memberId).map(a => a.id);

    for (let t = 0; t < 20; t++) {
      const typeRoll = rand();
      let tx;
      const date = daysAgo(randInt(0, 89, rand));

      if (typeRoll < 0.35) {
        const desc = pick(incomeDescs, rand);
        const amt = randInt(1000, 50000, rand);
        tx = {
          id: `tx_${accId}_${t}`,
          type: 'income',
          description: desc,
          amount: amt,
          sourceAccount: null,
          destAccount: accId,
          memberId,
          debtorId: null,
          loanRef: null,
          date,
        };
      } else if (typeRoll < 0.7) {
        const desc = pick(expenseDescs, rand);
        const amt = randInt(200, 15000, rand);
        tx = {
          id: `tx_${accId}_${t}`,
          type: 'expense',
          description: desc,
          amount: amt,
          sourceAccount: accId,
          destAccount: null,
          memberId,
          debtorId: null,
          loanRef: null,
          date,
        };
      } else {
        const otherAccounts = sameMemberAccounts.filter(id => id !== accId);
        if (otherAccounts.length > 0) {
          const otherAcc = pick(otherAccounts, rand);
          const desc = pick(transferDescs, rand);
          const amt = randInt(500, 20000, rand);
          const isSource = rand() < 0.5;
          tx = {
            id: `tx_${accId}_${t}`,
            type: 'transfer',
            description: desc,
            amount: amt,
            sourceAccount: isSource ? accId : otherAcc,
            destAccount: isSource ? otherAcc : accId,
            memberId,
            debtorId: null,
            loanRef: null,
            date,
          };
        } else {
          const desc = pick(incomeDescs, rand);
          const amt = randInt(1000, 50000, rand);
          tx = {
            id: `tx_${accId}_${t}`,
            type: 'income',
            description: desc,
            amount: amt,
            sourceAccount: null,
            destAccount: accId,
            memberId,
            debtorId: null,
            loanRef: null,
            date,
          };
        }
      }
      transactions.push(tx);
    }
  }

  // Cross-member transfers between Alice and Bob
  const crossTransfers = [
    { src: 'a1', dst: 'a5', amt: 5000, desc: 'Sent to Bob for utilities', memberId: 'm1' },
    { src: 'a5', dst: 'a1', amt: 3000, desc: 'Bob repaid loan', memberId: 'm2' },
    { src: 'a3', dst: 'a4', amt: 10000, desc: 'Shared expense contribution', memberId: 'm1' },
    { src: 'a6', dst: 'a2', amt: 2000, desc: 'Nagad to bKash transfer', memberId: 'm2' },
  ];
  for (let i = 0; i < crossTransfers.length; i++) {
    const ct = crossTransfers[i];
    transactions.push({
      id: `tx_cross_${i}`,
      type: 'transfer',
      description: ct.desc,
      amount: ct.amt,
      sourceAccount: ct.src,
      destAccount: ct.dst,
      memberId: ct.memberId,
      debtorId: null,
      loanRef: null,
      date: daysAgo(randInt(5, 60, rand)),
    });
  }

  // Compute balances
  const balances = {};
  for (const id of accountIds) balances[id] = 0;

  for (const tx of transactions) {
    if (tx.type === 'income' && tx.destAccount) {
      balances[tx.destAccount] = (balances[tx.destAccount] || 0) + tx.amount;
    } else if (tx.type === 'expense' && tx.sourceAccount) {
      balances[tx.sourceAccount] = (balances[tx.sourceAccount] || 0) - tx.amount;
    } else if (tx.type === 'transfer') {
      if (tx.sourceAccount) balances[tx.sourceAccount] = (balances[tx.sourceAccount] || 0) - tx.amount;
      if (tx.destAccount) balances[tx.destAccount] = (balances[tx.destAccount] || 0) + tx.amount;
    }
  }

  const stmt = db.prepare(
    "INSERT INTO transactions (id, type, description, amount, source_account, dest_account, member_id, debtor_id, loan_ref, date, created_at, updated_at) VALUES ($id, $type, $desc, $amt, $src, $dst, $mid, $did, $loan, $date, $created, $updated)"
  );
  for (const tx of transactions) {
    stmt.bind({
      $id: tx.id,
      $type: tx.type,
      $desc: tx.description,
      $amt: tx.amount,
      $src: tx.sourceAccount,
      $dst: tx.destAccount,
      $mid: tx.memberId,
      $did: null,
      $loan: null,
      $date: tx.date,
      $created: tx.date,
      $updated: tx.date,
    });
    stmt.step();
    stmt.reset();
  }
  stmt.free();

  for (const acc of accountDefs) {
    const bal = balances[acc.id] || 0;
    db.run("UPDATE accounts SET balance = ? WHERE id = ?", [bal, acc.id]);
  }

  // Account groups
  db.run("INSERT INTO account_groups (id, name, sort_order) VALUES ('g1', 'Personal', 1)");
  db.run("INSERT INTO account_groups (id, name, sort_order) VALUES ('g2', 'Savings', 2)");
  db.run("INSERT INTO account_groups (id, name, sort_order) VALUES ('g3', 'Business', 3)");

  db.run("INSERT INTO account_group_mappings (id, account_group_id, account_id) VALUES ('gm1', 'g1', 'a1')");
  db.run("INSERT INTO account_group_mappings (id, account_group_id, account_id) VALUES ('gm2', 'g1', 'a2')");
  db.run("INSERT INTO account_group_mappings (id, account_group_id, account_id) VALUES ('gm3', 'g2', 'a3')");
  db.run("INSERT INTO account_group_mappings (id, account_group_id, account_id) VALUES ('gm4', 'g1', 'a4')");
  db.run("INSERT INTO account_group_mappings (id, account_group_id, account_id) VALUES ('gm5', 'g3', 'a5')");
  db.run("INSERT INTO account_group_mappings (id, account_group_id, account_id) VALUES ('gm6', 'g1', 'a6')");

  const data = db.export();
  const outPath = path.join(__dirname, 'test.db');
  fs.writeFileSync(outPath, Buffer.from(data));
  console.log(`Seeded database written to ${outPath}`);
  console.log(`Members: ${members.length}`);
  console.log(`Accounts: ${accountDefs.length}`);
  console.log(`Transactions: ${transactions.length}`);
  for (const acc of accountDefs) {
    console.log(`  ${acc.name} (${acc.memberId}): ${balances[acc.id] || 0} BDT`);
  }
}

main().catch(console.error);
