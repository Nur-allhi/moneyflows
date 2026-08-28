import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { GlassPanel } from '../components';
import type { LedgerRow } from '../components';
import { useModalStore } from '../stores/useModalStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTagStore } from '../stores/useTagStore';
import { Transaction } from '../../core/domain/Transaction';
import { formatAmount, formatAmountParts } from '../utils/format';
import { shortDate } from '../constants/dates';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { matchesTx } from '../utils/search';
import styles from './MemberProfile.module.css';
import { ProfileHero } from './memberProfile/ProfileHero';
import { AccountsSection } from './memberProfile/AccountsSection';
import { LedgerSection } from './memberProfile/LedgerSection';

function getScrollParent(node: HTMLElement | null): HTMLElement {
  let el = node?.parentElement ?? null;
  while (el) {
    if (getComputedStyle(el).overflowY === 'scroll') return el;
    el = el.parentElement;
  }
  return document.documentElement;
}

export function MemberProfile() {
  const { id: memberId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const knownTags = useTagStore((s) => s.tags);

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
  }, [fetchMembers]);

  useEffect(() => {
    if (memberId) {
      fetchAccounts();
      fetchTransactions();
    }
  }, [memberId, fetchAccounts, fetchTransactions]);

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
  }, [memberAccounts, searchParams]);

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

  const debouncedLedgerQuery = useDebouncedValue(ledgerQuery, 200);

  const accountMapForSearch = useMemo(() => new Map(accounts.map((a) => [a.id, { name: a.name }])), [accounts]);
  const memberMapForSearch = useMemo(() => new Map(members.map((m) => [m.id, { name: m.name }])), [members]);
  const searchCtx = useMemo(
    () => ({
      accountMap: accountMapForSearch,
      memberMap: memberMapForSearch,
      shortDateFn: (iso: string) => shortDate(iso, locale),
    }),
    [accountMapForSearch, memberMapForSearch, locale],
  );

  const tagFilteredAll = useMemo(() => {
    if (!tagFilter) return sortedTxs;
    return sortedTxs.filter((tx) => Array.isArray(tx.metadata?.tags) && (tx.metadata.tags as string[]).includes(tagFilter));
  }, [sortedTxs, tagFilter]);

  const searchFilteredAll = useMemo(() => {
    if (!debouncedLedgerQuery.trim()) return tagFilteredAll;
    return tagFilteredAll.filter((tx) => matchesTx(tx, debouncedLedgerQuery, searchCtx));
  }, [tagFilteredAll, debouncedLedgerQuery, searchCtx]);

  const displayedTxs = useMemo(
    () => searchFilteredAll.slice(-displayLimit),
    [searchFilteredAll, displayLimit],
  );

  /** Tag-filtered view for ledger (displayed slice) — balance math uses full history. */
  const tagFilteredTxs = displayedTxs;

  const ledgerTagOptions = useMemo(() => {
    const inLedger = new Set<string>();
    sortedTxs.forEach((tx) => {
      if (Array.isArray(tx.metadata?.tags)) (tx.metadata.tags as string[]).forEach((t) => inLedger.add(t));
    });
    knownTags.forEach((t) => inLedger.add(t));
    return [...inLedger].sort((a, b) => a.localeCompare(b));
  }, [sortedTxs, knownTags]);

  const handleReachEnd = useCallback(() => {
    setDisplayLimit((prev) => Math.min(prev + 10, searchFilteredAll.length));
  }, [searchFilteredAll.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || displayLimit >= searchFilteredAll.length) return;
    const root = getScrollParent(el);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) handleReachEnd();
      },
      { root, rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [displayLimit, searchFilteredAll.length, handleReachEnd]);

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
        return tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? '(deleted account)') : '';
      case 'expense':
        return tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '(deleted account)') : '';
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
    const selectedAcct = memberAccounts.find((a) => a.id === selectedAccountId);

    function isTxCredit(tx: Transaction): boolean {
      const loanLike = ['transfer', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback', 'lend', 'repay'];
      if (loanLike.includes(tx.type)) return tx.destAccount === selectedAccountId;
      return tx.type === 'income';
    }

    if (!showBalance) {
      return [...tagFilteredTxs].reverse().map((tx) => ({
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: tx.description,
        account: resolveAccountDisplay(tx),
        debit: isTxCredit(tx) ? '\u2014' : formatAmountParts(tx.amount, locale, currency).amount,
        credit: isTxCredit(tx) ? formatAmountParts(tx.amount, locale, currency).amount : '\u2014',
        currencyLabel: currency,
        type: (['loan_issue', 'loan_repayment', 'lend', 'repay'].includes(tx.type) ? 'loan' : tx.type) as 'loan' | 'income' | 'expense' | 'transfer',
      }));
    }

    // Full-history running balance per transaction id (tag filter changes which
    // rows are shown, never the math).
    const hasOpeningTx = sortedTxs.some(
      (tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true,
    );
    const accountBalance = selectedAcct?.balance ?? 0;
    const netChange = sortedTxs.reduce((sum, tx) => sum + (isTxCredit(tx) ? tx.amount : -tx.amount), 0);
    let running = hasOpeningTx ? 0 : accountBalance - netChange;
    const balMap = new Map<string, number>();
    for (const tx of sortedTxs) {
      running += isTxCredit(tx) ? tx.amount : -tx.amount;
      balMap.set(tx.id, running);
    }

    return [...tagFilteredTxs]
      .map((tx) => {
        const credit = isTxCredit(tx);
        const displayType = ['loan_issue', 'loan_repayment', 'lend', 'repay'].includes(tx.type) ? 'loan' as const : tx.type as 'income' | 'expense' | 'transfer';
        return {
          id: tx.id,
          date: shortDate(tx.date, locale),
          description: tx.description,
          debit: credit ? '\u2014' : formatAmountParts(tx.amount, locale, currency).amount,
          credit: credit ? formatAmountParts(tx.amount, locale, currency).amount : '\u2014',
          balance: formatAmountParts(balMap.get(tx.id) ?? 0, locale, currency).amount,
          currencyLabel: currency,
          type: displayType,
        };
      })
      .reverse();
  }, [sortedTxs, tagFilteredTxs, locale, currency, showBalance, memberAccounts, selectedAccountId, resolveAccountDisplay]);

  const filteredLedger = useMemo(() => {
    return ledgerFilter === 'all' ? ledgerRows : ledgerRows.filter((row) => row.type === ledgerFilter);
  }, [ledgerRows, ledgerFilter]);

  const filteredTxs = useMemo(() => {
    let txs = [...tagFilteredTxs];
    if (ledgerFilter !== 'all') {
      const map: Record<string, string[]> = { income: ['income'], expense: ['expense', 'loan_issue', 'lend'], transfer: ['transfer'], loan: ['loan_issue', 'loan_repayment', 'lend', 'repay'] };
      const allowed = map[ledgerFilter] ?? [];
      txs = txs.filter((tx) => allowed.includes(tx.type));
    }
    return txs.sort((a, b) => b.date.localeCompare(a.date));
  }, [tagFilteredTxs, ledgerFilter]);

  const handleRowClick = useCallback((row: LedgerRow) => {
    if (row.id) {
      const tx = transactions.find((t) => t.id === row.id);
      useModalStore.getState().open('transaction-detail', { transaction: tx });
    }
  }, [transactions]);

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

  const loading = mLoading || aLoading || tLoading;
  const error = mError || aError || tError;

  const selectedAcct = selectedAccountId ? memberAccounts.find((a) => a.id === selectedAccountId) : undefined;
  const txCount = accountTxs.length;

  const downloadPdf = useCallback(async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
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
  }, [sortedTxs, showBalance, ledgerFilter, locale, currency, memberAccounts, selectedAccountId, member, ledgerQuery, selectedAcct]);

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

  return (
    <div className={styles.container}>
      <ProfileHero member={member} totalBalance={totalBalance} totalIncome={totalIncome} totalExpenses={totalExpenses} selectedAccountId={selectedAccountId} isDesktop={isDesktop} />
      <AccountsSection memberAccounts={memberAccounts} selectedAccountId={selectedAccountId} accountsOpen={accountsOpen} setAccountsOpen={setAccountsOpen} onAccountClick={handleAccountClick} isDesktop={isDesktop} memberId={memberId!} onSelectAccount={handleSelectAccount} />
      <LedgerSection
        isDesktop={isDesktop}
        memberAccounts={memberAccounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        filteredLedger={filteredLedger}
        filteredTxs={filteredTxs}
        searchFilteredAll={searchFilteredAll}
        ledgerFilter={ledgerFilter}
        setLedgerFilter={setLedgerFilter}
        ledgerQuery={ledgerQuery}
        setLedgerQuery={setLedgerQuery}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        ledgerTagOptions={ledgerTagOptions}
        showBalance={showBalance}
        displayLimit={displayLimit}
        onReachEnd={handleReachEnd}
        onRowClick={handleRowClick}
        onOpeningBalance={handleOpeningBalance}
        txCount={txCount}
        selectedAcct={selectedAcct}
        transactions={transactions}
        downloadPdf={downloadPdf}
      />
    </div>
  );
}
