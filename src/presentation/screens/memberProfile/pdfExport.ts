import { Transaction } from '../../../core/domain/Transaction';
import type { Account } from '../../../core/domain/Account';
import type { Member } from '../../../core/domain/Member';
import { shortDate } from '../../constants/dates';
import { formatAmount } from '../../utils/format';
import { ledgerAmountCells, memberLedgerDelta } from '../../utils/memberLedger';

export async function downloadMemberPdf(params: {
  member: Member | null; selectedAcct: Account | undefined; selectedAccountId: string | null; memberAccounts: Account[];
  sortedTxs: Transaction[]; ledgerFilter: string; ledgerQuery: string; locale: string; currency: string; showBalance: boolean;
}) {
  const { member, selectedAcct, selectedAccountId, memberAccounts, sortedTxs, ledgerFilter, ledgerQuery, locale, currency, showBalance } = params;
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  // The view is one account when one is selected, otherwise every account the
  // member holds. One delta per row feeds both the debit/credit cells and the
  // running balance, so they cannot disagree — and it is correct for the
  // "All Accounts" view, where the old `destAccount === selectedAccountId` test
  // was always false and booked every transfer and every received repayment as
  // a debit (BUG-32).
  const viewIds = new Set(selectedAccountId ? [selectedAccountId] : memberAccounts.map((a) => a.id));
  const deltaOf = (tx: Transaction) => memberLedgerDelta(tx, viewIds);
  const titleOf = (tx: Transaction) => tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Balances walk oldest→newest and are anchored to the account's real balance
  // unless an opening-balance row already carries it. `showBalance` is only ever
  // true with an account selected, so this is the same sequence as before.
  const balances: number[] = [];
  if (showBalance) {
    const hasOpeningTx = sortedTxs.some((tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true);
    let running = hasOpeningTx ? 0 : (selectedAcct?.balance ?? 0) - sortedTxs.reduce((sum, tx) => sum + deltaOf(tx), 0);
    for (const tx of sortedTxs) { running += deltaOf(tx); balances.push(running); }
  }

  const pdfRows: { date: string; type: string; description: string; debit: string; credit: string; balance: string }[] = sortedTxs.map((tx, i) => {
    const cells = ledgerAmountCells(deltaOf(tx), formatAmount(tx.amount, locale, currency));
    return {
      date: shortDate(tx.date, locale),
      type: titleOf(tx),
      description: tx.description,
      debit: cells.debit,
      credit: cells.credit,
      balance: showBalance ? formatAmount(balances[i] ?? 0, locale, currency) : '',
    };
  });
  let filteredPdfRows = ledgerFilter === 'all' ? pdfRows : pdfRows.filter((r) => {
    const typeKey = r.type.toLowerCase().replace(/\s+/g, '_');
    return typeKey === ledgerFilter || (ledgerFilter === 'income' && typeKey === 'opening_balance') || (ledgerFilter === 'loan' && (typeKey === 'loan_issue' || typeKey === 'loan_repayment' || typeKey === 'lend' || typeKey === 'repay'));
  });
  const q = ledgerQuery.toLowerCase().trim();
  if (q) filteredPdfRows = filteredPdfRows.filter((r) => r.description.toLowerCase().includes(q));
  if (filteredPdfRows.length === 0) return;
  const doc = new jsPDF(); const pageW = doc.internal.pageSize.getWidth();
  const pdfTxFilter = (tx: Transaction) => {
    if (ledgerFilter !== 'all') {
      const typeKey = tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase().replace(/\s+/g, '_');
      const match = typeKey === ledgerFilter || (ledgerFilter === 'income' && typeKey === 'opening_balance') || (ledgerFilter === 'loan' && ['loan_issue', 'loan_repayment', 'lend', 'repay'].includes(typeKey));
      if (!match) return false;
    }
    if (q && !tx.description.toLowerCase().includes(q)) return false;
    return true;
  };
  let totalDebit = 0; let totalCredit = 0;
  for (const tx of sortedTxs) { if (!pdfTxFilter(tx)) continue; const delta = deltaOf(tx); if (delta > 0) totalCredit += delta; else if (delta < 0) totalDebit += -delta; }
  const openingBal = showBalance ? (() => {
    const acct = memberAccounts.find((a) => a.id === selectedAccountId);
    if (!acct) return 0;
    const netCh = sortedTxs.reduce((s, tx) => { if (!pdfTxFilter(tx)) return s; return s + deltaOf(tx); }, 0);
    return acct.balance - netCh;
  })() : 0;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('Transaction Report', pageW / 2, 20, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(selectedAcct ? selectedAcct.name : 'All Accounts', pageW / 2, 28, { align: 'center' });
  doc.text(`Member: ${member?.name ?? ''}`, 14, 36);
  const firstTx = sortedTxs[0]; const lastTx = sortedTxs[sortedTxs.length - 1];
  const firstDate = firstTx ? shortDate(firstTx.date, locale) : ''; const lastDate = lastTx ? shortDate(lastTx.date, locale) : '';
  const period = firstDate && lastDate ? `Period: ${firstDate}  -  ${lastDate}` : ''; if (period) doc.text(period, 14, 44);
  doc.setFontSize(10); const rightX = pageW - 14; const gap = 3;
  const obVal = formatAmount(openingBal, locale, currency); const obValW = doc.getTextWidth(obVal);
  doc.setFont('helvetica', 'bold'); doc.text('Opening Balance:', rightX - obValW - gap, 28, { align: 'right' }); doc.setFont('helvetica', 'normal'); doc.text(obVal, rightX, 28, { align: 'right' });
  const tdVal = formatAmount(totalDebit, locale, currency); const tdValW = doc.getTextWidth(tdVal);
  doc.setFont('helvetica', 'bold'); doc.text('Total Debit:', rightX - tdValW - gap, 36, { align: 'right' }); doc.setFont('helvetica', 'normal'); doc.text(tdVal, rightX, 36, { align: 'right' });
  const tcVal = formatAmount(totalCredit, locale, currency); const tcValW = doc.getTextWidth(tcVal);
  doc.setFont('helvetica', 'bold'); doc.text('Total Credit:', rightX - tcValW - gap, 44, { align: 'right' }); doc.setFont('helvetica', 'normal'); doc.text(tcVal, rightX, 44, { align: 'right' });
  const includeBalance = showBalance; const headers = includeBalance ? ['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance'] : ['Date', 'Type', 'Description', 'Debit', 'Credit'];
  const body = filteredPdfRows.map((r) => includeBalance ? [r.date, r.type, r.description, r.debit, r.credit, r.balance] : [r.date, r.type, r.description, r.debit, r.credit]);
  autoTable(doc, { head: [headers], body, startY: 52, styles: { fontSize: 8, cellPadding: 2, halign: 'center' }, headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold', halign: 'center' }, columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 22 }, 2: { cellWidth: 'auto', halign: 'left' }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 }, ...(includeBalance ? { 5: { cellWidth: 30 } } : {}) }, didDrawPage: (data) => { const y = data.cursor?.y ?? 200; doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.text('MoneyFlows — This is a system generated report', pageW / 2, y + 15, { align: 'center' }); } });
  doc.save(`Member_${member?.name ?? 'report'}.pdf`);
}
