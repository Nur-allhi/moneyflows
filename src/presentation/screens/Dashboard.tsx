import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel, MetricCard, AccountRow, TransactionRow, SettingsModal } from '../components';
import { useAnimatedValue } from '../hooks';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { formatAmount } from '../utils/format';
import { shortDate } from '../constants/dates';
import { ACCOUNT_TYPE_ACCENT } from '../constants/labels';
import { DASHBOARD_TX_FETCH_LIMIT, DASHBOARD_TX_DISPLAY_LIMIT } from '../constants/config';
import type { AccountType } from '../../core/domain/Account';
import styles from './Dashboard.module.css';

function txTypeForRow(t: string): 'income' | 'expense' | 'transfer' {
  if (t === 'income' || t === 'loan_repayment') return 'income';
  if (t === 'expense' || t === 'loan_issue') return 'expense';
  return 'transfer';
}

export function Dashboard() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { accounts, loading: acctLoading, error: acctError, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { transactions, loading: txLoading, error: txError, fetchTransactions } = useTransactionStore();
  const { loanStacks, fetchLoanStacks } = useLoanStore();

  useEffect(() => {
    fetchAccounts();
    fetchTransactions({ limit: DASHBOARD_TX_FETCH_LIMIT });
    fetchLoanStacks();
  }, []);

  const loading = acctLoading || txLoading;
  const error = acctError || txError;

  const totalAssets = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts],
  );

  const cashInHand = useMemo(
    () => accounts.filter((a) => a.type === 'cash' || a.type === 'mobile_wallet')
      .reduce((s, a) => s + a.balance, 0),
    [accounts],
  );

  const activeLoans = useMemo(
    () => loanStacks.reduce((s, ls) => s + ls.totalOutstanding, 0),
    [loanStacks],
  );

  const recentTx = useMemo(
    () => transactions.slice(0, DASHBOARD_TX_DISPLAY_LIMIT),
    [transactions],
  );

  const animTotalAssets = useAnimatedValue(totalAssets);
  const animCashInHand = useAnimatedValue(cashInHand);
  const animActiveLoans = useAnimatedValue(activeLoans);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.metrics}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-metric" />
          ))}
        </div>
        <div className={styles.loading}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <GlassPanel padding="lg">
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">Could not load dashboard data</p>
            <button className="retry-btn" onClick={() => fetchAccounts()}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.metrics}>
        <MetricCard label="Total Assets" value={formatAmount(animTotalAssets, locale, currency)} accent="violet" />
        <MetricCard label="Cash in Hand" value={formatAmount(animCashInHand, locale, currency)} accent="gold" />
        <MetricCard label="Active Loans" value={formatAmount(animActiveLoans, locale, currency)} accent="purple" />
        <MetricCard label="Family Net Worth" value={formatAmount(animTotalAssets, locale, currency)} accent="teal" />
      </div>

      <div className={styles.quickActions}>
        <button className={`${styles.qaBtn} ${styles.qaPrimary}`} onClick={() => navigate('/transaction')}>+ New Transaction</button>
        <button className={styles.qaBtn} onClick={() => navigate('/transaction')}>Transfer</button>
        <button className={styles.qaBtn} onClick={() => setSettingsOpen(true)}>Settings</button>
        <button className={styles.qaBtn} onClick={() => (getDatabase() as any).importFromFile()}>Import DB</button>
      </div>

      <div className={styles.content}>
        <GlassPanel padding="none">
          <div className={styles.sectionHeader}>
            <h2>Combined Balances</h2>
            <span className={styles.sectionAction}>View all &rarr;</span>
          </div>
          <div className={styles.accountList}>
            {accounts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">{'\u{1F4B0}'}</div>
                <p className="empty-state-text">No accounts connected yet</p>
              </div>
            ) : (
              accounts.map((acct) => (
                <AccountRow
                  key={acct.id}
                  name={acct.name}
                  type={acct.type}
                  balance={<AnimatedAmount value={acct.balance} />}
                  icon={acct.icon ?? acct.name.slice(0, 2).toUpperCase()}
                  accentColor={ACCOUNT_TYPE_ACCENT[acct.type as AccountType]}
                />
              ))
            )}
          </div>
        </GlassPanel>

        <GlassPanel padding="none">
          <div className={styles.sectionHeader}>
            <h2>Recent Transactions</h2>
            <span className={styles.sectionAction}>View all &rarr;</span>
          </div>
          <div className={styles.txList}>
            {recentTx.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">{'\u{1F4C4}'}</div>
                <p className="empty-state-text">No recent transactions</p>
              </div>
            ) : (
              recentTx.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  description={tx.description}
                  date={shortDate(tx.date, locale)}
                  amount={<AnimatedAmount value={tx.amount} />}
                  type={txTypeForRow(tx.type)}
                />
              ))
            )}
          </div>
        </GlassPanel>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function AnimatedAmount({ value }: { value: number }) {
  const anim = useAnimatedValue(value);
  const { locale, currency } = useSettingsStore((s) => s.settings);
  return formatAmount(anim, locale, currency);
}
