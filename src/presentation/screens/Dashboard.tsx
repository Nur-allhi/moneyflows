import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsModal, FAB } from '../components';
import { useAnimatedValue } from '../hooks';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useModalStore } from '../stores/useModalStore';
import { formatAmount, formatAmountParts } from '../utils/format';
import { displayTxType, ACCOUNT_TYPE_ACCENT } from '../constants/labels';
import { useSearchStore } from '../stores/useSearchStore';
import { shortDate } from '../constants/dates';
import { DASHBOARD_TX_DISPLAY_LIMIT } from '../constants/config';
import styles from './Dashboard.module.css';

const MEMBER_GRADIENTS = [
  'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  'linear-gradient(135deg, #00b894, #55efc4)',
  'linear-gradient(135deg, #fd79a8, #e84393)',
  'linear-gradient(135deg, #0984e3, #74b9ff)',
  'linear-gradient(135deg, #fdcb6e, #f39c12)',
  'linear-gradient(135deg, #e17055, #d63031)',
];

function ArrowUp() {
  return (
    <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5v-5M1.5 4L4 1.5 6.5 4" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1.5v5M1.5 4L4 6.5 6.5 4" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 14h14M2 10l6-8 6 8M4 10v3M8 10v3M12 10v3"/>
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="1" width="10" height="14" rx="2"/>
      <path d="M6 11h4"/>
    </svg>
  );
}

function CashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="14" height="8" rx="1"/>
      <path d="M8 6v4M6 8h4"/>
    </svg>
  );
}

function SavingsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6"/>
      <path d="M8 5v3l2 2"/>
    </svg>
  );
}

function BusinessIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="14" height="9" rx="1"/>
      <path d="M5 5V3a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/>
      <path d="M2 14c0-3.5 2.7-6 6-6s6 2.5 6 6"/>
    </svg>
  );
}

const ACCOUNT_ICONS: Record<string, ReactNode> = {
  bank: <BankIcon />,
  mobile_wallet: <WalletIcon />,
  cash: <CashIcon />,
  savings: <SavingsIcon />,
  business: <BusinessIcon />,
  counterparty: <PersonIcon />,
};

