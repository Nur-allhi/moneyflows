import { Link, useNavigate } from 'react-router-dom';
import { DAYS, MONTHS } from '../constants/dates';
import { useModalStore } from '../stores/useModalStore';
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
}: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.left}>
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
      </div>
      <div className={styles.right}>
        {showDate && <span className={styles.date}>{formatDate()}</span>}
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
