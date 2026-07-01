import { Link } from 'react-router-dom';
import { DAYS, MONTHS } from '../constants/dates';
import styles from './Header.module.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
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
  backTo = '/',
  showLogo = true,
  showDate = true,
  breadcrumb,
  className = '',
}: HeaderProps) {
  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.left}>
        {showBack && (
          <Link to={backTo} className={styles.backBtn} aria-label="Back">
            {'\u2190'}
          </Link>
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
        <button className={styles.notifBtn} aria-label="Notifications">
          {'\uD83D\uDD14'}
        </button>
      </div>
    </header>
  );
}
