import styles from './TransactionRow.module.css';

type TransactionType = 'income' | 'expense' | 'transfer';

interface TransactionRowProps {
  description: string;
  date: string;
  amount: string;
  type: TransactionType;
  icon?: string;
  className?: string;
  onClick?: () => void;
}

const typeIconMap: Record<TransactionType, string> = {
  expense: '\u{1F4B8}',
  income: '\u{1F4B5}',
  transfer: '\u{1F91D}',
};

const typeIconClassMap: Record<TransactionType, string> = {
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
        {icon ?? typeIconMap[type]}
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
