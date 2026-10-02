import type { LoanStack } from '../../domain/types';
import { formatAmount } from '../../../presentation/utils/format';
import { Highlight } from '../../../presentation/utils/highlight';
import { ledgerGradient } from '../../../presentation/constants/gradients';
import { useReplay } from '../../../presentation/hooks/useReplay';
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
  const [cardKey, replayCard] = useReplay();

  return (
    <button className={`${styles.card} ${cardKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCard(); onClick(); }}>
      <span className="anim-target" key={`${cardKey}-top`}>
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
      </span>
      <span className="anim-target" key={`${cardKey}-meta`}>
      <div className={styles.meta}>
        <span>{stack.activeCount > 0 ? `${stack.activeCount} active` : ''}{stack.settledCount > 0 ? `${stack.activeCount > 0 ? ' \u2022 ' : ''}${stack.settledCount} settled` : ''}{stack.activeCount === 0 && stack.settledCount === 0 ? '0 loans' : ''}</span>
        <span>{stack.activeCount > 0 ? `${stack.progressPercent}% repaid` : '\u2014'}</span>
      </div>
      </span>
    </button>
  );
}
