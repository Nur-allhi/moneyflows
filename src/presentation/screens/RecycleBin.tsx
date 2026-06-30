import { useState } from 'react';
import { RecycleRow, GlassPanel } from '../components';
import styles from './RecycleBin.module.css';

interface RecycleItem {
  id: string;
  icon: string;
  iconVariant: 'warning' | 'account';
  name: string;
  meta: string;
  amount: string;
  amountColor: string;
  date: string;
  type: 'transaction' | 'account';
}

type RecycleState = 'loading' | 'error' | 'empty' | 'ready';

interface RecycleBinProps {
  state?: RecycleState;
  onRetry?: () => void;
  items?: RecycleItem[];
}

const defaultItems: RecycleItem[] = [
  { id: '1', icon: '\u26A0', iconVariant: 'warning', name: 'Milk, Pawruti', meta: 'Expense \u2022 Efty \u2022 bKash', amount: '-320 BDT', amountColor: 'var(--color-expense)', date: 'Today, 10:32 AM', type: 'transaction' },
  { id: '2', icon: '\u26A0', iconVariant: 'warning', name: 'Electricity Bill', meta: 'Expense \u2022 Efty \u2022 Brac Bank', amount: '-2,450 BDT', amountColor: 'var(--color-expense)', date: 'Yesterday, 04:15 PM', type: 'transaction' },
  { id: '3', icon: '\u26A0', iconVariant: 'warning', name: 'Bazar Weekly', meta: 'Expense \u2022 Nahar \u2022 DBBL', amount: '-4,200 BDT', amountColor: 'var(--color-expense)', date: '3 days ago', type: 'transaction' },
  { id: '4', icon: '\u26A0', iconVariant: 'warning', name: 'Transfer to Nahar', meta: 'Transfer \u2022 Efty \u2022 bKash \u2192 DBBL', amount: '-10,000 BDT', amountColor: 'var(--color-expense)', date: '5 days ago', type: 'transaction' },
  { id: '5', icon: '\u26A0', iconVariant: 'warning', name: 'bKash Cash Out', meta: 'Expense \u2022 Azam \u2022 Nagad', amount: '-2,000 BDT', amountColor: 'var(--color-expense)', date: '6 days ago', type: 'transaction' },
  { id: '6', icon: '\u{1F3E6}', iconVariant: 'account', name: 'Rocket Wallet (Azam)', meta: 'Account \u2022 Deleted 12 Jun', amount: '\u2014', amountColor: 'var(--color-text-secondary)', date: '12 Jun', type: 'account' },
  { id: '7', icon: '\u{1F3E6}', iconVariant: 'account', name: 'UPay Wallet (Nahar)', meta: 'Account \u2022 Deleted 8 Jun', amount: '\u2014', amountColor: 'var(--color-text-secondary)', date: '8 Jun', type: 'account' },
];

const tabs = [
  { key: 'all', label: 'All Items', count: 7 },
  { key: 'transactions', label: 'Transactions', count: 5 },
  { key: 'accounts', label: 'Accounts', count: 2 },
];

export function RecycleBin({
  state = 'ready',
  onRetry,
  items = defaultItems,
}: RecycleBinProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredItems = activeTab === 'all'
    ? items
    : items.filter((item) =>
        activeTab === 'transactions' ? item.type === 'transaction' : item.type === 'account'
      );

  const tabCount = (key: string) => {
    if (key === 'all') return items.length;
    return items.filter((i) => key === 'transactions' ? i.type === 'transaction' : i.type === 'account').length;
  };

  const totalAmount = items.reduce((sum, item) => sum + parseInt(item.amount.replace(/[^0-9]/g, ''), 10), 0);
  const formattedTotal = totalAmount.toLocaleString('en-IN');

  const handleRestore = (id: string) => {
    console.log('Restore', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete', id);
  };

  if (state === 'loading') {
    return (
      <div className={styles.recycle}>
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
      <div className={styles.recycle}>
        <GlassPanel padding="lg">
          <div className={styles.error}>
            <div className={styles.errorIcon}>{'\u26A0\uFE0F'}</div>
            <p>Could not load recycle bin</p>
            <button className={styles.retryBtn} onClick={onRetry}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.recycle}>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statNum} style={{ color: 'var(--color-text-secondary)' }}>{items.length}</span>
          <span className={styles.statLabel}>Deleted Items</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum} style={{ color: 'var(--color-expense)' }}>{formattedTotal} BDT</span>
          <span className={styles.statLabel}>Total Amount</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum} style={{ color: 'var(--color-income)' }}>28</span>
          <span className={styles.statLabel}>Days Until Auto-Purge</span>
        </div>
        <div className={styles.actionBar}>
          <button className={styles.pillBtn}>{'\u{1F504}'} Refresh</button>
          <button className={`${styles.pillBtn} ${styles.pillDanger}`}>{'\uD83D\uDDD1\uFE0F'} Empty Bin</button>
        </div>
      </div>

      <div className={styles.listPanel}>
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid var(--color-border)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 500,
                color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 11,
                background: activeTab === tab.key ? 'oklch(62% 0.22 290 / 0.15)' : 'oklch(100% 0 0 / 0.08)',
                padding: '1px 7px',
                borderRadius: 999,
                marginLeft: 6,
              }}>
                {tabCount(tab.key)}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.listHeader}>
          <span />
          <span>Name</span>
          <span>Amount</span>
          <span>Deleted</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        <div className={styles.listBody}>
          {filteredItems.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>{'\uD83D\uDDD1\uFE0F'}</div>
              <p>No deleted items</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <RecycleRow
                key={item.id}
                icon={item.icon}
                iconVariant={item.iconVariant}
                name={item.name}
                meta={item.meta}
                amount={item.amount}
                amountColor={item.amountColor}
                date={item.date}
                onRestore={() => handleRestore(item.id)}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
