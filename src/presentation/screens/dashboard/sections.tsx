import { formatAmount } from '../../utils/format';
import styles from '../Dashboard.module.css';
import { ArrowUp, ArrowDown } from './icons';

export function MetricCards({ assetsChange, cashChange, loanChange, locale, currency, animTotalAssets, animCashInHand, animActiveLoans }: {
  assetsChange: number; cashChange: number; loanChange: number; locale: string; currency: string; animTotalAssets: number; animCashInHand: number; animActiveLoans: number;
}) {
  return (
    <div className={styles.metrics}>
      <div className={`${styles.metricCard} ${styles.glowViolet}`}>
        <span className={styles.metricLabel}>Total Assets</span>
        <span className={styles.metricValue} style={{ color: 'var(--color-primary)' }}>{formatAmount(animTotalAssets, locale, currency)}</span>
        <span className={`${styles.metricChange} ${assetsChange >= 0 ? styles.up : styles.down}`}>{assetsChange >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(assetsChange).toFixed(1)}% vs last month</span>
      </div>
      <div className={`${styles.metricCard} ${styles.glowGold}`}>
        <span className={styles.metricLabel}>Cash in Hand</span>
        <span className={styles.metricValue} style={{ color: 'var(--color-cash)' }}>{formatAmount(animCashInHand, locale, currency)}</span>
        <span className={`${styles.metricChange} ${cashChange >= 0 ? styles.up : styles.down}`}>{cashChange >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(cashChange).toFixed(1)}% vs last month</span>
      </div>
      <div className={`${styles.metricCard} ${styles.glowCoral}`}>
        <span className={styles.metricLabel}>Active Loans</span>
        <span className={styles.metricValue} style={{ color: 'var(--color-coral)' }}>{formatAmount(animActiveLoans, locale, currency)}</span>
        <span className={`${styles.metricChange} ${loanChange >= 0 ? styles.up : styles.down}`}>{loanChange >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(loanChange).toFixed(1)}% vs last month</span>
      </div>
    </div>
  );
}
export function MonthSummary({ thisMonthIncome, thisMonthExpenses, thisMonthNet, locale, currency }: { thisMonthIncome: number; thisMonthExpenses: number; thisMonthNet: number; locale: string; currency: string }) {
  return (
    <>
      <div className={styles.monthSummary}>
        <div className={styles.monthStat}><span className={styles.monthStatLabel}>Income</span><span className={styles.monthStatValue} style={{ color: 'var(--color-teal)' }}>{formatAmount(thisMonthIncome, locale, currency)}</span></div>
        <div className={styles.flowDivider} />
        <div className={styles.monthStat}><span className={styles.monthStatLabel}>Expenses</span><span className={styles.monthStatValue} style={{ color: 'var(--color-coral)' }}>{formatAmount(thisMonthExpenses, locale, currency)}</span></div>
        <div className={styles.monthStat}><span className={styles.monthStatLabel}>Net</span><span className={styles.monthStatValue} style={{ color: thisMonthNet >= 0 ? 'var(--color-teal)' : 'var(--color-coral)' }}>{thisMonthNet >= 0 ? '+' : ''}{formatAmount(thisMonthNet, locale, currency)}</span></div>
      </div>
      <div className={styles.flowNet}>{'\u2197'} Net {thisMonthNet >= 0 ? '+' : ''}{formatAmount(thisMonthNet, locale, currency)} this month</div>
    </>
  );
}
