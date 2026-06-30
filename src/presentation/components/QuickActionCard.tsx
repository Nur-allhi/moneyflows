import type { ReactNode } from 'react';
import styles from './QuickActionCard.module.css';

type IconBg = 'violet' | 'teal' | 'coral';

interface QuickActionCardProps {
  icon: ReactNode;
  iconBg?: IconBg;
  title: string;
  subtitle: string;
  className?: string;
  onClick?: () => void;
}

const iconBgClassMap: Record<IconBg, string> = {
  violet: styles.iconViolet ?? '',
  teal: styles.iconTeal ?? '',
  coral: styles.iconCoral ?? '',
};

export function QuickActionCard({
  icon,
  iconBg = 'violet',
  title,
  subtitle,
  className = '',
  onClick,
}: QuickActionCardProps) {
  return (
    <div
      className={`${styles.card} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={`${styles.icon} ${iconBgClassMap[iconBg]}`}>{icon}</div>
      <div className={styles.info}>
        <div className={styles.title}>{title}</div>
        <div className={styles.sub}>{subtitle}</div>
      </div>
    </div>
  );
}
