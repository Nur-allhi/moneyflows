import { useRef, useState, useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DAYS, MONTHS } from '../constants/dates';
import { useModalStore } from '../stores/useModalStore';
import { useCloudIndicator } from '../hooks/useCloudIndicator';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useReplay } from '../hooks/useReplay';
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

/**
 * Sync button glyph states (T-173/T-174): idle cloud (centered tick badge when
 * fully synced, status dot otherwise), outer orbiting arc while any real sync
 * runs, full outer ring + check flash on clean completion. Honest states only.
 */
function SyncGlyph({ animKey, dot, spinning, justDone }: {
  animKey: string | number;
  dot: 'synced' | 'never' | 'warn';
  spinning: boolean;
  justDone: boolean;
}) {
  if (spinning) {
    return (
      <svg key={`spin-${animKey}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" strokeOpacity="0.55" />
        <circle className={styles.syncOrbit} cx="12" cy="12" r="10" strokeWidth="2.2" strokeDasharray="30 100" pathLength={100} transform="rotate(-90 12 12)" />
      </svg>
    );
  }
  if (justDone) {
    return (
      <span className={styles.syncDoneWrap}>
        <svg key={`done-${animKey}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
        </svg>
      </span>
    );
  }
  return (
    <>
      <svg key={animKey} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        {dot === 'synced' && (
          <g>
            <circle cx="12" cy="14.5" r="5" fill="var(--color-success)" stroke="none" />
            <path d="M10 14.5l1.5 1.5 2.5-3" stroke="var(--color-bg)" strokeWidth="1.6" />
          </g>
        )}
      </svg>
      {dot !== 'synced' && (
        <span className={`${styles.syncDot} ${dot === 'warn' ? styles.syncDotWarn : styles.syncDotIdle}`} />
      )}
    </>
  );
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
  const [backKey, replayBack] = useReplay();
  const [addKey, replayAdd] = useReplay();
  const [searchKey, replaySearch] = useReplay();
  const [gearKey, replayGear] = useReplay();
  const [themeKey, replayTheme] = useReplay();
  const [bellKey, replayBell] = useReplay();
  const [clearKey, replayClear] = useReplay();
  const [syncKey, replaySync] = useReplay();
  const syncState = useCloudIndicator();
  const syncingRef = useRef(false);
  /** Re-entrancy + visual busy flag for tap-to-sync (T-172/T-173). */
  const [syncBusy, setSyncBusy] = useState(false);
  /** Brief completion flash after a clean sync (T-173). */
  const [syncDone, setSyncDone] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const onStart = () => {
      if (doneTimer.current) {
        clearTimeout(doneTimer.current);
        doneTimer.current = null;
      }
      setSyncDone(false);
      setSyncBusy(true);
    };
    const onEnd = () => {
      setSyncBusy(false);
      getDatabase().getCloudStatus()
        .then((s) => {
          if (!s.lastError && !s.conflictPending) {
            setSyncDone(true);
            if (doneTimer.current) clearTimeout(doneTimer.current);
            doneTimer.current = setTimeout(() => {
              setSyncDone(false);
              doneTimer.current = null;
            }, 1200);
          }
        })
        .catch(() => {});
    };
    window.addEventListener('moneyflows:sync-start', onStart);
    window.addEventListener('moneyflows:sync-end', onEnd);
    return () => {
      window.removeEventListener('moneyflows:sync-start', onStart);
      window.removeEventListener('moneyflows:sync-end', onEnd);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, []);
  /**
   * Tap = immediate Sync-now for signed-in users (T-172); guests keep the
   * deep link into Settings Backup as a sign-in invitation.
   */
  const openSyncSettings = useCallback(() => {
    replaySync();
    if (!syncState) {
      navigate('/settings?tab=backup&open=google-drive-sync');
      return;
    }
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncBusy(true);
    const flashDone = () => {
      getDatabase().getCloudStatus()
        .then((s) => {
          if (!s.lastError && !s.conflictPending) {
            setSyncDone(true);
            if (doneTimer.current) clearTimeout(doneTimer.current);
            doneTimer.current = setTimeout(() => {
              setSyncDone(false);
              doneTimer.current = null;
            }, 1200);
          }
        })
        .catch(() => {});
    };
    getDatabase().syncNow()
      .catch(() => {})
      .finally(() => {
        syncingRef.current = false;
        setSyncBusy(false);
        // Tap with nothing to sync runs no network (no end event) — flash
        // the tick directly so the tap always answers (T-174).
        flashDone();
      });
  }, [replaySync, navigate, syncState]);
  const toggleTheme = () => {
    replayTheme();
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
              <button onClick={() => { replayBack(); navigate(-1); }} className={`${styles.backBtn} ${backKey > 0 ? styles.backNudge : ''}`} aria-label="Back">
                <svg key={backKey} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
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
            className={`${styles.searchClear} ${clearKey > 0 ? styles.clearTwist : ''}`}
            onClick={() => {
              replayClear();
              setQuery('');
              closeDrop();
            }}
            aria-label="Clear search"
          >
            <svg key={clearKey} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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
        <button className={`${styles.addBtn} ${addKey > 0 ? styles.addTwist : ''}`} onClick={() => { replayAdd(); useModalStore.getState().open('transaction-form'); }} aria-label="New transaction">
          <svg key={addKey} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className={styles.settingsWrap}>
          <button className={`${styles.mobileSearchBtn} ${searchActive ? styles.searchActiveBtn : ''} ${searchKey > 0 ? styles.searchPop : ''}`} onClick={() => { replaySearch(); onSearchToggle?.(); }} aria-label="Search">
            <svg key={searchKey} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="7" cy="7" r="5.5" />
              <path d="M11 11l3.5 3.5" />
            </svg>
          </button>
          <button className={`${styles.mobileSettingsBtn} ${gearKey > 0 ? styles.gearSpin : ''}`} onClick={() => { replayGear(); navigate('/settings'); }} aria-label="Settings" title="Settings">
            <svg key={gearKey} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
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
            <span key={`${effectiveTheme}-${themeKey}`} className={themeKey > 0 ? styles.themeSwap : styles.themeIcon}>
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
            </span>
          </button>
          {syncState && (
            <button
              className={`${styles.syncBtnMobile} ${syncKey > 0 ? styles.syncPop : ''}`}
              onClick={openSyncSettings}
              aria-label={`Cloud sync: ${syncBusy ? 'syncing' : syncState.title}`}
              title={syncBusy ? 'Syncing…' : syncState.title}
            >
              <SyncGlyph animKey={`m-${syncKey}`} dot={syncState.dot} spinning={syncBusy} justDone={syncDone && !syncBusy} />
            </button>
          )}
        </div>
        <button className={`${styles.notifBtn} ${bellKey > 0 ? styles.bellRing : ''}`} onClick={replayBell} aria-label="Notifications">
          {'\uD83D\uDD14'}
        </button>
        {syncState && (
          <button
            className={`${styles.syncBtn} ${syncKey > 0 ? styles.syncPop : ''}`}
            onClick={openSyncSettings}
            aria-label={`Cloud sync: ${syncBusy ? 'syncing' : syncState.title}`}
            title={syncBusy ? 'Syncing…' : syncState.title}
          >
            <SyncGlyph animKey={syncKey} dot={syncState.dot} spinning={syncBusy} justDone={syncDone && !syncBusy} />
          </button>
        )}
      </div>
    </header>
  );
}
