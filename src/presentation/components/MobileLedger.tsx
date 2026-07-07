import { useState, useEffect, useRef, type ReactNode } from 'react';
import styles from './MobileLedger.module.css';

interface FilterOption {
  key: string;
  label: string;
}

interface MobileLedgerProps {
  title: string;
  count: number;
  filterOptions: FilterOption[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onDownloadPdf: () => void;
  loadingMore?: boolean;
  sentinel: ReactNode;
  children: ReactNode;
  empty?: ReactNode;
}

export function MobileLedger({
  title, count, filterOptions, activeFilter, onFilterChange,
  searchQuery, onSearchChange, onDownloadPdf, loadingMore, sentinel, children, empty,
}: MobileLedgerProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={styles.mobileLedger}>
      <div ref={trayRef}>
        <div className={styles.toolbar}>
          <div className={styles.title}>{title}</div>
          <span className={styles.badge}>{count}</span>
          <div className={styles.actions}>
            <button className={styles.iconBtn} onClick={() => setFilterOpen((o) => !o)} aria-label="Filter">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M2 4.5h14M4.5 9h9M7 13.5h4" />
                <circle cx="4.5" cy="4.5" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="13.5" cy="9" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="9" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <button className={styles.iconBtn} onClick={() => setSearchOpen((o) => !o)} aria-label="Search">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="8" cy="8" r="5.5" />
                <path d="M12 12l4 4" />
              </svg>
            </button>
            <button className={styles.iconBtn} onClick={onDownloadPdf} aria-label="Download PDF">
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
            {filterOptions.map((f) => (
              <button
                key={f.key}
                className={`${styles.filterPill} ${activeFilter === f.key ? styles.filterPillActive : ''}`}
                onClick={() => onFilterChange(f.key)}
              >{f.label}</button>
            ))}
          </div>
        </div>

        <div className={`${styles.searchBar} ${searchOpen ? styles.searchBarOpen : ''}`}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="7" cy="7" r="5.5" />
              <path d="M11 11l3.5 3.5" />
            </svg>
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => onSearchChange('')} aria-label="Clear">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {empty}
      {children}
      {loadingMore && (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={`skel-${i}`} className={styles.skeletonRow}>
            <span className={styles.skeletonSquare} />
            <span className={styles.skeletonBar} />
            <span className={styles.skeletonAmount} />
          </div>
        ))
      )}
      {sentinel}
    </div>
  );
}
