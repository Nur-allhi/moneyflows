import type { CSSProperties, ReactNode } from 'react';
import styles from './AccountRow.module.css';

type AccountType = 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'business';

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

const accountGradients: Record<string, string> = {
  bank: 'linear-gradient(135deg, #1a237e, #283593)',
  savings: 'linear-gradient(135deg, #004d40, #00695c)',
  mobile_wallet: 'linear-gradient(135deg, #d81b60, #e91e63)',
  cash: 'linear-gradient(135deg, #37474f, #455a64)',
  business: 'linear-gradient(135deg, #263238, #37474f)',
};

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
  const bgGradient = gradient ?? accountGradients[type] ?? accountGradients.bank;

  return (
    <div
      className={`${styles.row} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && (
        <div className={styles.icon} style={{ background: bgGradient as CSSProperties['background'] }}>
          {icon}
        </div>
      )}
      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        <div className={styles.sub}>{type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
      </div>
      <div className={styles.balance} style={{ color: accentColor ?? 'var(--color-text)' }}>
        {balance}
      </div>
    </div>
  );
}
