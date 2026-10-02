import { useState, type ReactNode } from 'react';
import styles from './SettingsDisclosure.module.css';

interface SettingsDisclosureProps {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Collapsible settings section — hero content visible, details behind toggle.
 * Uses grid 0fr→1fr expand (DESIGN_IDENTITY §5/§12), tokens only.
 */
export function SettingsDisclosure({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: SettingsDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={styles.disclosure}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.titles}>
          <span className={styles.titleRow}>
            <span className={styles.title}>{title}</span>
            {badge && <span className={styles.badge}>{badge}</span>}
          </span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <svg className={open ? styles.chevronOpen : ''} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
        </span>
      </button>
      <div className={`${styles.tray} ${open ? styles.trayOpen : ''}`}>
        <div className={styles.trayInner}>{children}</div>
      </div>
    </section>
  );
}
