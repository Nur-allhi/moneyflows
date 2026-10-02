import type { ReactNode } from 'react';
import { Highlight } from '../utils/highlight';
import { useReplay } from '../hooks/useReplay';
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
  searchQuery?: string;
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
  searchQuery = '',
}: RecycleRowProps) {
  const [restoreKey, replayRestore] = useReplay();
  const [deleteKey, replayDelete] = useReplay();
  return (
    <div className={`${styles.row} ${className}`}>
      <div className={`${styles.icon} ${iconClassMap[iconVariant]}`}>{icon}</div>
      <div className={styles.info}>
        <div className={styles.name}><Highlight text={name} query={searchQuery} /></div>
        <div className={styles.meta}>{meta}</div>
      </div>
      <span className={styles.amount} style={{ '--amount-color': amountColor ?? 'var(--color-text)' } as React.CSSProperties}>{amount}</span>
      <span className={styles.date}>{date}</span>
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.restore} ${restoreKey > 0 ? 'anim-nudge' : ''}`} onClick={() => { replayRestore(); onRestore?.(); }} title="Restore" aria-label="Restore">
          <span className="anim-target" key={restoreKey}>{'\u21A9'}</span>
        </button>
        <button className={`${styles.actionBtn} ${styles.delete} ${deleteKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayDelete(); onDelete?.(); }} title="Delete permanently" aria-label="Delete permanently">
          <span className="anim-target" key={deleteKey}>{'\uD83D\uDDD1\uFE0F'}</span>
        </button>
      </div>
    </div>
  );
}
