import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecycleRow, GlassPanel } from '../components';
import { useRecycleStore } from '../stores/useRecycleStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import { useSearchStore } from '../stores/useSearchStore';
import styles from './RecycleBin.module.css';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor(ms / 3600000);
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'just now';
}

export function RecycleBin() {
  const navigate = useNavigate();
  const { deletedItems, loading, error, fetchDeleted, restore, purge } = useRecycleStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const searchQuery = useSearchStore((s) => s.query.toLowerCase().trim());
  const [mobileSearch, setMobileSearch] = useState('');

  useEffect(() => {
    fetchDeleted();
  }, []);

  const [activeTab, setActiveTab] = useState('all');

  const effectiveSearch = mobileSearch.toLowerCase().trim() || searchQuery;
  const filteredItems = useMemo(() => {
    const byTab = activeTab === 'all' ? deletedItems
      : deletedItems.filter((item) => activeTab === 'transactions' ? item.type === 'transaction' : item.type === 'account');
    return effectiveSearch
      ? byTab.filter((item) => item.name.toLowerCase().includes(effectiveSearch))
      : byTab;
  }, [deletedItems, activeTab, effectiveSearch]);

  const tabCount = (key: string) => {
    if (key === 'all') return deletedItems.length;
    return deletedItems.filter((i) => key === 'transactions' ? i.type === 'transaction' : i.type === 'account').length;
  };

  const totalAmount = useMemo(
    () => deletedItems.reduce((s, item) => s + (item.amount ?? 0), 0),
    [deletedItems],
  );

  if (loading) {
    return (
      <div className={styles.recycle}>
        <div className={styles.loading}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.recycle}>
        <GlassPanel padding="lg">
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">Could not load recycle bin</p>
            <button className="retry-btn" onClick={() => fetchDeleted()}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.recycle}>
      <div className={styles.mobHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Back">
          {'\u2190'}
        </button>
        <span className={styles.pageTitle}>Recycle Bin</span>
        <button className={styles.refreshCircleBtn} onClick={() => fetchDeleted()} aria-label="Refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

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
            placeholder="Search deleted items..."
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

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>{deletedItems.length}</span>
          <span className={styles.statLabel}>Deleted Items</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statNum} ${styles.statExpense}`}>{formatAmount(totalAmount, locale, currency)}</span>
          <span className={styles.statLabel}>Total Amount</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statNum} ${styles.statIncome}`}>30</span>
          <span className={styles.statLabel}>Days Until Auto-Purge</span>
        </div>
        <div className={styles.actionBar}>
          <button className={styles.pillBtn} onClick={() => fetchDeleted()}>{'\u{1F504}'} Refresh</button>
        </div>
      </div>

      <div className={styles.listPanel}>
        <div className={styles.tabBar}>
          {['all', 'transactions', 'accounts'].map((key) => {
            const labels: Record<string, string> = { all: 'All Items', transactions: 'Transactions', accounts: 'Accounts' };
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {labels[key] ?? key}
                <span className={`${styles.tabBadge} ${isActive ? styles.tabBadgeActive : ''}`}>
                  {tabCount(key)}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.listHeader}>
          <span />
          <span>Name</span>
          <span>Amount</span>
          <span>Deleted</span>
          <span className={styles.actionsLabel}>Actions</span>
        </div>

        <div className={styles.listBody}>
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">{'\uD83D\uDDD1\uFE0F'}</div>
              <p className="empty-state-text">{searchQuery ? 'No deleted items match your search' : 'No deleted items'}</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <RecycleRow
                key={item.id}
                icon={item.type === 'transaction' ? '\u26A0' : '\u{1F3E6}'}
                iconVariant={item.type === 'transaction' ? 'warning' : 'account'}
                name={item.name}
                meta={item.type === 'transaction' ? 'Transaction' : 'Account'}
                amount={item.amount != null ? `-${formatAmount(item.amount, locale, currency)}` : '\u2014'}
                amountColor={item.amount != null ? 'var(--color-expense)' : 'var(--color-text-secondary)'}
                date={timeAgo(item.deletedAt)}
                onRestore={() => restore(item.id, item.type)}
                onDelete={() => purge(item.id, item.type)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