export function Dashboard() {
  const navigate = useNavigate();
  const openWizard = () => useModalStore.getState().open('transaction-form');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { accounts, loading: acctLoading, error: acctError, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { transactions, loading: txLoading, error: txError, fetchTransactions } = useTransactionStore();
  const { loanStacks, fetchLoanStacks } = useLoanStore();
  const { members, fetchMembers } = useMemberStore();

  useEffect(() => {
    fetchAccounts();
    fetchTransactions({});
    fetchLoanStacks();
    fetchMembers();
  }, []);

  const loading = acctLoading || txLoading;
  const error = acctError || txError;

  const internalMembers = useMemo(
    () => members.filter((m) => !m.isExternal),
    [members],
  );

  const totalAssets = useMemo(
    () => accounts.filter((a) => a.type !== 'counterparty').reduce((s, a) => s + a.balance, 0),
    [accounts],
  );

  const cashInHand = useMemo(
    () => accounts.filter((a) => a.type === 'cash' || a.type === 'mobile_wallet')
      .reduce((s, a) => s + a.balance, 0),
    [accounts],
  );

  const activeLoansOutstanding = useMemo(
    () => loanStacks.reduce((s, ls) => s + ls.totalOutstanding, 0),
    [loanStacks],
  );

  const activeLoanStacks = useMemo(
    () => loanStacks.filter((ls) => ls.totalOutstanding > 0 && !ls.loans.every((l) => l.status === 'settled')),
    [loanStacks],
  );

  const recentTxs = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, DASHBOARD_TX_DISPLAY_LIMIT),
    [transactions],
  );

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthDate = new Date(monthStart);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const incomeTypes = new Set(['income', 'loan_repayment', 'repay', 'loan_received']);
  const expenseTypes = new Set(['expense', 'loan_issue', 'lend', 'loan_paidback']);

  const thisMonthTxs = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(thisMonth)),
    [transactions, thisMonth],
  );

  const lastMonthTxs = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(lastMonth)),
    [transactions, lastMonth],
  );

  const thisMonthIncome = useMemo(
    () => thisMonthTxs.filter((tx) => incomeTypes.has(tx.type)).reduce((s, tx) => s + tx.amount, 0),
    [thisMonthTxs],
  );

  const thisMonthExpenses = useMemo(
    () => thisMonthTxs.filter((tx) => expenseTypes.has(tx.type)).reduce((s, tx) => s + tx.amount, 0),
    [thisMonthTxs],
  );

  const thisMonthNet = thisMonthIncome - thisMonthExpenses;

  const lastMonthNet = useMemo(() => {
    const inc = lastMonthTxs.filter((tx) => incomeTypes.has(tx.type)).reduce((s, tx) => s + tx.amount, 0);
    const exp = lastMonthTxs.filter((tx) => expenseTypes.has(tx.type)).reduce((s, tx) => s + tx.amount, 0);
    return inc - exp;
  }, [lastMonthTxs]);

  const prevAssets = totalAssets - thisMonthNet;
  const prevCash = cashInHand - thisMonthNet;
  const prevLoans = activeLoansOutstanding - lastMonthNet;

  const assetsChange = prevAssets > 0 ? ((totalAssets - prevAssets) / prevAssets) * 100 : 0;
  const cashChange = prevCash > 0 ? ((cashInHand - prevCash) / prevCash) * 100 : 0;
  const loanChange = prevLoans > 0 ? ((activeLoansOutstanding - prevLoans) / prevLoans) * 100 : 0;

  const animTotalAssets = useAnimatedValue(totalAssets);
  const animCashInHand = useAnimatedValue(cashInHand);
  const animActiveLoans = useAnimatedValue(activeLoansOutstanding);

  const accountsByMember = useMemo(() => {
    const map = new Map<string, typeof accounts>();
    for (const acct of accounts) {
      if (acct.type === 'counterparty') continue;
      const mid = acct.memberId ?? '__unassigned__';
      if (!map.has(mid)) map.set(mid, []);
      map.get(mid)!.push(acct);
    }
    return map;
  }, [accounts]);

  const searchQuery = useSearchStore((s) => s.query.toLowerCase().trim());

  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  const filteredAccountsByMember = useMemo(() => {
    if (!searchQuery) return accountsByMember;
    const result = new Map<string, typeof accounts>();
    for (const [mid, accts] of accountsByMember) {
      const member = memberById[mid];
      const mName = (member?.name ?? '').toLowerCase();
      const filtered = accts.filter((a) =>
        a.name.toLowerCase().includes(searchQuery) || mName.includes(searchQuery),
      );
      if (filtered.length > 0) result.set(mid, filtered);
    }
    return result;
  }, [accountsByMember, memberById, searchQuery]);

  const filteredRecentTxs = useMemo(() => {
    if (!searchQuery) return recentTxs;
    return recentTxs.filter((tx) =>
      tx.description.toLowerCase().includes(searchQuery),
    );
  }, [recentTxs, searchQuery]);

  const filteredActiveLoanStacks = useMemo(() => {
    if (!searchQuery) return activeLoanStacks;
    return activeLoanStacks.filter((ls) =>
      ls.debtorName.toLowerCase().includes(searchQuery),
    );
  }, [activeLoanStacks, searchQuery]);

  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const toggleMember = useCallback((mid: string) => {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(mid)) next.delete(mid);
      else next.add(mid);
      return next;
    });
  }, []);

  const memberTotalBalance = useMemo(() => {
    const totals = new Map<string, number>();
    for (const [mid, accts] of filteredAccountsByMember) {
      totals.set(mid, accts.reduce((sum, a) => sum + a.balance, 0));
    }
    return totals;
  }, [filteredAccountsByMember]);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className="skeleton skeleton-wizard" style={{ height: 64, borderRadius: 12 }} />
        <div className={styles.metrics}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-metric" />)}
        </div>
        <div className="skeleton skeleton-row" style={{ height: 56, borderRadius: 12 }} />
        <div className={styles.content}>
          <div className="skeleton skeleton-card" style={{ height: 300 }} />
          <div className="skeleton skeleton-card" style={{ height: 300 }} />
        </div>
        <div className="skeleton skeleton-row" style={{ height: 48, borderRadius: 10 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={`${styles.panel} ${styles.monthSummary}`}>
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">Could not load dashboard data</p>
            <button className="retry-btn" onClick={() => fetchAccounts()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>

      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.glowViolet}`}>
          <span className={styles.metricLabel}>Total Assets</span>
          <span className={styles.metricValue} style={{ color: 'var(--color-primary)' }}>
            {formatAmount(animTotalAssets, locale, currency)}
          </span>
          <span className={`${styles.metricChange} ${assetsChange >= 0 ? styles.up : styles.down}`}>
            {assetsChange >= 0 ? <ArrowUp /> : <ArrowDown />}
            {Math.abs(assetsChange).toFixed(1)}% vs last month
          </span>
        </div>
        <div className={`${styles.metricCard} ${styles.glowGold}`}>
          <span className={styles.metricLabel}>Cash in Hand</span>
          <span className={styles.metricValue} style={{ color: 'var(--color-cash)' }}>
            {formatAmount(animCashInHand, locale, currency)}
          </span>
          <span className={`${styles.metricChange} ${cashChange >= 0 ? styles.up : styles.down}`}>
            {cashChange >= 0 ? <ArrowUp /> : <ArrowDown />}
            {Math.abs(cashChange).toFixed(1)}% vs last month
          </span>
        </div>
        <div className={`${styles.metricCard} ${styles.glowCoral}`}>
          <span className={styles.metricLabel}>Active Loans</span>
          <span className={styles.metricValue} style={{ color: 'var(--color-coral)' }}>
            {formatAmount(animActiveLoans, locale, currency)}
          </span>
          <span className={`${styles.metricChange} ${loanChange >= 0 ? styles.up : styles.down}`}>
            {loanChange >= 0 ? <ArrowUp /> : <ArrowDown />}
            {Math.abs(loanChange).toFixed(1)}% vs last month
          </span>
        </div>
      </div>

      <div className={styles.monthSummary}>
        <div className={styles.monthStat}>
          <span className={styles.monthStatLabel}>Income</span>
          <span className={styles.monthStatValue} style={{ color: 'var(--color-teal)' }}>
            {formatAmount(thisMonthIncome, locale, currency)}
          </span>
        </div>
        <div className={styles.flowDivider} />
        <div className={styles.monthStat}>
          <span className={styles.monthStatLabel}>Expenses</span>
          <span className={styles.monthStatValue} style={{ color: 'var(--color-coral)' }}>
            {formatAmount(thisMonthExpenses, locale, currency)}
          </span>
        </div>
        <div className={styles.monthStat}>
          <span className={styles.monthStatLabel}>Net</span>
          <span className={styles.monthStatValue} style={{ color: thisMonthNet >= 0 ? 'var(--color-teal)' : 'var(--color-coral)' }}>
            {thisMonthNet >= 0 ? '+' : ''}{formatAmount(thisMonthNet, locale, currency)}
          </span>
        </div>
      </div>
      <div className={styles.flowNet}>
        {'\u2197'} Net {thisMonthNet >= 0 ? '+' : ''}{formatAmount(thisMonthNet, locale, currency)} this month
      </div>

      <div className={styles.actions}>
        <button className={`${styles.actBtn} ${styles.actPrimary}`} onClick={openWizard}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Transaction
        </button>
        <button className={styles.actBtn} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'loan' })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M22 12a10 10 0 0 1-10 10" />
            <path d="M12 22A10 10 0 0 1 2 12" />
            <path d="M2 12A10 10 0 0 1 12 2" />
            <path d="M12 6v6l4 2" />
          </svg>
          Quick Loan
        </button>
        <button className={styles.actBtn} onClick={() => setSettingsOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Where Your Money Is</h2>
          </div>
          {filteredAccountsByMember.size === 0 ? (
            <div className="empty-state" style={{ padding: '24px 20px' }}>
              <div className="empty-state-icon">{'\u{1F4B0}'}</div>
              <p className="empty-state-text">No accounts yet</p>
            </div>
          ) : (
              [...filteredAccountsByMember.entries()].map(([mid, accts]) => {
                const member = memberById[mid] ?? memberById.__unassigned__;
                const memberIdx = member ? internalMembers.indexOf(member) : -1;
                const grad = memberIdx >= 0 ? MEMBER_GRADIENTS[memberIdx % MEMBER_GRADIENTS.length] : MEMBER_GRADIENTS[0];
                const initial = member ? (member.shortName ?? member.name)[0] : '?';
                const mName = member ? member.name : 'Unassigned';
                const expanded = expandedMembers.has(mid);
                const totalBalance = memberTotalBalance.get(mid) ?? 0;
                return (
                  <div key={mid} className={styles.memberGroup}>
                    <div className={styles.memberHead} onClick={() => toggleMember(mid)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleMember(mid)}>
                      <div className={styles.miniAvatar} style={{ background: grad }}>{initial}</div>
                      <span className={styles.mname}>{mName}</span>
                      <span className={styles.memberTotal}>{formatAmountParts(totalBalance, locale, currency).amount}<span className={styles.currencyLabel}>{formatAmountParts(totalBalance, locale, currency).currency}</span></span>
                      <span className={`${styles.memberChevron} ${expanded ? styles.chevronOpen : ''}`}>
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 4.5l3 3 3-3" />
                        </svg>
                      </span>
                    </div>
                    {expanded && (
                      <div className={styles.memberAccounts}>
                        {accts.map((acct) => (
                          <div key={acct.id} className={styles.acctRow} onClick={(e) => { e.stopPropagation(); navigate(`/member/${mid}?account=${acct.id}`); }}>
                            <span className={styles.acctTypeIcon} style={{ color: ACCOUNT_TYPE_ACCENT[acct.type as keyof typeof ACCOUNT_TYPE_ACCENT] }}>
                              {ACCOUNT_ICONS[acct.type]}
                            </span>
                            <span className={styles.acctName}>{acct.name}</span>
                            <span className={styles.acctBalance}>
                              {formatAmountParts(acct.balance, locale, currency).amount}<span className={styles.currencyLabel}>{formatAmountParts(acct.balance, locale, currency).currency}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Recent Transactions</h2>
          </div>
          <div className={styles.txList}>
            {filteredRecentTxs.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 20px' }}>
                <div className="empty-state-icon">{'\u{1F4CB}'}</div>
                <p className="empty-state-text">No transactions yet</p>
              </div>
            ) : (
              filteredRecentTxs.map((tx) => (
                <div
                  key={tx.id}
                  className={styles.txRow}
                  onClick={() => useModalStore.getState().open('transaction-detail', { transaction: tx })}
                >
                  <span className={styles.txDate}>{shortDate(tx.date, locale)}</span>
                  <span className={styles.txType} data-type={tx.type}>{displayTxType(tx.type)}</span>
                  <span className={styles.txDesc}>{tx.description}</span>
                  <span className={styles.txAmount}>
                    <span className={`${styles.txArrow} ${tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay' ? styles.txArrowIn : styles.txArrowOut}`}>
                      {tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay' ? (
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2 6l4-4 4 4"/></svg>
                      ) : (
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v8M2 6l4 4 4-4"/></svg>
                      )}
                    </span>
                    {formatAmount(tx.amount, locale, currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Active Loans</h2>
          </div>
          <div className={styles.loanList}>
            {filteredActiveLoanStacks.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon">{'\u{1F4B3}'}</div>
                <p className="empty-state-text">No active loans</p>
              </div>
            ) : (
              filteredActiveLoanStacks.map((stack) => {
                const total = stack.totalOutstanding + stack.totalRecovered;
                const pct = total > 0 ? (stack.totalRecovered / total) * 100 : 0;
                const isSettled = stack.loans.every((l) => l.status === 'settled');
                return (
                  <div key={stack.debtorId} className={styles.loanRow} onClick={() => navigate(`/loans/${stack.debtorId}`)}>
                    <div className={styles.loanTop}>
                      <span className={styles.loanDebtor}>
                        <span className={styles.loanDebtorName}>{stack.debtorName}</span>
                        <span className={styles.loanBadges}>
                          {isSettled && <span className={`${styles.badge} ${styles.badgeSettled}`}>Settled</span>}
                          {!isSettled && stack.settledCount > 0 && <span className={`${styles.badge} ${styles.badgePartial}`}>Partial</span>}
                        </span>
                      </span>
                      <span className={styles.loanAmount}>
                        {Intl.NumberFormat(locale).format(stack.totalOutstanding)}
                        <span className={styles.loanCurrency}>{currency}</span>
                      </span>
                    </div>
                    <div className={styles.loanBarWrap}>
                      <div className={styles.loanBarFill} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className={styles.loanMeta}>
                      <span>{pct >= 100 ? 'Fully recovered' : `${Math.round(pct)}% recovered`}</span>
                      <span>{formatAmount(stack.totalOutstanding, locale, currency)} remaining</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <FAB />
    </div>
  );
}
