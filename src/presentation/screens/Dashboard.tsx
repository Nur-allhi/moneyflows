import { GlassPanel, MetricCard, AccountRow, TransactionRow } from '../components';
import styles from './Dashboard.module.css';

interface AccountData {
  id: string;
  name: string;
  type: 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'business';
  balance: string;
  icon: string;
  accentColor: string;
}

interface TransactionData {
  id: string;
  description: string;
  date: string;
  amount: string;
  type: 'income' | 'expense' | 'transfer';
}

type DashboardState = 'loading' | 'error' | 'empty' | 'ready';

interface DashboardProps {
  state?: DashboardState;
  onRetry?: () => void;
  accounts?: AccountData[];
  transactions?: TransactionData[];
}

const defaultAccounts: AccountData[] = [
  { id: '1', name: 'Brac Bank (Efty)', type: 'bank', balance: '1,12,400', icon: 'B', accentColor: 'var(--color-income)' },
  { id: '2', name: 'bKash (Efty)', type: 'mobile_wallet', balance: '24,670', icon: 'bK', accentColor: 'var(--color-cash)' },
  { id: '3', name: 'Business Cash (Efty)', type: 'cash', balance: '52,130', icon: 'C', accentColor: 'var(--color-income)' },
  { id: '4', name: 'Nagad (Azam)', type: 'mobile_wallet', balance: '18,900', icon: 'N', accentColor: 'var(--color-cash)' },
  { id: '5', name: 'DBBL (Nahar)', type: 'savings', balance: '36,200', icon: 'D', accentColor: 'var(--color-income)' },
];

const defaultTransactions: TransactionData[] = [
  { id: '1', description: 'Milk, Pawruti', date: 'Today, 09:14 AM', amount: '320', type: 'expense' },
  { id: '2', description: 'Salary', date: 'Yesterday, 10:30 AM', amount: '85,000', type: 'income' },
  { id: '3', description: 'Loan Repayment', date: '26 Jun, 02:15 PM', amount: '5,000', type: 'transfer' },
  { id: '4', description: 'Electricity Bill', date: '25 Jun, 11:00 AM', amount: '2,450', type: 'expense' },
  { id: '5', description: 'Freelance Payment', date: '24 Jun, 04:45 PM', amount: '12,000', type: 'income' },
  { id: '6', description: 'Bazar — Weekly', date: '23 Jun, 08:30 AM', amount: '4,200', type: 'expense' },
  { id: '7', description: 'Sent to Nahar', date: '22 Jun, 07:10 PM', amount: '10,000', type: 'transfer' },
];

export function Dashboard({
  state = 'ready',
  onRetry,
  accounts = defaultAccounts,
  transactions = defaultTransactions,
}: DashboardProps) {
  if (state === 'loading') {
    return (
      <div className={styles.dashboard}>
        <div className={styles.metrics}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.loadingMetric} />
          ))}
        </div>
        <div className={styles.loading}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.loadingRow} />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.dashboard}>
        <GlassPanel padding="lg">
          <div className={styles.error}>
            <div className={styles.errorIcon}>{'\u26A0\uFE0F'}</div>
            <p>Could not load dashboard data</p>
            <button className={styles.retryBtn} onClick={onRetry}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.metrics}>
        <MetricCard
          label="Total Assets"
          value="4,29,500 BDT"
          accent="violet"
          change="+12.4% vs last month"
          changeDirection="up"
        />
        <MetricCard
          label="Cash in Hand"
          value="1,89,200 BDT"
          accent="gold"
          change="-3.1% vs last month"
          changeDirection="down"
        />
        <MetricCard
          label="Active Loans"
          value="3,55,000 BDT"
          accent="purple"
          change="+1 new this month"
          changeDirection="up"
        />
        <MetricCard
          label="Family Net Worth"
          value="2,63,700 BDT"
          accent="teal"
          change="+8.2% this year"
          changeDirection="up"
        />
      </div>

      <div className={styles.quickActions}>
        <button className={`${styles.qaBtn} ${styles.qaPrimary}`}>+ New Transaction</button>
        <button className={styles.qaBtn}>Transfer</button>
        <button className={styles.qaBtn}>Reports</button>
        <button className={styles.qaBtn}>Settings</button>
      </div>

      <div className={styles.content}>
        <GlassPanel padding="none">
          <div className={styles.sectionHeader}>
            <h2>Combined Balances</h2>
            <span className={styles.sectionAction}>View all &rarr;</span>
          </div>
          <div className={styles.accountList}>
            {state === 'empty' ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>{'\u{1F4B0}'}</div>
                <p>No accounts connected yet</p>
              </div>
            ) : (
              accounts.map((acct) => (
                <AccountRow
                  key={acct.id}
                  name={acct.name}
                  type={acct.type}
                  balance={acct.balance}
                  icon={acct.icon}
                  accentColor={acct.accentColor}
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
            {state === 'empty' ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>{'\u{1F4C4}'}</div>
                <p>No recent transactions</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  description={tx.description}
                  date={tx.date}
                  amount={tx.amount}
                  type={tx.type}
                />
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
