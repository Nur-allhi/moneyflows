import styles from './LedgerTable.module.css';

export interface LedgerRow {
  date: string;
  description: string;
  debit?: string;
  credit?: string;
  balance: string;
  type?: 'income' | 'expense' | 'transfer';
}

interface LedgerTableProps {
  rows: LedgerRow[];
  className?: string;
  onRowClick?: (row: LedgerRow, index: number) => void;
  desktop?: boolean;
}

const tagClassMap: Record<string, string | undefined> = {
  expense: styles.tagExpense,
  income: styles.tagIncome,
  transfer: styles.tagTransfer,
};

export function LedgerTable({ rows, className = '', onRowClick, desktop = false }: LedgerTableProps) {
  const containerClass = `${styles.container} ${desktop ? styles.desktop : ''} ${className}`;
  return (
    <div className={containerClass}>
      <div className={styles.header}>
        <span>Date</span>
        <span>Description</span>
        <span>Debit</span>
        <span>Credit</span>
        <span style={{ textAlign: 'right' }}>Balance</span>
      </div>
      <div className={styles.body}>
        {rows.length === 0 && (
          <div className={styles.empty}>No entries found</div>
        )}
        {rows.map((row, i) => (
          <div
            key={`${row.date}-${row.description}-${i}`}
            className={styles.row}
            onClick={() => onRowClick?.(row, i)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
          >
            <span className={styles.date}>{row.date}</span>
            <span className={styles.desc}>
              {row.description}
              {row.type && desktop && (
                <span className={`${styles.tag} ${tagClassMap[row.type] ?? ''}`}>
                  {row.type}
                </span>
              )}
            </span>
            <span className={styles.debit}>{row.debit ?? '\u2014'}</span>
            <span className={styles.credit}>{row.credit ?? '\u2014'}</span>
            <span className={styles.balance}>{row.balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
