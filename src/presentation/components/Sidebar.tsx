import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  footerLabel?: string;
  footerRole?: string;
  className?: string;
}

export function Sidebar({ items, footerLabel, footerRole, className = '' }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${className}`}>
      <div className={styles.logo}>
        Money<span className={styles.logoAccent}>Flows</span>
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
