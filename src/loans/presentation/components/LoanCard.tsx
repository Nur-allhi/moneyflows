import type { LoanStack } from '../../domain/types';
import { formatAmount } from '../../../presentation/utils/format';
import styles from './LoanCard.module.css';

interface LoanCardProps {
  stack: LoanStack;
  locale: string;
  currency: string;
  onClick: () => void;
}

export function LoanCard({ stack, locale, currency, onClick }: LoanCardProps) {
  const stackType = stack.stackType === 'internal' ? 'Internal' : stack.stackType === 'external' ? 'Debtor' : 'Debtor';
  const initial = stack.debtorName.charAt(0).toUpperCase();

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <div className={styles.avatar}>{initial}</div>
        <div className={styles.info}>
          <span className={styles.name}>{stack.debtorName}</span>
          <span className={styles.badge}>{stackType}</span>
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
