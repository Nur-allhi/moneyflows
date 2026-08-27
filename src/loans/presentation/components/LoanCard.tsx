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

function ledgerGradient(name: string): string {
  const hues = [290, 170, 30, 85, 220, 330, 50, 190];
  let idx = 0;
  for (let i = 0; i < name.length; i++) idx = (idx * 31 + name.charCodeAt(i)) % hues.length;
  const h = hues[idx]!;
  return `linear-gradient(135deg, oklch(62% 0.22 ${h}), oklch(50% 0.2 ${h}))`;
}

export function LoanCard({ stack, locale, currency, onClick, searchQuery = '' }: LoanCardProps) {
  const stackType = stack.stackType === 'internal' ? 'Internal' : stack.stackType === 'external' ? 'Debtor' : 'Debtor';
  const initial = stack.debtorName.charAt(0).toUpperCase();

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <div className={styles.leftGroup}>
          <div className={styles.avatar} style={{ background: ledgerGradient(stack.debtorName) }}>{initial}</div>
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
