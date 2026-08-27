import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoanStore } from '../stores/useLoanStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { useModalStore } from '../../../presentation/stores/useModalStore';
import { formatAmount } from '../../../presentation/utils/format';
import { GlassPanel } from '../../../presentation/components';
import { LoanCard } from '../components/LoanCard';
import { LoanDetailView } from '../components/LoanDetailView';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import type { Transaction } from '../../../core/domain/Transaction';
import txStyles from '../../../presentation/modals/TransactionFormModal.module.css';
import styles from './LoansScreen.module.css';

function ledgerGradient(name: string): string {
  const hues = [290, 170, 30, 85, 220, 330, 50, 190];
  let idx = 0;
  for (let i = 0; i < name.length; i++) idx = (idx * 31 + name.charCodeAt(i)) % hues.length;
  const h = hues[idx]!;
  return `linear-gradient(135deg, oklch(62% 0.22 ${h}), oklch(50% 0.2 ${h}))`;
}

export function LoansScreen() {
  const { debtorId: routeBorrowerId } = useParams<{ debtorId: string }>();
  const navigate = useNavigate();
  const { loanStacks, loading, error, fetchLoanStacks } = useLoanStore();
  const { loading: acctLoading, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [filter, setFilter] = useState<'active' | 'settled' | 'all'>('active');
  const [mobileSearch, setMobileSearch] = useState('');
  const [sortBy, setSortBy] = useState<'alpha' | 'lastTx' | 'lastRepay'>('alpha');
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchLoanStacks();
    fetchAccounts();
    getDatabase().getTransactions().then(setTxs).catch(() => {});
  }, [fetchLoanStacks, fetchAccounts]);

  const selectedStack = useMemo(() => {
    if (!routeBorrowerId || loanStacks.length === 0) return null;
    return loanStacks.find((s) => s.debtorId === routeBorrowerId) ?? null;
  }, [loanStacks, routeBorrowerId]);

  const getLastTxDate = (debtorId: string): string => {
    let latest = '';
    for (const tx of txs) {
      if (tx.sourceAccount === debtorId || tx.destAccount === debtorId) {
        if (!latest || tx.date > latest) latest = tx.date;
      }
    }
    return latest;
  };
  const getLastRepayDate = (debtorId: string): string => {
    let latest = '';
    for (const tx of txs) {
      const isRepay = tx.type === 'repay' || tx.type === 'loan_repayment' || tx.type === 'loan_paidback';
      if (isRepay && (tx.sourceAccount === debtorId || tx.destAccount === debtorId)) {
        if (!latest || tx.date > latest) latest = tx.date;
      }
    }
    return latest;
  };

  const filteredStacks = useMemo(() => {
    const byStatus = filter === 'active' ? loanStacks.filter((s) => !s.isSettled)
      : filter === 'settled' ? loanStacks.filter((s) => s.isSettled)
      : loanStacks;
    const q = mobileSearch.trim().toLowerCase();
    let list = q ? byStatus.filter((s) => s.debtorName.toLowerCase().includes(q)) : byStatus;
    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.debtorName.localeCompare(b.debtorName));
    else if (sortBy === 'lastTx') list = [...list].sort((a, b) => getLastTxDate(b.debtorId).localeCompare(getLastTxDate(a.debtorId)));
    else if (sortBy === 'lastRepay') list = [...list].sort((a, b) => getLastRepayDate(b.debtorId).localeCompare(getLastRepayDate(a.debtorId)));
    return list;
    // getLastTxDate/getLastRepayDate read txs which is dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanStacks, filter, mobileSearch, sortBy, txs]);

  const totals = useMemo(() => ({
    active: loanStacks.filter((s) => !s.isSettled).reduce((s, x) => s + x.totalOutstanding, 0),
    settled: loanStacks.filter((s) => s.isSettled).reduce((s, x) => s + x.totalOutstanding, 0),
    all: loanStacks.reduce((s, x) => s + x.totalOutstanding, 0),
  }), [loanStacks]);

  if (loading || acctLoading) {
    return (
      <div className={styles.container}>
        <div className="skeleton skeleton-summary" />
        <div className={styles.grid}>{[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-card" />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <GlassPanel padding="lg">
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">Could not load loan data</p>
            <button className="retry-btn" onClick={fetchLoanStacks}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (routeBorrowerId && selectedStack) {
    return <LoanDetailView stack={selectedStack} />;
  }

  if (routeBorrowerId && !selectedStack) {
    return (
      <div className={styles.container}>
        <GlassPanel padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F50D}'}</div>
            <p className="empty-state-text">Counterparty not found</p>
            <button className="retry-btn" onClick={() => navigate('/loans')}>View all</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="7" cy="7" r="5.5" />
              <path d="M11 11l3.5 3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search loans..."
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
          />
          {mobileSearch && (
            <button className={styles.searchClear} onClick={() => setMobileSearch('')} aria-label="Clear search">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>Your Loans</h2>
        <div className={styles.filterStrip}>
          <button className={`${styles.filterBtn} ${filter === 'active' ? styles.filterActive : ''}`} onClick={() => setFilter('active')}>
            Active <span className={styles.filterAmt}>{formatAmount(totals.active, locale, currency)}</span>
          </button>
          <button className={`${styles.filterBtn} ${filter === 'settled' ? styles.filterActive : ''}`} onClick={() => setFilter('settled')}>
            Settled <span className={styles.filterAmt}>{formatAmount(totals.settled, locale, currency)}</span>
          </button>
          <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>
            All <span className={styles.filterAmt}>{formatAmount(totals.all, locale, currency)}</span>
          </button>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={txStyles.pickerTrigger} style={{ width: 'auto', minWidth: 0, flexShrink: 0, whiteSpace: 'nowrap', padding: '8px 12px', gap: 8 }} onClick={() => setShowSortPicker(true)}>
            <span className={txStyles.pickerValue} style={{ whiteSpace: 'nowrap' }}>{sortBy === 'alpha' ? 'Alphabetically' : sortBy === 'lastTx' ? 'Last transaction' : 'Last repayment'}</span>
            <span className={txStyles.pickerArrow} style={{ flexShrink: 0 }}>▾</span>
          </button>
          <span className={styles.count} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{filteredStacks.length} Account{filteredStacks.length !== 1 ? 's' : ''}</span>
          <button className={styles.addBtn} style={{ whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'loan' })}>+ New Loan</button>
        </div>
      </div>

      {showSortPicker && (
        <div className={txStyles.pickerOverlay} onClick={() => setShowSortPicker(false)}>
          <div className={txStyles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={txStyles.pickerHeader}>
              <span className={txStyles.pickerTitle}>Sort by</span>
              <button className={txStyles.pickerClose} onClick={() => setShowSortPicker(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className={txStyles.pickerList}>
              {[
                { key: 'alpha' as const, label: 'Alphabetically' },
                { key: 'lastTx' as const, label: 'Last transaction' },
                { key: 'lastRepay' as const, label: 'Last repayment' },
              ].map((opt) => (
                <button key={opt.key} className={txStyles.pickerItem} onClick={() => { setSortBy(opt.key); setShowSortPicker(false); }} style={sortBy === opt.key ? { background: 'var(--color-primary)', color: 'white', borderRadius: 10 } : undefined}>
                  <span className={txStyles.pickerItemName}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>Total Outstanding</span>
        <span className={styles.summaryValue}>{formatAmount(totals[filter], locale, currency)}</span>
      </div>

      {filteredStacks.length === 0 ? (
        <GlassPanel padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F4B5}'}</div>
            <p className="empty-state-text">{mobileSearch ? `No loans match "${mobileSearch}"` : `No ${filter} loans`}</p>
          </div>
        </GlassPanel>
      ) : (
        <div className={styles.grouped}>
          {(['internal', 'external'] as const).map((type) => {
            const list = filteredStacks.filter((s) => (type === 'internal' ? s.stackType === 'internal' : s.stackType !== 'internal'));
            if (list.length === 0) return null;
            const total = list.reduce((s, x) => s + x.totalOutstanding, 0);
            const label = type === 'internal' ? 'Internal' : 'External';
            return (
              <div key={type} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionAvatar} style={{ background: ledgerGradient(label) }}>{label[0]}</span>
                  <span className={styles.sectionInfo}>
                    <span className={styles.sectionName}>{label}</span>
                    <span className={styles.sectionMeta}><span>{list.length} ledger{list.length !== 1 ? 's' : ''}</span><span style={{ opacity: 0.4 }}>·</span><span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{formatAmount(total, locale, currency)}</span></span>
                  </span>
                </div>
                <div className={styles.grid}>
                  {list.map((stack) => (
                    <LoanCard
                      key={stack.debtorId}
                      stack={stack}
                      locale={locale}
                      currency={currency}
                      onClick={() => navigate(`/loans/${stack.debtorId}`)}
                      searchQuery={mobileSearch}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
