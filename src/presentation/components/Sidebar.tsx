import { type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface SidebarProps {
  items: NavItem[];
  footerLabel?: string;
  footerRole?: string;
  className?: string;
  isDashboard?: boolean;
  breadcrumb?: BreadcrumbItem[];
}

export function Sidebar({ items, footerLabel, footerRole, className = '', isDashboard = true, breadcrumb }: SidebarProps) {
  const navigate = useNavigate();
  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <div className={styles.brandSlot}>
        {isDashboard || !breadcrumb ? (
          <span className={styles.logo}>
            Money<span className={styles.logoSpan}>Flows</span>
          </span>
        ) : (
          <div className={styles.breadcrumbRow}>
            <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">
              {'\u2190'}
            </button>
            <div className={styles.breadcrumb}>
              {breadcrumb.map((item, i) => (
                <span key={item.label}>
                  {i > 0 && <span className={styles.sep}>/</span>}
                  {item.path ? <Link to={item.path}>{item.label}</Link> : <span>{item.label}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <nav className={styles.nav}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.itemActive : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      {(footerLabel || footerRole) && (
        <div className={styles.footer}>
          <div className={styles.footerAvatar}>
            {footerLabel?.charAt(0).toUpperCase() ?? 'F'}
          </div>
          <div>
            <div className={styles.footerName}>{footerLabel}</div>
            <div className={styles.footerRole}>{footerRole}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
