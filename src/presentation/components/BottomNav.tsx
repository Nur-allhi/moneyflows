import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
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

export function BottomNav({ items, className = '' }: BottomNavProps) {
  return (
    <nav className={`${styles.nav} ${className}`}>
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
  );
}
