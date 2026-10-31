import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { RecycleRow, GlassPanel, AlertIcon, TrashIcon } from '../components';
import { RefreshCw, AlertTriangle, Landmark, NotebookText, ClipboardList } from 'lucide-react';
import { useRecycleStore } from '../stores/useRecycleStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import { useReplay } from '../hooks/useReplay';
import { DELETED_KIND, RECYCLE_TABS, RECYCLE_TAB_LABEL, RECYCLE_TAB_TOTAL_LABEL } from '../constants/recycleKinds';
import type { RecycleTab } from '../constants/recycleKinds';
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

/**
 * M-03: per-kind lucide glyphs (the audit's DELETED_KIND map carries the
 * label/tab/variant; only the emoji `icon` field there is superseded here).
 */
const KIND_ICON: Record<string, ReactNode> = {
  transaction: <AlertTriangle size={14} strokeWidth={1.8} aria-hidden="true" />,
  account: <Landmark size={14} strokeWidth={1.8} aria-hidden="true" />,
  other_ledger: <NotebookText size={14} strokeWidth={1.8} aria-hidden="true" />,
  other_entry: <ClipboardList size={14} strokeWidth={1.8} aria-hidden="true" />,
};

export function RecycleBin() {
  const { deletedItems, loading, error, fetchDeleted, restore, purge } = useRecycleStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [mobileSearch, setMobileSearch] = useState('');
  const [retryKey, replayRetry] = useReplay();
  const [clearKey, replayClear] = useReplay();
  const [refreshKey, replayRefresh] = useReplay();
  const [tabKey, replayTab] = useReplay();
  const [tabPicked, setTabPicked] = useState<string | null>(null);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const [activeTab, setActiveTab] = useState<RecycleTab>('all');

  const effectiveSearch = mobileSearch.trim();
  const filteredItems = useMemo(() => {
    const byTab = activeTab === 'all' ? deletedItems : deletedItems.filter((item) => DELETED_KIND[item.type].tab === activeTab);
    return effectiveSearch
      ? byTab.filter((item) => item.name.toLowerCase().includes(effectiveSearch.toLowerCase()))
      : byTab;
  }, [deletedItems, activeTab, effectiveSearch]);

  const tabCount = (key: RecycleTab) => {
    if (key === 'all') return deletedItems.length;
    return deletedItems.filter((i) => DELETED_KIND[i.type].tab === key).length;
  };

  /** Sum inside the active tab only — one kind, so the figure means something. */
  const tabTotal = useMemo(
    () => filteredItems.reduce((s, item) => s + (item.amount ?? 0), 0),
    [filteredItems],
  );
  const kindsInBin = useMemo(() => new Set(deletedItems.map((i) => i.type)).size, [deletedItems]);

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
            <div className="error-state-icon"><AlertIcon /></div>
            <p className="error-state-text">Could not load recycle bin</p>
            <button className={`retry-btn ${retryKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayRetry(); fetchDeleted(); }}><span className="anim-target" key={retryKey}>Retry</span></button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.recycle}>
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
            <button className={`${styles.searchClear} ${clearKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClear(); setMobileSearch(''); }} aria-label="Clear search">
              <svg key={clearKey} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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
          <span className={`${styles.statNum} ${activeTab === 'all' ? '' : styles.statExpense}`}>
            {activeTab === 'all' ? kindsInBin : formatAmount(tabTotal, locale, currency)}
          </span>
          <span className={styles.statLabel}>{activeTab === 'all' ? 'Item Types' : RECYCLE_TAB_TOTAL_LABEL[activeTab]}</span>
        </div>
        <div className={styles.statItem}>
          <span className={`${styles.statNum} ${styles.statIncome}`}>30</span>
          <span className={styles.statLabel}>Days Until Auto-Purge</span>
        </div>
        <div className={styles.actionBar}>
          <button className={`${styles.pillBtn} ${refreshKey > 0 ? 'anim-spin' : ''}`} onClick={() => { replayRefresh(); fetchDeleted(); }}><span className="anim-target" key={refreshKey}><RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" /></span> Refresh</button>
        </div>
      </div>

      <div className={styles.listPanel}>
        <div className={styles.tabBar}>
          {RECYCLE_TABS.map((key) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''} ${tabPicked === key && tabKey > 0 ? 'anim-pop' : ''}`}
                onClick={() => { replayTab(); setTabPicked(key); setActiveTab(key); }}
              >
                <span className="anim-target" key={`${key}-${tabPicked === key ? tabKey : 0}`}>
                {RECYCLE_TAB_LABEL[key]}
                <span className={`${styles.tabBadge} ${isActive ? styles.tabBadgeActive : ''}`}>
                  {tabCount(key)}
                </span>
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
              <div className="empty-state-icon"><TrashIcon /></div>
              <p className="empty-state-text">{effectiveSearch ? `No matches for "${effectiveSearch}"` : 'No deleted items'}</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <RecycleRow
                searchQuery={effectiveSearch}
                key={item.id}
                icon={KIND_ICON[item.type]}
                iconVariant={DELETED_KIND[item.type].iconVariant}
                name={item.name}
                meta={DELETED_KIND[item.type].label}
                amount={item.amount != null ? formatAmount(item.amount, locale, currency) : '\u2014'}
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
