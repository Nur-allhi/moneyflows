import type { ReactNode } from 'react';
import { GlassPanel } from './GlassPanel';
import styles from './MetricCard.module.css';

type AccentColor = 'violet' | 'gold' | 'purple' | 'teal' | 'coral';
type ChangeDirection = 'up' | 'down';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  change?: string;
  changeDirection?: ChangeDirection;
  accent?: AccentColor;
  className?: string;
}

const accentClassMap: Record<AccentColor, string> = {
  violet: styles.accentViolet ?? '',
  gold: styles.accentGold ?? '',
  purple: styles.accentPurple ?? '',
  teal: styles.accentTeal ?? '',
  coral: styles.accentCoral ?? '',
};

export function MetricCard({
  label,
  value,
  change,
  changeDirection,
  accent = 'violet',
  className = '',
}: MetricCardProps) {
  const directionClass = changeDirection === 'up' ? styles.up : changeDirection === 'down' ? styles.down : '';
  const arrow = changeDirection === 'up' ? '\u25B2' : changeDirection === 'down' ? '\u25BC' : '';

  return (
    <GlassPanel glow={accent === 'teal' || accent === 'coral' ? undefined : accent} className={`${styles.card} ${className}`}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${accentClassMap[accent]}`}>{value}</span>
      {change && (
        <span className={`${styles.change} ${directionClass}`}>
          {arrow && <>{arrow} </>}{change}
        </span>
      )}
    </GlassPanel>
  );
}
