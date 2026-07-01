import type { ReactNode } from 'react';
import { TX_TYPE_ICON } from '../constants/labels';
import styles from './TransactionRow.module.css';

type DisplayType = 'income' | 'expense' | 'transfer';

interface TransactionRowProps {
  description: string;
  date: string;
  amount: ReactNode;
  type: DisplayType;
  icon?: string;
  className?: string;
  onClick?: () => void;
}

const typeIconClassMap: Record<DisplayType, string> = {
  expense: styles.iconExpense ?? '',
  income: styles.iconIncome ?? '',
  transfer: styles.iconTransfer ?? '',
};

export function TransactionRow({
  description,
  date,
  amount,
  type,
  icon,
  className = '',
  onClick,
}: TransactionRowProps) {
  const isCredit = type === 'income';

  return (
    <div
      className={`${styles.row} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={`${styles.icon} ${typeIconClassMap[type]}`}>
        {icon ?? TX_TYPE_ICON[type]}
      </div>
      <div className={styles.info}>
        <div className={styles.description}>{description}</div>
        <div className={styles.date}>{date}</div>
      </div>
      <span className={`${styles.amount} ${isCredit ? styles.credit : styles.debit}`}>
        {isCredit ? '+' : '-'}{amount}
      </span>
    </div>
  );
}
