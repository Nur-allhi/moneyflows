import type { ReactNode } from 'react';
import styles from './AccountCard.module.css';

interface AccountCardProps {
  name: string;
  type: string;
  balance: ReactNode;
  currency?: string;
  gradient: string;
  showChip?: boolean;
  icon?: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function AccountCard({
  name,
  type,
  balance,
  currency,
  gradient,
  showChip = false,
  icon,
  className = '',
  onClick,
  selected = false,
}: AccountCardProps) {
  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''} ${className}`}
      style={{ '--card-bg': gradient } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${name} — ${balance} ${currency ?? ''}`}
    >
      <div className={styles.top}>
        <div>
          <span className={styles.name}>{name}</span>
          <span className={styles.type}>{type}</span>
        </div>
        {showChip && <span className={styles.chip} />}
      </div>
      <div className={styles.balanceRow}>
        <div className={styles.balance}>{balance}</div>
        <div className={styles.label}>Available Balance</div>
      </div>
      {icon && <div className={styles.iconRow}>{icon}</div>}
    </div>
  );
}
