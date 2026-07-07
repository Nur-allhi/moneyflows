import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Avatar, AccountCard, LedgerTable, SegmentedTabs, GlassPanel, LedgerSearch } from '../components';
import type { LedgerRow } from '../components';
import { useAnimatedValue } from '../hooks';
import { useModalStore } from '../stores/useModalStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Transaction } from '../../core/domain/Transaction';
import { formatAmount, formatAmountParts } from '../utils/format';
import { shortDate, MONTHS } from '../constants/dates';
import { ACCOUNT_TYPE_GRADIENT_THREE, displayType } from '../constants/labels';
import styles from './MemberProfile.module.css';

const ledgerFilters = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'loan', label: 'Loan' },
];

export function MemberProfile() {
  const { id: memberId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [ledgerQuery, setLedgerQuery] = useState('');

  const {
    members, loading: mLoading, error: mError,
    fetchMembers,
  } = useMemberStore();
  const {
    accounts, loading: aLoading, error: aError,
    fetchAccounts,
  } = useAccountStore();
  const {
    transactions, loading: tLoading, error: tError,
    fetchTransactions,
  } = useTransactionStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (memberId) {
      fetchAccounts();
      fetchTransactions();
    }
  }, [memberId]);

  const member = useMemo(
    () => members.find((m) => m.id === memberId) ?? null,
    [members, memberId],
  );

  const memberAccounts = useMemo(
    () => accounts.filter((a) => a.memberId === memberId),
    [accounts, memberId],
  );

  useEffect(() => {
    if (!memberAccounts.length) return;
    const acctParam = searchParams.get('account');
    if (acctParam && memberAccounts.some((a) => a.id === acctParam)) {
      setSelectedAccountId(acctParam);
    }
  }, [memberAccounts]);

  const totalBalance = useMemo(
    () => memberAccounts.reduce((s, a) => s + a.balance, 0),
    [memberAccounts],
  );

  const memberTxs = useMemo(
    () => {
      const acctIds = new Set(memberAccounts.map((a) => a.id));
      return transactions.filter(
        (t) => acctIds.has(t.sourceAccount ?? '') || acctIds.has(t.destAccount ?? ''),
      );
    },
    [transactions, memberAccounts],
  );

  const accountTxs = useMemo(
    () => {
      if (!selectedAccountId) return memberTxs;
      return memberTxs.filter(
        (t) => t.sourceAccount === selectedAccountId || t.destAccount === selectedAccountId,
      );
    },
    [memberTxs, selectedAccountId],
  );

  const totalIncome = useMemo(
    () => memberTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [memberTxs],
  );

  const totalExpenses = useMemo(
    () => memberTxs.filter((t) => t.type === 'expense' || t.type === 'loan_issue' || t.type === 'lend').reduce((s, t) => s + t.amount, 0),
    [memberTxs],
  );

  const sortedTxs = useMemo(
    () => [...accountTxs].sort((a, b) => a.date.localeCompare(b.date)),
    [accountTxs],
  );

  const displayedTxs = useMemo(
    () => sortedTxs.slice(-displayLimit),
    [sortedTxs, displayLimit],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || displayLimit >= sortedTxs.length || loadingMore) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loadingMoreRef.current) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
        setTimeout(() => {
          setDisplayLimit((prev) => Math.min(prev + 10, sortedTxs.length));
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }, 250);
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [displayLimit, sortedTxs.length, loadingMore]);

  useEffect(() => {
    if (!filterOpen && !searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen, searchOpen]);

  const showBalance = selectedAccountId !== null;

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const resolveAccountDisplay = useCallback((tx: Transaction): string => {
    switch (tx.type) {
      case 'income':
        return tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? 'Unknown') : '';
      case 'expense':
        return tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? 'Unknown') : '';
      case 'transfer': {
        const src = tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '?') : '?';
        const dst = tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? '?') : '?';
        return `${src} \u2192 ${dst}`;
      }
      case 'loan_issue':
      case 'lend': {
        const account = tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '?') : '?';
        const debtor = tx.debtorId ? (memberMap.get(tx.debtorId)?.name ?? '?') : '';
        return debtor ? `${account} (\u2192 ${debtor})` : account;
      }
      case 'loan_repayment':
      case 'repay': {
        const account = tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? '?') : '?';
        const debtor = tx.debtorId ? (memberMap.get(tx.debtorId)?.name ?? '?') : '';
        return debtor ? `${account} (\u2190 ${debtor})` : account;
      }
      default:
        return '';
    }
  }, [accountMap, memberMap]);

  const ledgerRows: LedgerRow[] = useMemo(() => {
    if (!showBalance) {
      return [...displayedTxs].reverse().map((tx) => {
        const isCredit = tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay';
        const displayType = tx.type === 'loan_issue' || tx.type === 'loan_repayment' || tx.type === 'lend' || tx.type === 'repay' ? 'loan' as const : tx.type as 'income' | 'expense' | 'transfer';
        return {
          id: tx.id,
          date: shortDate(tx.date, locale),
          description: tx.description,
          account: resolveAccountDisplay(tx),
          debit: isCredit ? '\u2014' : formatAmountParts(tx.amount, locale, currency).amount,
          credit: isCredit ? formatAmountParts(tx.amount, locale, currency).amount : '\u2014',
          currencyLabel: currency,
          type: displayType,
        };
      });
    }
    const selectedAcct = memberAccounts.find((a) => a.id === selectedAccountId);
    const hasOpeningTx = sortedTxs.some(
      (tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true,
    );

    function isTxCredit(tx: Transaction): boolean {
      const loanLike = ['transfer', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback', 'lend', 'repay'];
      if (loanLike.includes(tx.type)) return tx.destAccount === selectedAccountId;
      return tx.type === 'income';
    }

    if (hasOpeningTx) {
      let running = 0;
      const rows: LedgerRow[] = sortedTxs.map((tx) => {
        const credit = isTxCredit(tx);
        if (credit) running += tx.amount;
        else running -= tx.amount;

        const displayType = tx.type === 'loan_issue' || tx.type === 'loan_repayment' || tx.type === 'lend' || tx.type === 'repay' ? 'loan' as const : tx.type as 'income' | 'expense' | 'transfer';

        return {
          id: tx.id,
          date: shortDate(tx.date, locale),
          description: tx.description,
          debit: credit ? '\u2014' : formatAmountParts(tx.amount, locale, currency).amount,
          credit: credit ? formatAmountParts(tx.amount, locale, currency).amount : '\u2014',
          balance: formatAmountParts(running, locale, currency).amount,
          currencyLabel: currency,
          type: displayType,
        };
      });
      return rows.reverse();
    }

    const accountBalance = selectedAcct?.balance ?? 0;
    const netChange = sortedTxs.reduce((sum, tx) => {
      return isTxCredit(tx) ? sum + tx.amount : sum - tx.amount;
    }, 0);
    let running = accountBalance - netChange;
    const rows: LedgerRow[] = sortedTxs.map((tx) => {
      const credit = isTxCredit(tx);
      if (credit) running += tx.amount;
      else running -= tx.amount;

      const displayType = tx.type === 'loan_issue' || tx.type === 'loan_repayment' || tx.type === 'lend' || tx.type === 'repay' ? 'loan' as const : tx.type as 'income' | 'expense' | 'transfer';

      return {
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: tx.description,
        debit: credit ? '\u2014' : formatAmountParts(tx.amount, locale, currency).amount,
        credit: credit ? formatAmountParts(tx.amount, locale, currency).amount : '\u2014',
        balance: formatAmountParts(running, locale, currency).amount,
        currencyLabel: currency,
        type: displayType,
      };
    });
    return rows.reverse();
  }, [sortedTxs, displayedTxs, locale, showBalance, memberAccounts, selectedAccountId]);

  const filteredLedger = useMemo(() => {
    const q = ledgerQuery.toLowerCase().trim();
    let rows = ledgerFilter === 'all' ? ledgerRows : ledgerRows.filter((row) => row.type === ledgerFilter);
    if (q) rows = rows.filter((r) => r.description.toLowerCase().includes(q));
    return rows;
  }, [ledgerRows, ledgerFilter, ledgerQuery]);

  const filteredTxs = useMemo(() => {
    let txs = [...displayedTxs];
    if (ledgerFilter !== 'all') {
      const map: Record<string, string[]> = { income: ['income'], expense: ['expense', 'loan_issue', 'lend'], transfer: ['transfer'], loan: ['loan_issue', 'loan_repayment', 'lend', 'repay'] };
      const allowed = map[ledgerFilter] ?? [];
      txs = txs.filter((tx) => allowed.includes(tx.type));
    }
    const q = ledgerQuery.toLowerCase().trim();
    if (q) txs = txs.filter((tx) => tx.description.toLowerCase().includes(q));
    return txs.sort((a, b) => b.date.localeCompare(a.date));
  }, [displayedTxs, ledgerFilter, ledgerQuery]);

  const handleRowClick = useCallback((row: LedgerRow) => {
    if (row.id) {
      const tx = transactions.find((t) => t.id === row.id);
      useModalStore.getState().open('transaction-detail', { transaction: tx });
    }
  }, [transactions]);

  const handleTxClick = useCallback((tx: Transaction) => {
    useModalStore.getState().open('transaction-detail', { transaction: tx });
  }, []);

  const handleOpeningBalance = useCallback(() => {
    if (!selectedAccountId) return;
    const acct = memberAccounts.find((a) => a.id === selectedAccountId);
    if (!acct?.memberId) return;
    const openingTx = transactions.find(
      (tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true,
    );
    if (openingTx) {
      useModalStore.getState().open('transaction-detail', { transaction: openingTx });
    } else if (acct.balance === 0) {
      const amount = window.prompt('Enter opening balance amount:');
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
      const date = new Date().toISOString().slice(0, 10);
      const tx = new Transaction(
        uuidv4(), 'income', 'Opening Balance', Number(amount),
        acct.memberId, date, undefined, selectedAccountId, undefined, undefined,
        { isOpeningBalance: true },
      );
      useTransactionStore.getState().addTransaction(tx);
    }
  }, [selectedAccountId, memberAccounts, transactions]);

  const handleAccountClick = useCallback((acctId: string) => {
    setSelectedAccountId((prev) => prev === acctId ? null : acctId);
    setAccountsOpen(false);
  }, []);

  const handleSelectAccount = useCallback((acctId: string | null) => {
    setSelectedAccountId(acctId);
  }, []);

  const animTotalBalance = useAnimatedValue(totalBalance);
  const animTotalIncome = useAnimatedValue(totalIncome);
  const animTotalExpenses = useAnimatedValue(totalExpenses);

  const loading = mLoading || aLoading || tLoading;
  const error = mError || aError || tError;

  const selectedAcct = selectedAccountId ? memberAccounts.find((a) => a.id === selectedAccountId) : undefined;
  const txCount = accountTxs.length;

  const downloadPdf = useCallback(() => {
    const isTxCredit = (tx: Transaction) => {
      const loanLike = ['transfer', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback', 'lend', 'repay'];
      if ((loanLike as readonly string[]).includes(tx.type)) return tx.destAccount === selectedAccountId;
      return tx.type === 'income';
    };

    const pdfRows: { date: string; type: string; description: string; debit: string; credit: string; balance: string }[] = [];
    if (!showBalance) {
      for (const tx of sortedTxs) {
        const credit = isTxCredit(tx);
        pdfRows.push({
          date: shortDate(tx.date, locale),
          type: tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          description: tx.description,
          debit: credit ? '' : formatAmount(tx.amount, locale, currency),
          credit: credit ? formatAmount(tx.amount, locale, currency) : '',
          balance: '',
        });
      }
    } else {
      const selectedAcct = memberAccounts.find((a) => a.id === selectedAccountId);
      const hasOpeningTx = sortedTxs.some(
        (tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true,
      );

      if (hasOpeningTx) {
        let running = 0;
        for (const tx of sortedTxs) {
          const credit = isTxCredit(tx);
          if (credit) running += tx.amount;
          else running -= tx.amount;
          pdfRows.push({
            date: shortDate(tx.date, locale),
            type: tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: tx.description,
            debit: credit ? '' : formatAmount(tx.amount, locale, currency),
            credit: credit ? formatAmount(tx.amount, locale, currency) : '',
            balance: formatAmount(running, locale, currency),
          });
        }
      } else {
        const accountBalance = selectedAcct?.balance ?? 0;
        const netChange = sortedTxs.reduce((sum, tx) => {
          return isTxCredit(tx) ? sum + tx.amount : sum - tx.amount;
        }, 0);
        let running = accountBalance - netChange;
        for (const tx of sortedTxs) {
          const credit = isTxCredit(tx);
          if (credit) running += tx.amount;
          else running -= tx.amount;
          pdfRows.push({
            date: shortDate(tx.date, locale),
            type: tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: tx.description,
            debit: credit ? '' : formatAmount(tx.amount, locale, currency),
            credit: credit ? formatAmount(tx.amount, locale, currency) : '',
            balance: formatAmount(running, locale, currency),
          });
        }
      }
    }

    let filteredPdfRows = ledgerFilter === 'all'
      ? pdfRows
      : pdfRows.filter((r) => {
          const typeKey = r.type.toLowerCase().replace(/\s+/g, '_');
          return typeKey === ledgerFilter || (ledgerFilter === 'income' && typeKey === 'opening_balance') || (ledgerFilter === 'loan' && (typeKey === 'loan_issue' || typeKey === 'loan_repayment' || typeKey === 'lend' || typeKey === 'repay'));
        });

    const q = ledgerQuery.toLowerCase().trim();
    if (q) filteredPdfRows = filteredPdfRows.filter((r) => r.description.toLowerCase().includes(q));

    if (filteredPdfRows.length === 0) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    const pdfTxFilter = (tx: Transaction) => {
      if (ledgerFilter !== 'all') {
        const typeKey = tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase().replace(/\s+/g, '_');
        const match = typeKey === ledgerFilter ||
          (ledgerFilter === 'income' && typeKey === 'opening_balance') ||
          (ledgerFilter === 'loan' && ['loan_issue', 'loan_repayment', 'lend', 'repay'].includes(typeKey));
        if (!match) return false;
      }
      if (q && !tx.description.toLowerCase().includes(q)) return false;
      return true;
    };

    let totalDebit = 0;
    let totalCredit = 0;
    for (const tx of sortedTxs) {
      if (!pdfTxFilter(tx)) continue;
      if (isTxCredit(tx)) totalCredit += tx.amount;
      else totalDebit += tx.amount;
    }

    const openingBal = showBalance
      ? (() => {
          const acct = memberAccounts.find((a) => a.id === selectedAccountId);
          if (!acct) return 0;
          const netCh = sortedTxs.reduce((s, tx) => {
            if (!pdfTxFilter(tx)) return s;
            return s + (isTxCredit(tx) ? tx.amount : -tx.amount);
          }, 0);
          return acct.balance - netCh;
        })()
      : 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Transaction Report', pageW / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedAcct ? selectedAcct.name : 'All Accounts', pageW / 2, 28, { align: 'center' });
    doc.text(`Member: ${member?.name ?? ''}`, 14, 36);

    const firstTx = sortedTxs[0];
    const lastTx = sortedTxs[sortedTxs.length - 1];
    const firstDate = firstTx ? shortDate(firstTx.date, locale) : '';
    const lastDate = lastTx ? shortDate(lastTx.date, locale) : '';
    const period = firstDate && lastDate ? `Period: ${firstDate}  -  ${lastDate}` : '';
    if (period) doc.text(period, 14, 44);

    doc.setFontSize(10);
    const rightX = pageW - 14;
    const gap = 3;

    const obVal = formatAmount(openingBal, locale, currency);
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

    const includeBalance = showBalance;
    const headers = includeBalance
      ? ['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance']
      : ['Date', 'Type', 'Description', 'Debit', 'Credit'];
    const body = filteredPdfRows.map((r) => includeBalance
      ? [r.date, r.type, r.description, r.debit, r.credit, r.balance]
      : [r.date, r.type, r.description, r.debit, r.credit],
    );

    autoTable(doc, {
      head: [headers],
      body,
      startY: 52,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto', halign: 'left' },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        ...(includeBalance ? { 5: { cellWidth: 30 } } : {}),
      },
      didDrawPage: (data) => {
        const y = data.cursor?.y ?? 200;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('MoneyFlows \u2014 This is a system generated report', pageW / 2, y + 15, { align: 'center' });
      },
    });

    const fileName = `Transaction_Report_${member?.name ?? 'Unknown'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }, [sortedTxs, showBalance, ledgerFilter, locale, currency, memberAccounts, selectedAccountId, member, ledgerQuery]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className="skeleton skeleton-profile" />
          <div className={styles.carousel}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`skeleton skeleton-card ${styles.loadingCard}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className={styles.container}>
        <GlassPanel padding="lg">
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">{!member ? 'Member not found' : 'Could not load member profile'}</p>
            <button className="retry-btn" onClick={() => fetchMembers()}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  const initial = member.shortName?.[0] ?? member.name[0] ?? '?';

  return (
    <div className={styles.container}>
      {isDesktop ? (
        <div className={styles.desktopOnly}>
          <div className={styles.profileHero}>
            <div className={styles.heroLeft}>
              <Avatar initial={initial} seed={member.name} name={member.name} size={72} />
              <div className={styles.heroName}>{member.name} <button className={styles.heroEditBtn} onClick={() => useModalStore.getState().open('edit-member', { memberId: member.id })} aria-label="Edit member name">{'\u270E'}</button></div>
            </div>
            <div className={styles.heroActions}>
              <button className={styles.heroActionBtn} onClick={() => useModalStore.getState().open('transaction-form')}>
                <span className={styles.heroActionIcon}>+</span>
                Transaction
              </button>
              <button className={styles.heroActionBtn} onClick={() => useModalStore.getState().open('add-account', { memberId })}>
                <span className={styles.heroActionIcon}>+</span>
                Account
              </button>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Net Balance</div>
                <div className={`${styles.statValue} ${styles.statTeal}`}>{formatAmount(animTotalBalance, locale, currency)}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Total Income</div>
                <div className={`${styles.statValue} ${styles.statTeal}`}>{formatAmount(animTotalIncome, locale, currency)}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Total Expenses</div>
                <div className={`${styles.statValue} ${styles.statCoral}`}>{formatAmount(animTotalExpenses, locale, currency)}</div>
              </div>
            </div>
          </div>

          <div className={styles.accountsDropdown}>
            <div className={styles.accountsDropdownHeader} onClick={() => setAccountsOpen((o) => !o)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setAccountsOpen((o) => !o)}>
              <h2>Linked Accounts <span className={styles.acctCount}>{memberAccounts.length}</span></h2>
              <span className={`${styles.accountsChevron} ${accountsOpen ? styles.chevronOpen : ''}`}>{'\u25BC'}</span>
            </div>
            <div className={`${styles.accountsSlide} ${accountsOpen ? styles.accountsOpen : ''}`}>
              <div className={styles.accountsSlideInner}>
              <div className={styles.accountsGrid}>
                {memberAccounts.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-text">No accounts</p>
                  </div>
                ) : (
                  memberAccounts.map((acct) => (
                    <AccountCard
                      key={acct.id}
                      name={acct.name}
                      type={displayType(acct.type)}
                      balance={formatAmount(acct.balance, locale, currency)}
                      gradient={ACCOUNT_TYPE_GRADIENT_THREE[acct.type]}
                      showChip={acct.type === 'cash'}
                      onClick={() => handleAccountClick(acct.id)}
                      selected={selectedAccountId === acct.id}
                    />
                  ))
                )}
              </div>
              </div>
            </div>
          </div>

          <div className={styles.contentSplit}>
          <div className={styles.ledgerPanel}>
            <div className={styles.ledgerPanelHead}>
              <h3>
                {selectedAcct ? (
                  <>{selectedAcct.name} <span className={styles.ledgerBalance}>{formatAmount(selectedAcct.balance, locale, currency)}</span> <span className={styles.txCount}>{txCount}</span></>
                ) : (
                  <>All Accounts Ledger <span className={styles.txCount}>{txCount}</span></>
                )}
              </h3>
              <div className={styles.ledgerPanelFilter}>
                <button className={styles.pdfBtn} onClick={downloadPdf} title="Download PDF">
                  <svg className={styles.pdfBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span className={styles.pdfBtnLabel}>Download PDF</span>
                </button>
                <LedgerSearch value={ledgerQuery} onChange={setLedgerQuery} />
                <SegmentedTabs
                  tabs={ledgerFilters}
                  activeKey={ledgerFilter}
                  onChange={setLedgerFilter}
                />
                {selectedAccountId && (
                  <button className={styles.showAllBtn} onClick={() => setSelectedAccountId(null)}>All account</button>
                )}
                {selectedAccountId && (() => {
                  const hasObTx = transactions.some(
                    (tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true,
                  );
                  const showAdd = hasObTx || memberAccounts.find((a) => a.id === selectedAccountId)?.balance === 0;
                  if (!showAdd) return null;
                  return (
                    <button className={styles.obBtn} onClick={handleOpeningBalance}>
                      {hasObTx ? 'Opening Balance' : 'Add Opening'}
                    </button>
                  );
                })()}
              </div>
            </div>
            <LedgerTable rows={filteredLedger} desktop showBalance={showBalance} onRowClick={handleRowClick} sentinel={<div ref={sentinelRef} style={{ height: 1 }} />} />
          </div>
        </div>
        </div>
      ) : (
        <div className={styles.mobileOnly}>
          <div className={styles.profileCard}>
            <Avatar initial={initial} seed={member.name} name={member.name} size={72} />
            <div className={styles.profileName}>{member.name}</div>
            <div className={styles.profileTag}>
              {member.isExternal ? 'External' : 'Family'}
            </div>
            <div className={styles.balanceLabel}>Net Balance</div>
            <div className={styles.balanceAmount}>{formatAmount(animTotalBalance, locale, currency)}</div>
          </div>

          <div className={styles.actionPills}>
            <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'income' })}>
              <span className={`${styles.pillIcon} ${styles.pillIncome}`}>{'+$'}</span>
              <span className={styles.pillLabel}>Income</span>
            </button>
            <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'expense' })}>
              <span className={`${styles.pillIcon} ${styles.pillExpense}`}>{'-$'}</span>
              <span className={styles.pillLabel}>Expense</span>
            </button>
            <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'transfer' })}>
              <span className={`${styles.pillIcon} ${styles.pillTransfer}`}>{'$'}</span>
              <span className={styles.pillLabel}>Transfer</span>
            </button>
          </div>

          <div className={styles.mobileLinkedAccounts} onClick={() => useModalStore.getState().open('select-account', { memberId, selectedAccountId, onSelect: handleSelectAccount })} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && useModalStore.getState().open('select-account', { memberId, selectedAccountId, onSelect: handleSelectAccount })}>
            <div className={styles.linkedAccountsLabel}>
              <span>Linked Accounts</span>
              <span className={styles.linkedAcctCount}>{memberAccounts.length}</span>
            </div>
            <svg className={styles.linkedChevron} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </div>

          <div className={styles.mobileLedger}>
            <div ref={trayRef}>
            <div className={styles.ledgerToolbar}>
              <div className={styles.ledgerSectionTitle}>{selectedAcct ? selectedAcct.name : 'All Accounts'}</div>
              <span className={styles.txCountBadge}>{filteredTxs.length}</span>
              <div className={styles.ledgerActions}>
                <button className={styles.ledgerFilterBtn} onClick={() => setFilterOpen((o) => !o)} aria-label="Filter">
                  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M2 4.5h14M4.5 9h9M7 13.5h4" />
                    <circle cx="4.5" cy="4.5" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="13.5" cy="9" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="9" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </button>
                <button className={styles.ledgerFilterBtn} onClick={() => setSearchOpen((o) => !o)} aria-label="Search">
                  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <circle cx="8" cy="8" r="5.5" />
                    <path d="M12 12l4 4" />
                  </svg>
                </button>
                <button className={styles.downloadBtn} onClick={downloadPdf} aria-label="Download PDF">
                  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M15 12v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2" />
                    <polyline points="6 9 9 12 12 9" />
                    <line x1="9" y1="3" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={`${styles.filterTray} ${filterOpen ? styles.filterTrayOpen : ''}`}>
              <div className={styles.filterPills}>
                {(['all', 'income', 'expense', 'loan'] as const).map((f) => (
                  <button
                    key={f}
                    className={`${styles.filterPill} ${ledgerFilter === f ? styles.filterPillActive : ''}`}
                    onClick={() => setLedgerFilter(f)}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${styles.searchBar} ${searchOpen ? styles.searchBarOpen : ''}`}>
              <div className={styles.ledgerSearchWrap}>
                <svg className={styles.ledgerSearchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <circle cx="7" cy="7" r="5.5" />
                  <path d="M11 11l3.5 3.5" />
                </svg>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={ledgerQuery}
                  onChange={(e) => setLedgerQuery(e.target.value)}
                />
                {ledgerQuery && (
                  <button className={styles.searchClear} onClick={() => setLedgerQuery('')} aria-label="Clear">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            </div>

            {filteredTxs.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon">{'\u{1F4CB}'}</div>
                <p className="empty-state-text">No transactions yet</p>
              </div>
            ) : (
              filteredTxs.map((tx) => {
                const isCredit = tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay';
                const { amount: fmtAmt, currency: fmtCur } = formatAmountParts(tx.amount, locale, currency);
                return (
                  <div key={tx.id} className={styles.txRow} onClick={() => handleTxClick(tx)}>
                    <span className={styles.txType} data-type={tx.type}>
                      <span className={styles.txDay}>{new Date(tx.date).getDate()}</span>
                      <span className={styles.txMonth}>{MONTHS[new Date(tx.date).getMonth()]}</span>
                    </span>
                    <span className={styles.txDesc}>{tx.description}</span>
                    <span className={styles.txAmount}>
                      <span className={`${styles.txArrow} ${isCredit ? styles.txArrowIn : styles.txArrowOut}`}>
                        {isCredit ? (
                          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2 6l4-4 4 4"/></svg>
                        ) : (
                          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v8M2 6l4 4 4-4"/></svg>
                        )}
                      </span>
                      {fmtAmt}<small className={styles.txCurrency}>{fmtCur}</small>
                    </span>
                  </div>
                );
              })
            )}
            {loadingMore && sortedTxs.length > displayLimit && (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`skel-${i}`} className={styles.skeletonRow}>
                  <span className={styles.skeletonSquare} />
                  <span className={styles.skeletonBar} />
                  <span className={styles.skeletonAmount} />
                </div>
              ))
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </div>
        </div>
      )}
    </div>
  );
}
