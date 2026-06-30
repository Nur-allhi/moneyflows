import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel, MetricCard, AccountRow, TransactionRow } from '../components';
import { useAnimatedValue } from '../hooks';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import styles from './Dashboard.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const _fmt = Intl.NumberFormat('en-IN');

function fmt(n: number): string {
  return `${_fmt.format(n)} BDT`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function txTypeForRow(t: string): 'income' | 'expense' | 'transfer' {
  if (t === 'income' || t === 'loan_repayment') return 'income';
  if (t === 'expense' || t === 'loan_issue') return 'expense';
  return 'transfer';
}

const ACCENT_MAP: Record<string, string> = {
  bank: 'var(--color-income)',
  mobile_wallet: 'var(--color-cash)',
  cash: 'var(--color-teal)',
  savings: 'var(--color-income)',
  business: 'var(--color-purple)',
};

function AnimatedFmt({ value }: { value: number }): React.ReactNode {
  const anim = useAnimatedValue(value);
  return fmt(anim);
}

export function Dashboard() {
  const navigate = useNavigate();
  const { accounts, loading: acctLoading, error: acctError, fetchAccounts } = useAccountStore();
  const { transactions, loading: txLoading, error: txError, fetchTransactions } = useTransactionStore();
  const { loanStacks, fetchLoanStacks } = useLoanStore();

  useEffect(() => {
    fetchAccounts();
    fetchTransactions({ limit: 10 });
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
    () => transactions.slice(0, 7),
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
        <MetricCard label="Total Assets" value={fmt(animTotalAssets)} accent="violet" />
        <MetricCard label="Cash in Hand" value={fmt(animCashInHand)} accent="gold" />
        <MetricCard label="Active Loans" value={fmt(animActiveLoans)} accent="purple" />
        <MetricCard label="Family Net Worth" value={fmt(animTotalAssets)} accent="teal" />
      </div>

      <div className={styles.quickActions}>
        <button className={`${styles.qaBtn} ${styles.qaPrimary}`} onClick={() => navigate('/transaction')}>+ New Transaction</button>
        <button className={styles.qaBtn} onClick={() => navigate('/transaction')}>Transfer</button>
        <button className={styles.qaBtn} onClick={() => (getDatabase() as any).exportToFile()}>Export DB</button>
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
                  balance={<AnimatedFmt value={acct.balance} />}
                  icon={acct.icon ?? acct.name.slice(0, 2).toUpperCase()}
                  accentColor={ACCENT_MAP[acct.type]}
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
                  date={shortDate(tx.date)}
                  amount={<AnimatedFmt value={tx.amount} />}
                  type={txTypeForRow(tx.type)}
                />
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
