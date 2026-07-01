import { useRef, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { ROW_HEIGHT, DESKTOP_ROW_HEIGHT, OVERSCAN, ANIMATION_DURATION } from '../constants/config';
import styles from './LedgerTable.module.css';

export interface LedgerRow {
  id?: string;
  date: string;
  description: string;
  account?: string;
  debit?: string;
  credit?: string;
  balance?: string;
  type?: 'income' | 'expense' | 'transfer' | 'loan';
  typeLabel?: string;
}

interface LedgerTableProps {
  rows: LedgerRow[];
  className?: string;
  onRowClick?: (row: LedgerRow, index: number) => void;
  desktop?: boolean;
  showBalance?: boolean;
  fillHeight?: boolean;
  sentinel?: React.ReactNode;
}

const typeClassMap: Record<string, string | undefined> = {
  expense: styles.expense,
  income: styles.income,
  transfer: styles.transfer,
};

export function LedgerTable({ rows, className = '', onRowClick, desktop = false, showBalance = true, fillHeight = false, sentinel }: LedgerTableProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(desktop ? 360 : 340);
  const [animMaxH, setAnimMaxH] = useState<number | null>(null);
  const prevRowsLenRef = useRef(rows.length);
  const capturedHeightRef = useRef(0);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerClass = `${styles.container} ${desktop ? styles.desktop : ''} ${showBalance ? '' : styles.noBalance} ${fillHeight ? styles.fillHeight : ''} ${className}`;
  const itemHeight = desktop ? DESKTOP_ROW_HEIGHT : ROW_HEIGHT;
  const containerHeight = fillHeight ? bodyHeight : (desktop ? 360 : 340);

  useLayoutEffect(() => {
    if (!fillHeight) return;
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      if (entries[0]) setBodyHeight(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fillHeight]);

  if (!fillHeight && bodyRef.current && rows.length !== prevRowsLenRef.current) {
    capturedHeightRef.current = bodyRef.current.scrollHeight;
  }
  prevRowsLenRef.current = rows.length;

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (fillHeight || !el) return;
    const oldH = capturedHeightRef.current;
    const newH = el.scrollHeight;
    if (!oldH || oldH === newH) return;
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setAnimMaxH(oldH);
    requestAnimationFrame(() => { setAnimMaxH(newH); });
    animTimerRef.current = setTimeout(() => { setAnimMaxH(null); animTimerRef.current = null; }, ANIMATION_DURATION);
    return () => { if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; } };
  }, [rows.length, fillHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    if (!fillHeight) return { start: 0, end: rows.length };
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * OVERSCAN;
    const end = Math.min(rows.length, start + visibleCount);
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, rows.length, fillHeight]);

  const totalHeight = rows.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div className={containerClass}>
      <div className={styles.header}>
        <span className={styles.centerLabel}>Date</span>
        <span className={styles.centerLabel}>Type</span>
        <span>Description</span>
        {!showBalance && <span className={styles.centerLabel}>Account</span>}
        <span className={styles.centerLabel}>Debit</span>
        <span className={styles.centerLabel}>Credit</span>
        {showBalance && <span className={styles.centerLabel}>Balance</span>}
      </div>
      <div
        ref={bodyRef}
        className={styles.body}
        style={
          fillHeight
            ? { '--body-max-height': '1fr' } as React.CSSProperties
            : animMaxH !== null
              ? { maxHeight: animMaxH, overflow: 'hidden', transition: 'max-height 0.35s ease' } as React.CSSProperties
              : undefined
        }
        onScroll={fillHeight && rows.length > 0 ? handleScroll : undefined}
      >
        {rows.length === 0 ? (
          <div className={styles.empty}>No entries found</div>
        ) : fillHeight ? (
          <>
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
                    <span className={`${styles.typeCell} ${row.type ? (typeClassMap[row.type] ?? '') : ''}`}>
                      {row.typeLabel ?? row.type ?? '\u2014'}
                    </span>
                    <span className={styles.desc}>{row.description}</span>
                    {!showBalance && <span className={styles.account}>{row.account ?? '\u2014'}</span>}
                    <span className={styles.debit}>{row.debit ?? '\u2014'}</span>
                    <span className={styles.credit}>{row.credit ?? '\u2014'}</span>
                    {showBalance && <span className={styles.balance}>{row.balance ?? '\u2014'}</span>}
                  </div>
                );
              })}
            </div>
            {sentinel}
          </>
        ) : (
          <>
            {rows.map((row, i) => (
              <div
                key={`${row.date}-${row.description}-${i}`}
                className={styles.row}
                onClick={() => onRowClick?.(row, i)}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                <span className={styles.date}>{row.date}</span>
                <span className={`${styles.typeCell} ${row.type ? (typeClassMap[row.type] ?? '') : ''}`}>
                  {row.typeLabel ?? row.type ?? '\u2014'}
                </span>
                <span className={styles.desc}>{row.description}</span>
                {!showBalance && <span className={styles.account}>{row.account ?? '\u2014'}</span>}
                <span className={styles.debit}>{row.debit ?? '\u2014'}</span>
                <span className={styles.credit}>{row.credit ?? '\u2014'}</span>
                {showBalance && <span className={styles.balance}>{row.balance ?? '\u2014'}</span>}
              </div>
            ))}
            {sentinel}
          </>
        )}
      </div>
    </div>
  );
}