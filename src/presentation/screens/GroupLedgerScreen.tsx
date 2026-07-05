import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LedgerTable, SegmentedTabs, LedgerSearch } from '../components';
import type { LedgerRow } from '../components';
import { useModalStore } from '../stores/useModalStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import type { Transaction } from '../../core/domain/Transaction';
import type { Account } from '../../core/domain/Account';
import { formatAmount } from '../utils/format';
import { shortDate } from '../constants/dates';
import styles from './GroupLedgerScreen.module.css';

const TX_TABS = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'loan', label: 'Loan' },
];

const PAGE_SIZE = 15;

export function GroupLedgerScreen() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const locale = useSettingsStore((s) => s.settings.locale);
  const currency = useSettingsStore((s) => s.settings.currency);

  const [groupName, setGroupName] = useState('');
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      setLoading(true);
      const db = getDatabase();
      const groups = await db.getAccountGroupsWithMembers();
      const g = groups.find((x) => x.id === groupId);
      if (!g) { navigate('/groups'); return; }
      setGroupName(g.name);
      setAccountIds(g.accountIds);
      const allAccts = await db.getAccounts();
      setAccounts(allAccts);

      const allTxs = await db.getTransactions({ accountIds: g.accountIds });
      setTxs(allTxs);
      setDisplayLimit(PAGE_SIZE);
      setLoading(false);
    })();
  }, [groupId, navigate]);

  const sortedTxs = useMemo(
    () => [...txs].sort((a, b) => a.date.localeCompare(b.date)),
    [txs],
  );

  const displayedTxs = useMemo(
    () => sortedTxs.slice(-displayLimit),
    [sortedTxs, displayLimit],
  );

  const searchFilteredTxs = useMemo(() => {
    const q = ledgerQuery.toLowerCase().trim();
    if (!q) return displayedTxs;
    return displayedTxs.filter((tx) => tx.description.toLowerCase().includes(q));
  }, [displayedTxs, ledgerQuery]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || displayLimit >= sortedTxs.length) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setDisplayLimit((prev) => Math.min(prev + PAGE_SIZE, sortedTxs.length));
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [displayLimit, sortedTxs.length]);

  const accountSet = useMemo(() => new Set(accountIds), [accountIds]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const isGroupDebit = useCallback((tx: Transaction) => {
    return accountSet.has(tx.sourceAccount ?? '');
  }, [accountSet]);

  const isGroupCredit = useCallback((tx: Transaction) => {
    return accountSet.has(tx.destAccount ?? '');
  }, [accountSet]);

  const totalBalance = useMemo(
    () => accounts.filter((a) => accountSet.has(a.id)).reduce((s, a) => s + a.balance, 0),
    [accounts, accountSet],
  );

  const resolveAccountDisplay = useCallback((tx: Transaction): string => {
    switch (tx.type) {
      case 'income': {
        const dst = tx.destAccount ? accountMap.get(tx.destAccount)?.name : null;
        return dst ?? 'Unknown';
      }
      case 'expense': {
        const src = tx.sourceAccount ? accountMap.get(tx.sourceAccount)?.name : null;
        return src ?? 'Unknown';
      }
      case 'transfer': {
        const src = tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '?') : '?';
        const dst = tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? '?') : '?';
        return `${src} \u2192 ${dst}`;
      }
      case 'lend':
      case 'loan_issue':
        return tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '?') : '?';
      case 'repay':
      case 'loan_repayment':
      case 'loan_received':
      case 'loan_paidback':
        return tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? '?') : '?';
      default:
        return '';
    }
  }, [accountMap]);

  const ledgerRows = useMemo((): LedgerRow[] => {
    const netChange = searchFilteredTxs.reduce((sum, tx) => {
      if (isGroupCredit(tx) && !isGroupDebit(tx)) return sum + tx.amount;
      if (isGroupDebit(tx) && !isGroupCredit(tx)) return sum - tx.amount;
      return sum;
    }, 0);
    let running = totalBalance - netChange;

    const isLoanType = (t: string) => ['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback'].includes(t);

    const allRows = displayedTxs.map((tx) => {
      const credit = isGroupCredit(tx) && !isGroupDebit(tx);
      const debit = isGroupDebit(tx) && !isGroupCredit(tx);
      const internal = isGroupDebit(tx) && isGroupCredit(tx);

      if (credit) running += tx.amount;
      else if (debit) running -= tx.amount;

      return {
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: tx.description,
        account: internal ? `(internal) ${resolveAccountDisplay(tx)}` : resolveAccountDisplay(tx),
        debit: credit ? '\u2014' : formatAmount(tx.amount, locale, currency),
        credit: debit ? '\u2014' : formatAmount(tx.amount, locale, currency),
        balance: formatAmount(running, locale, currency),
        type: isLoanType(tx.type) ? 'loan' as const : tx.type as 'income' | 'expense' | 'transfer',
      };
    });

    const result = allRows.reverse();

    if (typeFilter === 'all') return result;
    return result.filter((r) => {
      if (typeFilter === 'loan') return r.type === 'loan';
      return r.type === typeFilter;
    });
  }, [searchFilteredTxs, typeFilter, totalBalance, isGroupCredit, isGroupDebit, locale, currency, resolveAccountDisplay]);

  const handleRowClick = useCallback((row: LedgerRow) => {
    const tx = txs.find((t) => t.id === row.id);
    if (tx) useModalStore.getState().open('transaction-detail', { transaction: tx });
  }, [txs]);

  const handleDownloadPdf = useCallback(() => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text(groupName, pageW / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    const firstTx = searchFilteredTxs[0];
    const lastTx = searchFilteredTxs[searchFilteredTxs.length - 1];
    const dateRange = firstTx && lastTx
      ? `${shortDate(firstTx.date, locale)} - ${shortDate(lastTx.date, locale)}`
      : '';
    if (dateRange) doc.text(`Period: ${dateRange}`, 14, 28);
    doc.text(`Accounts: ${accountIds.length}`, 14, 36);

    const isCredit = (tx: Transaction) => accountSet.has(tx.destAccount ?? '') && !accountSet.has(tx.sourceAccount ?? '');
    const pdfRows: { date: string; type: string; desc: string; debit: string; credit: string; balance: string }[] = [];

    const netChange = searchFilteredTxs.reduce((sum, tx) => {
      if (isCredit(tx)) return sum + tx.amount;
      if (accountSet.has(tx.sourceAccount ?? '')) return sum - tx.amount;
      return sum;
    }, 0);
    let running = totalBalance - netChange;

    let totalDebit = 0;
    let totalCredit = 0;

    for (const tx of searchFilteredTxs) {
      const credit = isCredit(tx);
      const debit = accountSet.has(tx.sourceAccount ?? '') && !accountSet.has(tx.destAccount ?? '');
      if (credit) { running += tx.amount; totalCredit += tx.amount; }
      else if (debit) { running -= tx.amount; totalDebit += tx.amount; }
      pdfRows.push({
        date: shortDate(tx.date, locale),
        type: tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        desc: tx.description,
        debit: credit ? '' : formatAmount(tx.amount, locale, currency),
        credit: debit ? '' : formatAmount(tx.amount, locale, currency),
        balance: formatAmount(running, locale, currency),
      });
    }

    if (pdfRows.length === 0) return;

    const rightX = pageW - 14;
    const gap = 3;
    doc.setFontSize(10);

    const obVal = formatAmount(totalBalance - netChange, locale, currency);
    const obValW = doc.getTextWidth(obVal);
    doc.setFont('helvetica', 'bold');
    doc.text('Opening Balance:', rightX - obValW - gap, 28, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(obVal, rightX, 28, { align: 'right' });

    const tdVal = formatAmount(totalDebit, locale, currency);
    const tdValW = doc.getTextWidth(tdVal);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Debit:', rightX - tdValW - gap, 36, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(tdVal, rightX, 36, { align: 'right' });

    const tcVal = formatAmount(totalCredit, locale, currency);
    const tcValW = doc.getTextWidth(tcVal);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Credit:', rightX - tcValW - gap, 44, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(tcVal, rightX, 44, { align: 'right' });

    autoTable(doc, {
      head: [['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance']],
      body: pdfRows.map((r) => [r.date, r.type, r.desc, r.debit, r.credit, r.balance]),
      startY: 52,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto', halign: 'left' },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },
    });

    doc.text('MoneyFlows \u2014 System generated report', pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    doc.save(`${groupName.replace(/\s+/g, '_')}_ledger.pdf`);
  }, [groupName, searchFilteredTxs, accountIds.length, accountSet, totalBalance, locale, currency]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const typeRows = typeFilter === 'all' ? searchFilteredTxs : searchFilteredTxs.filter((tx) => {
    if (typeFilter === 'loan') return ['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback'].includes(tx.type);
    return tx.type === typeFilter;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{groupName}</h1>
          <span className={styles.subtitle}>{accountIds.length} accounts &middot; {formatAmount(totalBalance, locale, currency)} total</span>
        </div>
        <LedgerSearch value={ledgerQuery} onChange={setLedgerQuery} />
        <button className={styles.pdfBtn} onClick={handleDownloadPdf}>PDF</button>
      </div>

      <SegmentedTabs tabs={TX_TABS} activeKey={typeFilter} onChange={setTypeFilter} />

      <LedgerTable
        rows={ledgerRows}
        showBalance
        desktop
        onRowClick={handleRowClick}
        sentinel={<div ref={sentinelRef} style={{ height: 1 }} />}
      />

      {typeRows.length === 0 && <div className={styles.empty}>No entries found</div>}
    </div>
  );
}
