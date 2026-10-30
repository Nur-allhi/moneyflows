import { formatAmount } from '../../utils/format';
import styles from '../Dashboard.module.css';
import { ArrowUp, ArrowDown } from './icons';
import type { MetricTrend } from './metricTrend';

function MetricValue({ value, color, locale, currency }: { value: number; color: string; locale: string; currency: string }) {
  const finalStr = formatAmount(value, locale, currency);
  return (
    <span className={styles.metricValueWrap} style={{ color }}>
      <span className={styles.metricValueFinal} aria-hidden="true">{finalStr}</span>
      <span className={styles.metricValue} style={{ color }}>{finalStr}</span>
    </span>
  );
}

/**
 * One "vs last month" line for every card (BUG-21). The wording is shared
 * because the definition now is: each card against its own value at the end of
 * last month. When a percentage of that baseline would be meaningless (a base of
 * zero or less), the change is shown in currency instead of a nonsense figure.
 */
function TrendLine({ trend, locale, currency }: { trend: MetricTrend; locale: string; currency: string }) {
  const up = trend.delta >= 0;
  const text = trend.percent === null
    ? `${formatAmount(Math.abs(trend.delta), locale, currency)} vs last month`
    : `${Math.abs(trend.percent).toFixed(1)}% vs last month`;
  return (
    <span className={`${styles.metricChange} ${up ? styles.up : styles.down}`}>
      {up ? <ArrowUp /> : <ArrowDown />}{text}
    </span>
  );
}

export function MetricCards({ cashTrend, banksTrend, loansTrend, assetsTrend, locale, currency, animTotalAssets, animCashInHand, animTotalInBanks, animActiveLoans, totalAssetsIncludeLoans, animLoansAdded }: {
  cashTrend: MetricTrend; banksTrend: MetricTrend; loansTrend: MetricTrend; assetsTrend: MetricTrend; locale: string; currency: string; animTotalAssets: number; animCashInHand: number; animTotalInBanks: number; animActiveLoans: number; totalAssetsIncludeLoans: boolean; animLoansAdded: number;
}) {
  return (
    <div className={styles.metrics}>
      <div className={`${styles.metricCard} ${styles.glowGold}`}>
        <span className={styles.metricLabel}>Cash in Hand</span>
        <MetricValue value={animCashInHand} color="var(--color-cash)" locale={locale} currency={currency} />
        <TrendLine trend={cashTrend} locale={locale} currency={currency} />
      </div>
      <div className={`${styles.metricCard} ${styles.glowCoral}`}>
        <span className={styles.metricLabel}>Total in Banks</span>
        <MetricValue value={animTotalInBanks} color="var(--color-coral)" locale={locale} currency={currency} />
        <TrendLine trend={banksTrend} locale={locale} currency={currency} />
      </div>
      <div className={`${styles.metricCard} ${styles.glowCoral}`}>
        <span className={styles.metricLabel}>Active Loans</span>
        <MetricValue value={animActiveLoans} color="var(--color-coral)" locale={locale} currency={currency} />
        <TrendLine trend={loansTrend} locale={locale} currency={currency} />
      </div>
      <div className={`${styles.metricCard} ${styles.glowViolet}`}>
        <span className={styles.metricLabel}>Total Assets</span>
        <MetricValue value={animTotalAssets} color="var(--color-primary)" locale={locale} currency={currency} />
        {totalAssetsIncludeLoans && animLoansAdded > 0 && (
          <span className={styles.metricSubtitle}>+ Active Loans {formatAmount(animLoansAdded, locale, currency)}</span>
        )}
        <TrendLine trend={assetsTrend} locale={locale} currency={currency} />
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
