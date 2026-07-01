import type { ReactNode } from 'react';
import styles from './AccountCard.module.css';

interface AccountCardProps {
  name: string;
  type: string;
  balance: ReactNode;
  currency?: string;
  accountNumber?: string;
  gradient: string;
  showChip?: boolean;
  icon?: string;
  className?: string;
  onClick?: () => void;
}

export function AccountCard({
  name,
  type,
  balance,
  currency,
  accountNumber,
  gradient,
  showChip = false,
  icon,
  className = '',
  onClick,
}: AccountCardProps) {
  return (
    <div
      className={`${styles.card} ${className}`}
      style={{ '--card-bg': gradient } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${name} — ${balance} ${currency ?? ''}`}
    >
      <div className={styles.top}>
        <span className={styles.type}>{type}</span>
        {showChip && <span className={styles.chip} />}
      </div>
      <div>
        <div className={styles.balance}>{balance}</div>
        <div className={styles.label}>Available Balance</div>
      </div>
      <div className={styles.bottom}>
        <span className={styles.number}>
          {accountNumber ? `•••• ${accountNumber}` : '•••• ••••'}
        </span>
        {icon && <span className={styles.cardIcon}>{icon}</span>}
      </div>
    </div>
  );
}
