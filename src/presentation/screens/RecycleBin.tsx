import { useEffect, useState, useMemo } from 'react';
import { RecycleRow, GlassPanel } from '../components';
import { useRecycleStore } from '../stores/useRecycleStore';
import styles from './RecycleBin.module.css';

const _fmt = Intl.NumberFormat('en-IN');
function fmt(n: number): string { return `${_fmt.format(n)} BDT`; }

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
  const { deletedItems, loading, error, fetchDeleted, restore, purge } = useRecycleStore();

  useEffect(() => {
    fetchDeleted();
  }, []);

  const [activeTab, setActiveTab] = useState('all');

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return deletedItems;
    return deletedItems.filter((item) =>
      activeTab === 'transactions' ? item.type === 'transaction' : item.type === 'account'
    );
  }, [deletedItems, activeTab]);

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
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statNum} style={{ color: 'var(--color-text-secondary)' }}>{deletedItems.length}</span>
          <span className={styles.statLabel}>Deleted Items</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum} style={{ color: 'var(--color-expense)' }}>{fmt(totalAmount)}</span>
          <span className={styles.statLabel}>Total Amount</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum} style={{ color: 'var(--color-income)' }}>30</span>
          <span className={styles.statLabel}>Days Until Auto-Purge</span>
        </div>
        <div className={styles.actionBar}>
          <button className={styles.pillBtn} onClick={() => fetchDeleted()}>{'\u{1F504}'} Refresh</button>
        </div>
      </div>

      <div className={styles.listPanel}>
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid var(--color-border)' }}>
          {['all', 'transactions', 'accounts'].map((key) => {
            const labels: Record<string, string> = { all: 'All Items', transactions: 'Transactions', accounts: 'Accounts' };
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '12px 20px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: activeTab === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                {labels[key] ?? key}
                <span style={{
                  fontSize: 11,
                  background: activeTab === key ? 'oklch(62% 0.22 290 / 0.15)' : 'oklch(100% 0 0 / 0.08)',
                  padding: '1px 7px',
                  borderRadius: 999,
                  marginLeft: 6,
                }}>
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
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        <div className={styles.listBody}>
          {filteredItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 24px' }}>
              <div className="empty-state-icon">{'\uD83D\uDDD1\uFE0F'}</div>
              <p className="empty-state-text">No deleted items</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <RecycleRow
                key={item.id}
                icon={item.type === 'transaction' ? '\u26A0' : '\u{1F3E6}'}
                iconVariant={item.type === 'transaction' ? 'warning' : 'account'}
                name={item.name}
                meta={item.type === 'transaction' ? 'Transaction' : 'Account'}
                amount={item.amount != null ? `-${fmt(item.amount)}` : '\u2014'}
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
