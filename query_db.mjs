import initSqlJs from 'sql.js';
import fs from 'fs';

const SQL = await initSqlJs();
const buffer = fs.readFileSync('moneyflows_2026-07-04.db');
const db = new SQL.Database(buffer);

const members = db.exec("SELECT id, name FROM members");
console.log('=== MEMBERS ===');
for (const r of members) {
  for (const row of r.values) {
    console.log(`  id=${row[0]} name=${row[1]}`);
  }
}

const accounts = db.exec("SELECT id, member_id, name, type, balance FROM accounts WHERE deleted_at IS NULL");
console.log('\n=== ACCOUNTS ===');
for (const r of accounts) {
  for (const row of r.values) {
    console.log(`  id=${row[0]} member=${row[1]} name=${row[2]} type=${row[3]} balance=${row[4]}`);
  }
}

const txs = db.exec("SELECT id, type, description, amount, source_account, dest_account, date, metadata, deleted_at FROM transactions ORDER BY date, created_at");
console.log('\n=== ALL TRANSACTIONS (chronological) ===');
for (const r of txs) {
  for (const row of r.values) {
    const deleted = row[8] ? ' DELETED' : '';
    console.log(`  ${row[6]} | ${row[1]} | ${row[2]} | ${row[3]} | src=${row[4] || '-'} dst=${row[5] || '-'} | meta=${row[7]}${deleted}`);
  }
}
