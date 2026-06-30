import { useRef, useState, useEffect, useCallback } from 'react';
import { Avatar, AccountCard, LedgerTable, SegmentedTabs, QuickActionCard, GlassPanel } from '../components';
import type { LedgerRow } from '../components';
import styles from './MemberProfile.module.css';

interface AccountData {
  id: string;
  name: string;
  type: string;
  balance: string;
  accountNumber?: string;
  gradient: string;
  showChip?: boolean;
}

interface MemberData {
  name: string;
  initial: string;
  tag: string;
  avatarGradient?: string;
  totalBalance: string;
  totalIncome?: string;
  totalExpenses?: string;
}

interface SpendCategory {
  label: string;
  amount: string;
  color: string;
}

interface BudgetBar {
  label: string;
  current: string;
  max: string;
  percent: number;
  colorClass: string;
}

interface SavingsGoal {
  icon: string;
  title: string;
  percent: number;
  detail: string;
  addition: string;
}

type ProfileState = 'loading' | 'error' | 'empty' | 'ready';

interface MemberProfileProps {
  state?: ProfileState;
  onRetry?: () => void;
  member?: MemberData;
  accounts?: AccountData[];
  ledger?: LedgerRow[];
  spending?: SpendCategory[];
  budgets?: BudgetBar[];
  goals?: SavingsGoal[];
}

const defaultMember: MemberData = {
  name: 'Efty',
  initial: 'E',
  tag: 'Family admin \u2022 Brac Bank \u2022 bKash',
  totalBalance: '44,671 BDT',
  totalIncome: '1,89,000 BDT',
  totalExpenses: '1,44,329 BDT',
};

const defaultAccounts: AccountData[] = [
  { id: '1', name: 'bKash Wallet', type: 'Mobile Wallet', balance: '24,670 BDT', accountNumber: '4821', gradient: 'linear-gradient(135deg, #d81b60, #e91e63 50%, #f06292)', showChip: true },
  { id: '2', name: 'Brac Bank', type: 'Savings Account', balance: '1,12,400 BDT', accountNumber: '3390', gradient: 'linear-gradient(135deg, #1a237e, #283593 50%, #3f51b5)', showChip: true },
  { id: '3', name: 'Business Cash', type: 'Current Account', balance: '52,130 BDT', accountNumber: '7712', gradient: 'linear-gradient(135deg, #263238, #37474f 50%, #546e7a)', showChip: false },
];

const defaultLedger: LedgerRow[] = [
  { date: '29 Jun', description: 'Milk, Pawruti', debit: '320', credit: '\u2014', balance: '44,671', type: 'expense' },
  { date: '28 Jun', description: 'Salary Deposit', debit: '\u2014', credit: '85,000', balance: '44,991', type: 'income' },
  { date: '26 Jun', description: 'Loan Repayment', debit: '5,000', credit: '\u2014', balance: '-40,009', type: 'transfer' },
  { date: '25 Jun', description: 'Electricity Bill', debit: '2,450', credit: '\u2014', balance: '-45,009', type: 'expense' },
  { date: '24 Jun', description: 'Freelance Payment', debit: '\u2014', credit: '12,000', balance: '-42,559', type: 'income' },
  { date: '23 Jun', description: 'Bazar Weekly', debit: '4,200', credit: '\u2014', balance: '-54,559', type: 'expense' },
  { date: '22 Jun', description: 'Transfer to Nahar', debit: '10,000', credit: '\u2014', balance: '-50,359', type: 'transfer' },
  { date: '21 Jun', description: 'bKash Cash Out', debit: '2,000', credit: '\u2014', balance: '-40,359', type: 'expense' },
];

const defaultSpending: SpendCategory[] = [
  { label: 'Food & Grocery', amount: '8,450 BDT', color: 'var(--color-expense)' },
  { label: 'Utilities', amount: '4,200 BDT', color: 'var(--color-primary)' },
  { label: 'Transport', amount: '2,350 BDT', color: 'var(--color-cash)' },
  { label: 'Savings', amount: '15,000 BDT', color: 'var(--color-income)' },
  { label: 'Others', amount: '3,200 BDT', color: 'var(--color-text-secondary)' },
];

const defaultBudgets: BudgetBar[] = [
  { label: 'Groceries', current: '6,500', max: '10,000', percent: 65, colorClass: 'fillCoral' },
  { label: 'Utilities', current: '3,800', max: '5,000', percent: 76, colorClass: 'fillViolet' },
  { label: 'Entertainment', current: '1,200', max: '3,000', percent: 40, colorClass: 'fillTeal' },
];

const defaultGoals: SavingsGoal[] = [
  { icon: '\u{1F3E0}', title: 'Emergency Fund', percent: 42, detail: '84,000 / 2,00,000 BDT', addition: '+12K' },
  { icon: '\u2708\uFE0F', title: 'Family Trip', percent: 28, detail: '14,000 / 50,000 BDT', addition: '+2K' },
  { icon: '\u{1F4DA}', title: 'Study Fund (Nahar)', percent: 55, detail: '55,000 / 1,00,000 BDT', addition: '+5K' },
];

const ledgerFilters = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
];

const CARD_WIDTH = 280;
const CARD_GAP = 12;

