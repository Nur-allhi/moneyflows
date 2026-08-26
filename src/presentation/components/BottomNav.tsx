import { type ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BottomSheet } from './BottomSheet';
import styles from './BottomNav.module.css';

interface BottomNavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

const others: BottomNavItem[] = [
  { path: '/tags', label: 'Tags', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" /></svg> },
  { path: '/recycle', label: 'Recycle Bin', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> },
  { path: '/settings', label: 'Settings', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
];

export function BottomNav({ items, className = '' }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const main = document.getElementById('app-main') as HTMLElement | null;
    if (!main) return;
    let lastY = main.scrollTop;
    const onScroll = () => {
      const y = main.scrollTop;
      setScrolled(y > 10);
      if (moreOpen) {
        lastY = y;
        return;
      }
      // Long scroll: hide on down beyond 80, show on up
      if (y > 80 && y > lastY + 6) setHidden(true);
      else if (y < lastY - 6 || y < 80) setHidden(false);
      lastY = y;
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [moreOpen]);

  // Expect items = Members, Groups, Home, Loans — Home is popped, More is 5th
  const homeItem = items.find((it) => it.path === '/');
  const otherPrimary = items.filter((it) => it.path !== '/');

  // Split otherPrimary into left 2 and right 2 for Home center
  const left = otherPrimary.slice(0, 2);
  const right = otherPrimary.slice(2);

  return (
    <>
      <nav className={`${styles.nav} ${hidden ? styles.navHidden : ''} ${className}`}>
        {left.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `${styles.item} ${isActive ? styles.itemActive : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {homeItem && (
          <NavLink
            to={homeItem.path}
            end
            className={({ isActive }) =>
              `${styles.homePopped} ${scrolled ? styles.homePoppedScrolled : ''} ${isActive ? styles.homeActive : ''}`
            }
            aria-label="Home"
          >
            <span className={styles.homeIcon}>{homeItem.icon}</span>
          </NavLink>
        )}

        {right.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `${styles.item} ${isActive ? styles.itemActive : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <button className={styles.item} onClick={() => setMoreOpen(true)} aria-label="More">
          <span className={styles.icon}><MoreIcon /></span>
          More
        </button>
      </nav>

      <BottomSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className={styles.moreGrid}>
          {others.map((item) => (
            <button
              key={item.path}
              className={styles.moreBlock}
              onClick={() => { setMoreOpen(false); navigate(item.path); }}
            >
              <span className={styles.moreIcon}>{item.icon}</span>
              <span className={styles.moreLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
