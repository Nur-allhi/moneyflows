import { useRef, useState, useCallback, useMemo } from 'react';
import { ROW_HEIGHT, DESKTOP_ROW_HEIGHT, OVERSCAN } from '../constants/config';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerClass = `${styles.container} ${desktop ? styles.desktop : ''} ${className}`;
  const itemHeight = desktop ? DESKTOP_ROW_HEIGHT : ROW_HEIGHT;
  const containerHeight = desktop ? 360 : 340;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * OVERSCAN;
    const end = Math.min(rows.length, start + visibleCount);
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, rows.length]);

  const totalHeight = rows.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div className={containerClass}>
      <div className={styles.header}>
        <span>Date</span>
        <span>Description</span>
        <span>Debit</span>
        <span>Credit</span>
        <span className={styles.balanceLabel}>Balance</span>
      </div>
      <div
        ref={containerRef}
        className={styles.body}
        style={{ '--body-max-height': rows.length === 0 ? 'auto' : `${containerHeight}px` } as React.CSSProperties}
        onScroll={rows.length > 0 ? handleScroll : undefined}
      >
        {rows.length === 0 ? (
          <div className={styles.empty}>No entries found</div>
        ) : (
          <div className={styles.virtualContainer} style={{ '--total-height': `${totalHeight}px` } as React.CSSProperties}>
            {rows.slice(visibleRange.start, visibleRange.end).map((row, i) => {
              const actualIndex = visibleRange.start + i;
              return (
                <div
                  key={`${row.date}-${row.description}-${actualIndex}`}
                  className={`${styles.row} ${styles.virtualRow}`} style={{ '--row-top': `${offsetY + i * itemHeight}px`, '--row-height': `${itemHeight}px` } as React.CSSProperties}
                  onClick={() => onRowClick?.(row, actualIndex)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
