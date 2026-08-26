import type { LoanStack } from '../../domain/types';
import { formatAmount } from '../../../presentation/utils/format';
import { Highlight } from '../../../presentation/utils/highlight';
import styles from './LoanCard.module.css';

interface LoanCardProps {
  stack: LoanStack;
  locale: string;
  currency: string;
  onClick: () => void;
  searchQuery?: string;
}

export function LoanCard({ stack, locale, currency, onClick, searchQuery = '' }: LoanCardProps) {
  const stackType = stack.stackType === 'internal' ? 'Internal' : stack.stackType === 'external' ? 'Debtor' : 'Debtor';
  const initial = stack.debtorName.charAt(0).toUpperCase();

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <div className={styles.leftGroup}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.info}>
            <span className={styles.name}><Highlight text={stack.debtorName} query={searchQuery} /></span>
            <span className={styles.badge}>{stackType}</span>
          </div>
        </div>
        <span className={styles.amount}>{formatAmount(stack.totalOutstanding, locale, currency)}</span>
      </div>
      <div className={styles.meta}>
        <span>{stack.activeCount > 0 ? `${stack.activeCount} active` : ''}{stack.settledCount > 0 ? `${stack.activeCount > 0 ? ' \u2022 ' : ''}${stack.settledCount} settled` : ''}{stack.activeCount === 0 && stack.settledCount === 0 ? '0 loans' : ''}</span>
        <span>{stack.activeCount > 0 ? `${stack.progressPercent}% repaid` : '\u2014'}</span>
      </div>
    </button>
  );
}
