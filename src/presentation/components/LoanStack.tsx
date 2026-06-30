import { useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './LoanStack.module.css';

export interface LoanStackLoan {
  description: string;
  date: string;
  amount: string;
  remaining: string;
  remainingColor?: string;
  status: 'active' | 'on_track';
}

export interface LoanStackData {
  icon: string;
  iconGradient: string;
  fundSource: string;
  sourceMeta: string;
  totalAmount: string;
  totalColor?: string;
  loanCount: number;
  loans: LoanStackLoan[];
}

interface LoanStackProps {
  stacks: LoanStackData[];
  className?: string;
}

export function LoanStack({ stacks, className = '' }: LoanStackProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const statusClassMap: Record<string, string> = {
    active: styles.statusActive ?? '',
    on_track: styles.statusOnTrack ?? '',
  };

  return (
    <div className={`${styles.stacks ?? ''} ${className}`}>
      {stacks.map((stack, i) => {
        const isExpanded = expandedIndex === i;
        return (
          <div
            key={`${stack.fundSource}-${i}`}
            className={`${styles.stack ?? ''} ${isExpanded ? styles.expanded : ''}`}
          >
            <div
              className={styles.header}
              onClick={() => handleToggle(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(i); }}
              aria-expanded={isExpanded}
            >
              <div className={styles.headerLeft}>
                <div className={styles.icon} style={{ background: stack.iconGradient as CSSProperties['background'] }}>
                  {stack.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.fundSource}>{stack.fundSource}</div>
                  <div className={styles.meta}>{stack.sourceMeta}</div>
                </div>
              </div>
              <div className={styles.headerRight}>
                <div className={styles.total} style={{ color: stack.totalColor ?? 'var(--color-text)' }}>
                  {stack.totalAmount}
                </div>
                <div className={styles.loanCount}>{stack.loanCount} {stack.loanCount === 1 ? 'loan' : 'loans'}</div>
              </div>
              <span className={styles.chevron}>{'\u25BC'}</span>
            </div>
            {isExpanded && (
              <div className={styles.body}>
                <div className={styles.loanHeader}>
                  <span />
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Remaining</span>
                  <span>Status</span>
                </div>
                {stack.loans.map((loan, j) => (
                  <div key={`${loan.description}-${j}`} className={styles.loanRow}>
                    <span className={styles.loanDesc}>{loan.description}</span>
                    <span className={styles.loanDate}>{loan.date}</span>
                    <span className={styles.loanAmount}>{loan.amount}</span>
                    <span className={styles.loanAmount} style={{ color: loan.remainingColor ?? 'var(--color-text)' }}>
                      {loan.remaining}
                    </span>
                    <span className={`${styles.loanStatus} ${statusClassMap[loan.status] ?? ''}`}>
                      {loan.status === 'on_track' ? 'On Track' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
