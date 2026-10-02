import { type ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  footerLabel?: string;
  footerRole?: string;
  className?: string;
}

export function Sidebar({ items, footerLabel, footerRole, className = '' }: SidebarProps) {
  const collapsedPref = useSettingsStore((s) => s.settings.sidebarCollapsed ?? false);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [peeking, setPeeking] = useState(false);
  const folded = collapsedPref && !peeking;
  return (
    <aside
      className={`${styles.sidebar} ${folded ? styles.collapsed : ''} ${peeking ? styles.peek : ''} ${className}`}
      onMouseEnter={() => { if (collapsedPref) setPeeking(true); }}
      onMouseLeave={() => setPeeking(false)}
    >
      <button
        className={styles.toggleBtn}
        onClick={() => { setPeeking(false); updateSettings({ sidebarCollapsed: !collapsedPref }); }}
        aria-label={collapsedPref ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsedPref ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg className={collapsedPref ? styles.chevFlipped : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className={styles.brandSlot}>
        <span className={styles.logo}>
          Money<span className={styles.logoSpan}>Flows</span>
        </span>
        <span className={styles.miniMark} aria-hidden="true">M</span>
      </div>
      <nav className={styles.nav}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={item.label}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.itemActive : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {(footerLabel || footerRole) && (
        <div className={styles.footer}>
          <div className={styles.footerAvatar}>
            {footerLabel?.charAt(0).toUpperCase() ?? 'F'}
          </div>
          <div className={styles.footerText}>
            <div className={styles.footerName}>{footerLabel}</div>
            <div className={styles.footerRole}>{footerRole}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
