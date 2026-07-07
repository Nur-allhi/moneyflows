import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DAYS, MONTHS } from '../constants/dates';
import { useModalStore } from '../stores/useModalStore';
import { useSearchStore } from '../stores/useSearchStore';
import styles from './Header.module.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface HeaderProps {
  title?: string;
  showBack?: boolean;
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
  showBack = false,
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
                {'\u2190'}
              </button>
              <span className={styles.title}>{title}</span>
            </>
          )
        ) : (
          <>
            {showBack && (
              <button onClick={() => navigate(-1)} className={styles.backBtn} aria-label="Back">
                {'\u2190'}
              </button>
            )}
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
              <>
                {showLogo && (
                  <span className={styles.logo}>
                    Money<span className={styles.logoSpan}>Flows</span>
                  </span>
                )}
                {title && <span className={styles.title}>{title}</span>}
              </>
            )}
          </>
        )}
      </div>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M11 11l3.5 3.5" />
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className={styles.searchClear} onClick={() => setQuery('')} aria-label="Clear search">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.right}>
        {showDate && <span className={styles.date}>{formatDate()}</span>}
        <div className={styles.settingsWrap}>
          {(!isMobile || isDashboard) && (
            <button className={`${styles.mobileSearchBtn} ${searchActive ? styles.searchActiveBtn : ''}`} onClick={onSearchToggle} aria-label="Search">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M11 11l3.5 3.5" />
              </svg>
            </button>
          )}
          <button className={styles.mobileSettingsBtn} onClick={() => useModalStore.getState().open('settings')} aria-label="Settings">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="10" cy="6" r="3.5" />
              <path d="M3 18c0-4 3.1-7 7-7s7 3 7 7" />
            </svg>
          </button>
        </div>
        <button className={styles.addBtn} onClick={() => useModalStore.getState().open('transaction-form')} aria-label="New transaction">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className={styles.notifBtn} aria-label="Notifications">
          {'\uD83D\uDD14'}
        </button>
      </div>
    </header>
  );
}
