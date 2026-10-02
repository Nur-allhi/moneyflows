import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DAYS, MONTHS } from '../constants/dates';
import { useModalStore } from '../stores/useModalStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useEffectiveTheme } from '../hooks/useTheme';
import { GlobalSearchResults } from './GlobalSearch';
import { useGlobalSearch, type GlobalSearchItem } from './useGlobalSearch';
import styles from './Header.module.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showDate?: boolean;
  breadcrumb?: BreadcrumbItem[];
  className?: string;
  searchActive?: boolean;
  onSearchToggle?: () => void;
}

function formatDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function Header({
  title,
  showLogo = true,
  showDate = true,
  breadcrumb,
  className = '',
  searchActive = false,
  onSearchToggle,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const isMobile = window.innerWidth < 768;
  const isDashboard = location.pathname === '/';
  const gs = useGlobalSearch();
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const effectiveTheme = useEffectiveTheme();
  const toggleTheme = () => {
    useSettingsStore
      .getState()
      .updateSettings({ theme: effectiveTheme === 'light' ? 'dark' : 'light' });
  };

  const closeDrop = () => {
    setDropOpen(false);
    inputRef.current?.blur();
  };

  const handlePick = (item: GlobalSearchItem) => {
    item.run();
    closeDrop();
  };

  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.left}>
        {isMobile ? (
          isDashboard ? (
            showLogo && (
              <span className={styles.logo}>
                Money<span className={styles.logoSpan}>Flows</span>
              </span>
            )
          ) : (
            <>
              <button onClick={() => navigate(-1)} className={styles.backBtn} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              {breadcrumb ? (
                <div className={styles.breadcrumb}>
                  {breadcrumb.map((item, i) => (
                    <span key={item.label}>
                      {i > 0 && <span className={styles.sep}>/</span>}
                      {item.path ? <Link to={item.path}>{item.label}</Link> : <span>{item.label}</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.title}>{title}</span>
              )}
            </>
          )
        ) : !isDashboard ? (
          <>
            <button onClick={() => navigate(-1)} className={styles.backBtn} aria-label="Back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            {breadcrumb ? (
              <div className={styles.breadcrumb}>
                {breadcrumb.map((item, i) => (
                  <span key={item.label}>
                    {i > 0 && <span className={styles.sep}>/</span>}
                    {item.path ? <Link to={item.path}>{item.label}</Link> : <span>{item.label}</span>}
                  </span>
                ))}
              </div>
            ) : (
              title && <span className={styles.title}>{title}</span>
            )}
          </>
        ) : null}
      </div>

      <div
        className={styles.searchWrap}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropOpen(false);
        }}
      >
        <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M11 11l3.5 3.5" />
        </svg>
        <input
          ref={inputRef}
          className={styles.searchInput}
          placeholder="Search anything..."
          value={query}
          onFocus={() => setDropOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              gs.move(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              gs.move(-1);
            } else if (e.key === 'Enter') {
              if (gs.selectActive()) closeDrop();
            } else if (e.key === 'Escape') {
              closeDrop();
            }
          }}
        />
        {query && (
          <button
            className={styles.searchClear}
            onClick={() => {
              setQuery('');
              closeDrop();
            }}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        )}
        {dropOpen && gs.debounced && (
          <GlobalSearchResults
            sections={gs.sections}
            flat={gs.flat}
            activeIndex={gs.activeIndex}
            query={gs.debounced}
            onHover={gs.setActiveIndex}
            onPick={handlePick}
          />
        )}
      </div>

      <div className={styles.right}>
        {showDate && <span className={styles.date}>{formatDate()}</span>}
        <button className={styles.addBtn} onClick={() => useModalStore.getState().open('transaction-form')} aria-label="New transaction">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className={styles.settingsWrap}>
          <button className={`${styles.mobileSearchBtn} ${searchActive ? styles.searchActiveBtn : ''}`} onClick={onSearchToggle} aria-label="Search">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="7" cy="7" r="5.5" />
              <path d="M11 11l3.5 3.5" />
            </svg>
          </button>
          <button className={styles.mobileSettingsBtn} onClick={() => navigate('/settings')} aria-label="Settings" title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={effectiveTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={effectiveTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {effectiveTheme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>
        <button className={styles.notifBtn} aria-label="Notifications">
          {'\uD83D\uDD14'}
        </button>
      </div>
    </header>
  );
}
