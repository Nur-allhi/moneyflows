import initSqlJs from 'sql.js';
import fs from 'fs';

const SQL = await initSqlJs();
const buffer = fs.readFileSync('moneyflows_2026-07-04.db');
const db = new SQL.Database(buffer);

const acctId = '3a972aad-af30-4e80-8ce4-6ebaa62fed57';

// Check if any transaction has been deleted more than once
// (by looking at whether softDeleteTransaction was called when already deleted)
const all = db.exec(`SELECT id, type, description, amount, source_account, dest_account, deleted_at FROM transactions WHERE source_account='${acctId}' OR dest_account='${acctId}' ORDER BY created_at`);

let balance = 0;
console.log('=== STEP-BY-STEP BALANCE TRACE ===');
for (const r of all) {
  for (const row of r.values) {
    const id = row[0], type = row[1], desc = String(row[2]).slice(0,25);
    const amt = row[3], src = row[4]||'', dst = row[5]||'', del = row[6]||'';
    let change = 0;
    // Simulate applyBalanceChange for each type
    if (type === 'income' && dst === acctId) change = amt;
    else if (type === 'expense' && src === acctId) change = -amt;
    else if (type === 'transfer') {
      if (src === acctId) change -= amt;
      if (dst === acctId) change += amt;
    } else if ((type === 'lend' || type === 'loan_issue') && src === acctId) change = -amt;
    else if ((type === 'repay' || type === 'loan_repayment' || type === 'loan_received' || type === 'loan_paidback') && dst === acctId) change = amt;
    else if (type === 'lend' && dst === acctId) change = amt; // lend money received
    
    balance += change;
    console.log(`${String(del ? 'DEL' : '   ')} ${type.padEnd(12)} ${String(amt).padStart(8)} change=${String(change).padStart(8)} balance=${String(balance).padStart(8)} | ${desc}`);
  }
}
console.log(`\nCalculated balance: ${balance}`);
console.log(`DB balance: -159001`);
