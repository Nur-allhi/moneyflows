import type { ReactNode } from 'react';
import { ACCOUNT_TYPE_GRADIENT, displayType } from '../constants/labels';
import type { AccountType } from '../../core/domain/Account';
import styles from './AccountRow.module.css';

interface AccountRowProps {
  name: string;
  type: AccountType | string;
  balance: ReactNode;
  gradient?: string;
  accentColor?: string;
  icon?: string;
  className?: string;
  onClick?: () => void;
}

export function AccountRow({
  name,
  type,
  balance,
  gradient,
  accentColor,
  icon,
  className = '',
  onClick,
}: AccountRowProps) {
  const bgGradient = gradient ?? ACCOUNT_TYPE_GRADIENT[type as AccountType] ?? ACCOUNT_TYPE_GRADIENT.bank;

  return (
    <div
      className={`${styles.row} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && (
        <div className={styles.icon} style={{ '--icon-bg': bgGradient } as React.CSSProperties}>
          {icon}
        </div>
      )}
      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        <div className={styles.sub}>{displayType(type)}</div>
      </div>
      <div className={styles.balance} style={{ '--accent': accentColor ?? 'var(--color-text)' } as React.CSSProperties}>
        {balance}
      </div>
    </div>
  );
}
