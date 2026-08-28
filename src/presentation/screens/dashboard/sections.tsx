import { formatAmount } from '../../utils/format';
import styles from '../Dashboard.module.css';
import { ArrowUp, ArrowDown } from './icons';

function MetricValue({ value, color, locale, currency }: { value: number; color: string; locale: string; currency: string }) {
  const finalStr = formatAmount(value, locale, currency);
  return (
    <span className={styles.metricValueWrap} style={{ color }}>
      <span className={styles.metricValueFinal} aria-hidden="true">{finalStr}</span>
      <span className={styles.metricValue} style={{ color }}>{finalStr}</span>
    </span>
  );
}

export function MetricCards({ assetsChange, cashChange, banksChange, loansChange, locale, currency, animTotalAssets, animCashInHand, animTotalInBanks, animActiveLoans, totalAssetsIncludeLoans, animLoansAdded }: {
  assetsChange: number; cashChange: number; banksChange: number; loansChange: number; locale: string; currency: string; animTotalAssets: number; animCashInHand: number; animTotalInBanks: number; animActiveLoans: number; totalAssetsIncludeLoans: boolean; animLoansAdded: number;
}) {
  return (
    <div className={styles.metrics}>
      <div className={`${styles.metricCard} ${styles.glowGold}`}>
        <span className={styles.metricLabel}>Cash in Hand</span>
        <MetricValue value={animCashInHand} color="var(--color-cash)" locale={locale} currency={currency} />
        <span className={`${styles.metricChange} ${cashChange >= 0 ? styles.up : styles.down}`}>{cashChange >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(cashChange).toFixed(1)}% vs last month</span>
      </div>
      <div className={`${styles.metricCard} ${styles.glowCoral}`}>
        <span className={styles.metricLabel}>Total in Banks</span>
        <MetricValue value={animTotalInBanks} color="var(--color-coral)" locale={locale} currency={currency} />
        <span className={`${styles.metricChange} ${banksChange >= 0 ? styles.up : styles.down}`}>{banksChange >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(banksChange).toFixed(1)}% vs last month</span>
      </div>
      <div className={`${styles.metricCard} ${styles.glowCoral}`}>
        <span className={styles.metricLabel}>Active Loans</span>
        <MetricValue value={animActiveLoans} color="var(--color-coral)" locale={locale} currency={currency} />
        <span className={`${styles.metricChange} ${loansChange >= 0 ? styles.up : styles.down}`}>{loansChange >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(loansChange).toFixed(1)}% vs last month</span>
      </div>
      <div className={`${styles.metricCard} ${styles.glowViolet}`}>
        <span className={styles.metricLabel}>Total Assets</span>
        <MetricValue value={animTotalAssets} color="var(--color-primary)" locale={locale} currency={currency} />
        {totalAssetsIncludeLoans && animLoansAdded > 0 && (
          <span className={styles.metricSubtitle}>+ Active Loans {formatAmount(animLoansAdded, locale, currency)}</span>
        )}
        <span className={`${styles.metricChange} ${assetsChange >= 0 ? styles.up : styles.down}`}>{assetsChange >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(assetsChange).toFixed(1)}% vs last month</span>
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
