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
  const toggleSidebar = () => { setPeeking(false); updateSettings({ sidebarCollapsed: !collapsedPref }); };
  const toggleLabel = folded ? 'Expand sidebar' : 'Collapse sidebar';
  const chev = (flipped: boolean) => (
    <svg className={flipped ? styles.chevFlipped : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
  return (
    <aside
      className={`${styles.sidebar} ${folded ? styles.collapsed : ''} ${peeking ? styles.peek : ''} ${className}`}
      onMouseEnter={() => { if (collapsedPref) setPeeking(true); }}
      onMouseLeave={() => setPeeking(false)}
    >
      <div className={styles.brandSlot}>
        <div className={`${styles.face} ${styles.faceOpen} ${folded ? styles.faceHidden : ''}`} aria-hidden={folded}>
          <span className={styles.logo}>
            Money<span className={styles.logoSpan}>Flows</span>
          </span>
          <button className={styles.toggleBtn} onClick={toggleSidebar} aria-label={toggleLabel} title={toggleLabel} tabIndex={folded ? -1 : 0}>
            {chev(false)}
          </button>
        </div>
        <div className={`${styles.face} ${styles.faceShut} ${folded ? '' : styles.faceHidden}`} aria-hidden={!folded}>
          <span className={styles.miniMark} aria-hidden="true">M</span>
          <button className={styles.toggleBtn} onClick={toggleSidebar} aria-label={toggleLabel} title={toggleLabel} tabIndex={folded ? 0 : -1}>
            {chev(true)}
          </button>
        </div>
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
