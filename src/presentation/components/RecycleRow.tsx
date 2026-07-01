import type { ReactNode } from 'react';
import styles from './RecycleRow.module.css';

type IconVariant = 'warning' | 'account';

interface RecycleRowProps {
  icon: ReactNode;
  iconVariant?: IconVariant;
  name: string;
  meta: string;
  amount: string;
  amountColor?: string;
  date: string;
  onRestore?: () => void;
  onDelete?: () => void;
  className?: string;
}

const iconClassMap: Record<IconVariant, string> = {
  warning: styles.iconWarning ?? '',
  account: styles.iconAccount ?? '',
};

export function RecycleRow({
  icon,
  iconVariant = 'warning',
  name,
  meta,
  amount,
  amountColor,
  date,
  onRestore,
  onDelete,
  className = '',
}: RecycleRowProps) {
  return (
    <div className={`${styles.row} ${className}`}>
      <div className={`${styles.icon} ${iconClassMap[iconVariant]}`}>{icon}</div>
      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        <div className={styles.meta}>{meta}</div>
      </div>
      <span className={styles.amount} style={{ '--amount-color': amountColor ?? 'var(--color-text)' } as React.CSSProperties}>{amount}</span>
      <span className={styles.date}>{date}</span>
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.restore}`} onClick={onRestore} title="Restore" aria-label="Restore">
          {'\u21A9'}
        </button>
        <button className={`${styles.actionBtn} ${styles.delete}`} onClick={onDelete} title="Delete permanently" aria-label="Delete permanently">
          {'\uD83D\uDDD1\uFE0F'}
        </button>
      </div>
    </div>
  );
}
