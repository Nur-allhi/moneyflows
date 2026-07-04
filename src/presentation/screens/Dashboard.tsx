import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsModal } from '../components';
import { useAnimatedValue } from '../hooks';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useModalStore } from '../stores/useModalStore';
import { formatAmount } from '../utils/format';
import { ACCOUNT_TYPE_GRADIENT } from '../constants/labels';
import type { AccountType } from '../../core/domain/Account';
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

  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMemberId && internalMembers.length > 0) {
      setActiveMemberId(internalMembers[0]!.id);
    }
  }, [internalMembers]);

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

  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  const dateStr = now.toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

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
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>MoneyFlows</div>
          <div className={styles.profiles}>
            {internalMembers.map((m, i) => (
              <div
                key={m.id}
                className={`${styles.avatar} ${activeMemberId === m.id ? styles.avatarActive : ''}`}
                style={{ background: MEMBER_GRADIENTS[i % MEMBER_GRADIENTS.length] }}
                title={m.name}
                onClick={() => setActiveMemberId(m.id)}
              >
                {(m.shortName ?? m.name)[0]}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.headerDate}>{dateStr}</span>
          <button className={styles.notifBtn} aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      </div>

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

      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Where Your Money Is</h2>
          </div>
          {accountsByMember.size === 0 ? (
            <div className="empty-state" style={{ padding: '24px 20px' }}>
              <div className="empty-state-icon">{'\u{1F4B0}'}</div>
              <p className="empty-state-text">No accounts yet</p>
            </div>
          ) : (
            [...accountsByMember.entries()].map(([mid, accts]) => {
              const member = memberById[mid] ?? memberById.__unassigned__;
              const memberIdx = member ? internalMembers.indexOf(member) : -1;
              const grad = memberIdx >= 0 ? MEMBER_GRADIENTS[memberIdx % MEMBER_GRADIENTS.length] : MEMBER_GRADIENTS[0];
              const initial = member ? (member.shortName ?? member.name)[0] : '?';
              const mName = member ? member.name : 'Unassigned';
              return (
                <div key={mid} className={styles.memberGroup}>
                  <div className={styles.memberHead} onClick={() => navigate(`/member/${mid}`)}>
                    <div className={styles.miniAvatar} style={{ background: grad }}>{initial}</div>
                    <span className={styles.mname}>{mName}</span>
                  </div>
                  <div className={styles.memberAccounts}>
                    {accts.map((acct) => (
                      <div key={acct.id} className={styles.acctRow} onClick={() => navigate(`/member/${mid}?account=${acct.id}`)}>
                        <div
                          className={styles.acctIcon}
                          style={{ background: ACCOUNT_TYPE_GRADIENT[acct.type as AccountType] }}
                        >
                          {acct.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className={styles.acctName}>{acct.name}</span>
                        <span className={styles.acctBalance}>
                          {formatAmount(acct.balance, locale, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Active Loans</h2>
          </div>
          <div className={styles.loanList}>
            {loanStacks.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-icon">{'\u{1F4B3}'}</div>
                <p className="empty-state-text">No active loans</p>
              </div>
            ) : (
              loanStacks.map((stack) => {
                const total = stack.totalOutstanding + stack.totalRecovered;
                const pct = total > 0 ? (stack.totalRecovered / total) * 100 : 0;
                const isSettled = stack.loans.every((l) => l.status === 'settled');
                return (
                  <div key={stack.debtorId} className={styles.loanRow} onClick={() => navigate(`/loans/${stack.debtorId}`)}>
                    <div className={styles.loanTop}>
                      <span className={styles.loanDebtor}>
                        {stack.debtorName}
                        {isSettled && <span className={`${styles.badge} ${styles.badgeSettled}`}>Settled</span>}
                        {!isSettled && stack.settledCount > 0 && <span className={styles.badge}>Overdue</span>}
                      </span>
                      <span className={styles.loanAmount}>
                        {formatAmount(stack.totalOutstanding, locale, currency)}
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

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