export function MemberProfile({
  state = 'ready',
  onRetry,
  member = defaultMember,
  accounts = defaultAccounts,
  ledger = defaultLedger,
  spending = defaultSpending,
  budgets = defaultBudgets,
  goals = defaultGoals,
}: MemberProfileProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [ledgerFilter, setLedgerFilter] = useState('all');

  const handleScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (CARD_WIDTH + CARD_GAP));
    setActiveDot(Math.min(idx, accounts.length - 1));
  }, [accounts.length]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const filteredLedger = ledgerFilter === 'all'
    ? ledger
    : ledger.filter((row) => row.type === ledgerFilter);

  if (state === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingProfile} />
          <div className={styles.carousel}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.loadingCard} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.container}>
        <GlassPanel padding="lg">
          <div className={styles.error}>
            <div className={styles.errorIcon}>{'\u26A0\uFE0F'}</div>
            <p>Could not load member profile</p>
            <button className={styles.retryBtn} onClick={onRetry}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mobileOnly}>
        <div className={styles.profileCard}>
          <Avatar
            initial={member.initial}
            name={member.name}
            size={72}
            gradient={member.avatarGradient}
          />
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{member.name}</div>
            <div className={styles.profileTag}>{member.tag}</div>
          </div>
          <div className={styles.profileBalance}>
            <div className={styles.balanceLabel}>Balance</div>
            <div className={styles.balanceAmount}>{member.totalBalance}</div>
          </div>
        </div>

        <div className={styles.sectionLabel}>Accounts</div>
        <div className={styles.carousel} ref={carouselRef}>
          {accounts.length === 0 ? (
            <div className={styles.empty}>No accounts</div>
          ) : (
            accounts.map((acct) => (
              <AccountCard
                key={acct.id}
                name={acct.name}
                type={acct.type}
                balance={acct.balance}
                accountNumber={acct.accountNumber}
                gradient={acct.gradient}
                showChip={acct.showChip}
              />
            ))
          )}
        </div>
        <div className={styles.carouselDots}>
          {accounts.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === activeDot ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.desktopOnly}>
        <div className={styles.profileHero}>
          <Avatar
            initial={member.initial}
            name={member.name}
            size={72}
            gradient={member.avatarGradient}
          />
          <div className={styles.heroDetails}>
            <div className={styles.heroName}>{member.name}</div>
            <div className={styles.heroMeta}>
              <span>{'\u{1F3C6}'} Family admin</span>
              <span>{'\u{1F3E6}'} Brac Bank</span>
              <span>{'\u{1F4F1}'} bKash</span>
              <span>{'\u{1F4B3}'} Business Cash</span>
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Net Balance</div>
              <div className={`${styles.statValue} ${styles.statTeal}`}>{member.totalBalance}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Total Income</div>
              <div className={`${styles.statValue} ${styles.statTeal}`}>{member.totalIncome}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Total Expenses</div>
              <div className={`${styles.statValue} ${styles.statCoral}`}>{member.totalExpenses}</div>
            </div>
          </div>
        </div>

        <div className={styles.actionStrip}>
          <QuickActionCard
            icon={'\u2795'}
            iconBg="violet"
            title="Add Income"
            subtitle="Record a new deposit"
          />
          <QuickActionCard
            icon={'\u2796'}
            iconBg="coral"
            title="Log Expense"
            subtitle="Track a payment"
          />
          <QuickActionCard
            icon={'\u{1F504}'}
            iconBg="teal"
            title="Transfer Money"
            subtitle="Between accounts"
          />
        </div>

        <div className={styles.accountsSectionHeader}>
          <h2>Linked Accounts</h2>
          <span className={styles.accountsAction}>+ Add account</span>
        </div>
        <div className={styles.accountsGrid}>
          {accounts.length === 0 ? (
            <div className={styles.empty}>No accounts</div>
          ) : (
            accounts.map((acct) => (
              <AccountCard
                key={acct.id}
                name={acct.name}
                type={acct.type}
                balance={acct.balance}
                accountNumber={acct.accountNumber}
                gradient={acct.gradient}
                showChip={acct.showChip}
              />
            ))
          )}
        </div>
      </div>

      <div className={styles.contentSplit}>
        <div className={styles.ledgerPanel}>
          <div className={styles.ledgerPanelHead}>
            <h3>Account Ledger</h3>
            <div className={styles.ledgerPanelFilter}>
              <SegmentedTabs
                tabs={ledgerFilters}
                activeKey={ledgerFilter}
                onChange={setLedgerFilter}
              />
            </div>
          </div>
          <LedgerTable
            rows={filteredLedger}
            desktop
          />
        </div>

        <div className={styles.sidePanel}>
          <div className={styles.spendCard}>
            <h3>Spending This Month</h3>
            {spending.map((cat) => (
              <div key={cat.label} className={styles.spendRow}>
                <div className={styles.spendCat}>
                  <span className={styles.spendDot} style={{ background: cat.color }} />
                  {cat.label}
                </div>
                <div className={styles.spendAmt}>{cat.amount}</div>
              </div>
            ))}
          </div>

          <div className={styles.spendCard}>
            <h3>Monthly Budget</h3>
            {budgets.map((b) => (
              <div key={b.label} className={styles.budgetBar}>
                <div className={styles.budgetMeta}>
                  <span>{b.label}</span>
                  <span>{b.current} / {b.max} BDT</span>
                </div>
                <div className={styles.budgetTrack}>
                  <div
                    className={`${styles.budgetFill} ${styles[b.colorClass]}`}
                    style={{ width: `${b.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.spendCard}>
            <h3>{'\u{1F3C6}'} Savings Goals</h3>
            {goals.map((g) => (
              <div key={g.title} className={styles.goalRow}>
                <div className={styles.goalIcon}>{g.icon}</div>
                <div className={styles.goalInfo}>
                  <div className={styles.goalTitle}>{g.title}</div>
                  <div className={styles.goalProgress}>{g.percent}% &bull; {g.detail}</div>
                </div>
                <div className={styles.goalAmt}>{g.addition}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
