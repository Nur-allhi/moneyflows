import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Avatar, AccountCard, LedgerTable, SegmentedTabs, GlassPanel } from '../components';
import type { LedgerRow } from '../components';
import { useAnimatedValue } from '../hooks';
import { useModalStore } from '../stores/useModalStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { Transaction } from '../../core/domain/Transaction';
import { formatAmount } from '../utils/format';
import { shortDate } from '../constants/dates';
import { ACCOUNT_TYPE_GRADIENT_THREE, displayType } from '../constants/labels';
import { ACCOUNT_CARD_WIDTH, CARD_GAP } from '../constants/config';
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
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [ledgerFilter, setLedgerFilter] = useState('all');

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
  const [displayLimit, setDisplayLimit] = useState(15);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
    () => memberTxs.filter((t) => t.type === 'expense' || t.type === 'loan_issue').reduce((s, t) => s + t.amount, 0),
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
    if (!el || displayLimit >= sortedTxs.length) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setDisplayLimit((prev) => Math.min(prev + 15, sortedTxs.length));
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [displayLimit, sortedTxs.length]);



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
      case 'loan_issue': {
        const account = tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '?') : '?';
        const debtor = tx.debtorId ? (memberMap.get(tx.debtorId)?.name ?? '?') : '';
        return debtor ? `${account} (\u2192 ${debtor})` : account;
      }
      case 'loan_repayment': {
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
        const isCredit = tx.type === 'income' || tx.type === 'loan_repayment';
        const displayType = tx.type === 'loan_issue' || tx.type === 'loan_repayment' ? 'loan' as const : tx.type as 'income' | 'expense' | 'transfer';
        return {
          id: tx.id,
          date: shortDate(tx.date, locale),
          description: tx.description,
          account: resolveAccountDisplay(tx),
          debit: isCredit ? '\u2014' : formatAmount(tx.amount, locale, currency),
          credit: isCredit ? formatAmount(tx.amount, locale, currency) : '\u2014',
          type: displayType,
        };
      });
    }
    const selectedAcct = memberAccounts.find((a) => a.id === selectedAccountId);
    const accountBalance = selectedAcct?.balance ?? 0;
    const netChange = sortedTxs.reduce((sum, tx) => {
      const isCredit = tx.type === 'income' || tx.type === 'loan_repayment';
      return isCredit ? sum + tx.amount : sum - tx.amount;
    }, 0);
    const startBalance = accountBalance - netChange;
    let running = startBalance;
    const rows: LedgerRow[] = sortedTxs.map((tx) => {
      const isCredit = tx.type === 'income' || tx.type === 'loan_repayment';
      if (isCredit) running += tx.amount;
      else running -= tx.amount;

      const displayType = tx.type === 'loan_issue' || tx.type === 'loan_repayment' ? 'loan' as const : tx.type as 'income' | 'expense' | 'transfer';

      return {
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: tx.description,
        debit: isCredit ? '\u2014' : formatAmount(tx.amount, locale, currency),
        credit: isCredit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        balance: formatAmount(running, locale, currency),
        type: displayType,
      };
    });
    rows.unshift({
      date: shortDate(selectedAcct?.createdAt ?? '', locale),
      description: 'Opening Balance',
      debit: '\u2014',
      credit: formatAmount(startBalance, locale, currency),
      balance: formatAmount(startBalance, locale, currency),
      type: 'income' as const,
    });
    return rows.reverse();
  }, [sortedTxs, displayedTxs, locale, showBalance, memberAccounts, selectedAccountId]);

  const filteredLedger = ledgerFilter === 'all'
    ? ledgerRows
    : ledgerRows.filter((row) => row.type === ledgerFilter);

  const handleRowClick = useCallback((row: LedgerRow) => {
    if (row.id) useModalStore.getState().open('transaction-detail', { txId: row.id });
  }, []);

  const handleAccountClick = useCallback((acctId: string) => {
    setSelectedAccountId((prev) => prev === acctId ? null : acctId);
    setAccountsOpen(false);
  }, []);

  const animTotalBalance = useAnimatedValue(totalBalance);
  const animTotalIncome = useAnimatedValue(totalIncome);
  const animTotalExpenses = useAnimatedValue(totalExpenses);

  const handleScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (ACCOUNT_CARD_WIDTH + CARD_GAP));
    setActiveDot(Math.min(idx, memberAccounts.length - 1));
  }, [memberAccounts.length]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const loading = mLoading || aLoading || tLoading;
  const error = mError || aError || tError;

  const selectedAcct = selectedAccountId ? memberAccounts.find((a) => a.id === selectedAccountId) : undefined;
  const txCount = accountTxs.length;

  const downloadPdf = useCallback(() => {
    const pdfRows: { date: string; type: string; description: string; debit: string; credit: string; balance: string }[] = [];
    if (!showBalance) {
      for (const tx of [...sortedTxs].reverse()) {
        const isCredit = tx.type === 'income' || tx.type === 'loan_repayment';
        pdfRows.push({
          date: shortDate(tx.date, locale),
          type: tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          description: tx.description,
          debit: isCredit ? '' : formatAmount(tx.amount, locale, currency),
          credit: isCredit ? formatAmount(tx.amount, locale, currency) : '',
          balance: '',
        });
      }
    } else {
      const selectedAcct = memberAccounts.find((a) => a.id === selectedAccountId);
      const accountBalance = selectedAcct?.balance ?? 0;
      const netChange = sortedTxs.reduce((sum, tx) => {
        const isCredit = tx.type === 'income' || tx.type === 'loan_repayment';
        return isCredit ? sum + tx.amount : sum - tx.amount;
      }, 0);
      const startBalance = accountBalance - netChange;
      let running = startBalance;
      pdfRows.push({
        date: shortDate(selectedAcct?.createdAt ?? '', locale),
        type: 'Opening Balance',
        description: '',
        debit: '',
        credit: formatAmount(startBalance, locale, currency),
        balance: formatAmount(startBalance, locale, currency),
      });
      for (const tx of sortedTxs) {
        const isCredit = tx.type === 'income' || tx.type === 'loan_repayment';
        if (isCredit) running += tx.amount;
        else running -= tx.amount;
        pdfRows.push({
          date: shortDate(tx.date, locale),
          type: tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          description: tx.description,
          debit: isCredit ? '' : formatAmount(tx.amount, locale, currency),
          credit: isCredit ? formatAmount(tx.amount, locale, currency) : '',
          balance: formatAmount(running, locale, currency),
        });
      }
    }

    const filteredPdfRows = ledgerFilter === 'all'
      ? pdfRows
      : pdfRows.filter((r) => {
          const typeKey = r.type.toLowerCase().replace(/\s+/g, '_');
          return typeKey === ledgerFilter || (ledgerFilter === 'income' && typeKey === 'opening_balance') || (ledgerFilter === 'loan' && (typeKey === 'loan_issue' || typeKey === 'loan_repayment'));
        });

    if (filteredPdfRows.length === 0) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Transaction Report', pageW / 2, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const headerInfo = selectedAcct
      ? `Account: ${selectedAcct.name}  |  Member: ${member?.name ?? ''}`
      : `All Accounts  |  Member: ${member?.name ?? ''}`;
    doc.text(headerInfo, pageW / 2, 30, { align: 'center' });

    const firstTx = sortedTxs[0];
    const lastTx = sortedTxs[sortedTxs.length - 1];
    const firstDate = firstTx ? shortDate(firstTx.date, locale) : '';
    const lastDate = lastTx ? shortDate(lastTx.date, locale) : '';
    const period = firstDate && lastDate ? `Period: ${firstDate}  -  ${lastDate}` : '';
    if (period) doc.text(period, pageW / 2, 38, { align: 'center' });

    const headers = ['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance'];
    const body = filteredPdfRows.map((r) => [r.date, r.type, r.description, r.debit, r.credit, r.balance]);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 46,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto', halign: 'left' },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },
      didDrawPage: (data) => {
        const y = data.cursor?.y ?? 200;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('This is a system generated report', pageW / 2, y + 15, { align: 'center' });
      },
    });

    const fileName = `Transaction_Report_${member?.name ?? 'Unknown'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }, [sortedTxs, showBalance, ledgerFilter, locale, currency, memberAccounts, selectedAccountId, member]);

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
      <div className={styles.mobileOnly}>
        <div className={styles.profileCard}>
          <Avatar initial={initial} seed={member.name} name={member.name} size={72} />
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{member.name}</div>
            <div className={styles.profileTag}>
              {member.isExternal ? 'External' : 'Family'}
            </div>
          </div>
          <div className={styles.profileBalance}>
            <div className={styles.balanceLabel}>Balance</div>
            <div className={styles.balanceAmount}>{formatAmount(animTotalBalance, locale, currency)}</div>
          </div>
        </div>

        <div className={styles.sectionLabel}>
          Accounts
          <button className={styles.addAcctBtn} onClick={() => useModalStore.getState().open('add-account', { memberId })}>+ Add</button>
        </div>
        <div className={styles.carousel} ref={carouselRef}>
          {memberAccounts.length === 0 ? (
            <div className={styles.emptyState}>
              <p className="empty-state-text">No accounts</p>
              <button className={styles.emptyAddBtn} onClick={() => useModalStore.getState().open('add-account', { memberId })}>+ Add Account</button>
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
        <div className={styles.carouselDots}>
          {memberAccounts.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === activeDot ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>

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
                <span className={styles.pdfBtnIcon}>{'\u{1F4E5}'}</span>
                <span className={styles.pdfBtnLabel}>Download PDF</span>
              </button>
              <SegmentedTabs
                tabs={ledgerFilters}
                activeKey={ledgerFilter}
                onChange={setLedgerFilter}
              />
              {selectedAccountId && (
                <button className={styles.showAllBtn} onClick={() => setSelectedAccountId(null)}>All account</button>
              )}
            </div>
          </div>
          <LedgerTable rows={filteredLedger} desktop showBalance={showBalance} onRowClick={handleRowClick} sentinel={<div ref={sentinelRef} style={{ height: 1 }} />} />
        </div>
      </div>

    </div>
  );
}
