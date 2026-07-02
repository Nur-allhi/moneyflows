import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoanStore } from '../stores/useLoanStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { formatAmount } from '../../../presentation/utils/format';
import { GlassPanel } from '../../../presentation/components';
import { LoanCard } from '../components/LoanCard';
import { LoanDetailView } from '../components/LoanDetailView';
import { LoanForm } from '../components/LoanForm';
import styles from './LoansScreen.module.css';

export function LoansScreen() {
  const { debtorId: routeBorrowerId } = useParams<{ debtorId: string }>();
  const navigate = useNavigate();
  const { loanStacks, loading, error, fetchLoanStacks } = useLoanStore();
  const { loading: acctLoading, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'active' | 'settled' | 'all'>('active');

  useEffect(() => {
    fetchLoanStacks();
    fetchAccounts();
  }, []);

  const selectedStack = useMemo(() => {
    if (!routeBorrowerId || loanStacks.length === 0) return null;
    return loanStacks.find((s) => s.debtorId === routeBorrowerId) ?? null;
  }, [loanStacks, routeBorrowerId]);

  const filteredStacks = useMemo(() => {
    if (filter === 'active') return loanStacks.filter((s) => !s.isSettled);
    if (filter === 'settled') return loanStacks.filter((s) => s.isSettled);
    return loanStacks;
  }, [loanStacks, filter]);

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
      <div className={styles.header}>
        <h2 className={styles.title}>Your Loans</h2>
        <div className={styles.headerActions}>
          <span className={styles.count}>{loanStacks.length} Account{loanStacks.length !== 1 ? 's' : ''}</span>
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ New Loan</button>
        </div>
      </div>

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

      {filteredStacks.length === 0 ? (
        <GlassPanel padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F4B5}'}</div>
            <p className="empty-state-text">No {filter} loans</p>
          </div>
        </GlassPanel>
      ) : (
        <div className={styles.grid}>
          {filteredStacks.map((stack) => (
            <LoanCard
              key={stack.debtorId}
              stack={stack}
              locale={locale}
              currency={currency}
              onClick={() => navigate(`/loans/${stack.debtorId}`)}
            />
          ))}
        </div>
      )}

      {showForm && <div className={styles.formOverlay}><div className={styles.formSheet}><LoanForm onClose={() => setShowForm(false)} /></div></div>}
    </div>
  );
}
