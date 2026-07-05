import initSqlJs from 'sql.js';
import fs from 'fs';

const SQL = await initSqlJs();
const buffer = fs.readFileSync('moneyflows_2026-07-04.db');
const db = new SQL.Database(buffer);

// Business Cash account
const acctId = '3a972aad-af30-4e80-8ce4-6ebaa62fed57';

// Get all transactions involving this account (source or dest), ordered by created_at
const txs = db.exec(`
  SELECT id, type, description, amount, source_account, dest_account, date, created_at, deleted_at, metadata
  FROM transactions 
  WHERE (source_account = '${acctId}' OR dest_account = '${acctId}')
  ORDER BY created_at
`);
console.log('=== TRANSACTIONS INVOLVING Business Cash ===');
for (const r of txs) {
  for (const row of r.values) {
    const del = row[8] ? ` DELETED_AT=${row[8]}` : '';
    console.log(`${row[6]} | ${row[1]} | ${String(row[2]).slice(0,40)} | ${row[3]} | src=${row[4]||'-'} dst=${row[5]||'-'}${del}`);
  }
}

// Get account balance
const bal = db.exec(`SELECT balance FROM accounts WHERE id='${acctId}'`);
console.log('\n=== CURRENT ACCOUNT BALANCE ===');
for (const r of bal) {
  for (const row of r.values) {
    console.log(`Business Cash balance = ${row[0]}`);
  }
}

// Also check Standard Bank (Business Fund)
const sblId = 'a099dfe3-618c-47c3-b243-75a07d8daa92';
const sblBal = db.exec(`SELECT balance FROM accounts WHERE id='${sblId}'`);
console.log('\n=== STANDARD BANK (Business Fund) BALANCE ===');
for (const r of sblBal) {
  for (const row of r.values) {
    console.log(`Standard Bank balance = ${row[0]}`);
  }
}
