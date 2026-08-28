/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FAB } from '../components';
import { useAnimatedValue } from '../hooks';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useModalStore } from '../stores/useModalStore';
import styles from './Dashboard.module.css';
import { useDashboardData } from './dashboard/useDashboardData';
import { MetricCards, MonthSummary } from './dashboard/sections';
import { WhereMoneyIsPanel, RecentTxsPanel, ActiveLoansPanel } from './dashboard/panels';

export function Dashboard() {
  const navigate = useNavigate();
  const openWizard = () => useModalStore.getState().open('transaction-form');
  const { fetchAccounts } = useAccountStore();
  const settings = useSettingsStore((s) => s.settings);
  const d = useDashboardData();
  const { locale, currency, loading, error, totalAssets, cashInHand, totalInBanks, assetsChange, cashChange, banksChange, thisMonthIncome, thisMonthExpenses, thisMonthNet, filteredAccountsByMember, memberById, internalMembers, filteredRecentTxs, activeLoanStacks } = d as any;
  const animTotalAssets = useAnimatedValue(totalAssets);
  const animCashInHand = useAnimatedValue(cashInHand);
  const animTotalInBanks = useAnimatedValue(totalInBanks);
  const showWhere = settings.showWhereMoneyIs ?? true;
  const showRecent = settings.showRecentTransactions ?? true;
  const showLoans = settings.showActiveLoans ?? true;
  const visibleCount = [showWhere, showRecent, showLoans].filter(Boolean).length;
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [closingMembers, setClosingMembers] = useState<Set<string>>(new Set());
  const closingRef = useRef<Set<string>>(new Set());
  const toggleMember = useCallback((mid: string) => {
    if (expandedMembers.has(mid)) {
      closingRef.current.add(mid); setClosingMembers(new Set(closingRef.current));
      setTimeout(() => { closingRef.current.delete(mid); setClosingMembers(new Set(closingRef.current)); setExpandedMembers((prev) => { const n = new Set(prev); n.delete(mid); return n; }); }, 200);
    } else setExpandedMembers((prev) => { const n = new Set(prev); n.add(mid); return n; });
  }, [expandedMembers]);
  const memberTotalBalance = new Map<string, number>();
  for (const [mid, accts] of (filteredAccountsByMember as Map<string, any>)) memberTotalBalance.set(mid, (accts as any[]).reduce((s, a) => s + a.balance, 0));
  const filteredActiveLoanStacks = (activeLoanStacks as any[]).filter(() => true);
  const searchQuery = (d as any).rawQuery ?? '';
  if (loading) return <div className={styles.dashboard}><div className="skeleton skeleton-wizard" style={{ height: 64, borderRadius: 12 }} /><div className={styles.metrics}>{[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-metric" />)}</div><div className="skeleton skeleton-row" style={{ height: 56, borderRadius: 12 }} /><div className={styles.content}><div className="skeleton skeleton-card" style={{ height: 300 }} /><div className="skeleton skeleton-card" style={{ height: 300 }} /></div></div>;
  if (error) return <div className={styles.dashboard}><div className={`${styles.panel} ${styles.monthSummary}`}><div className="error-state"><div className="error-state-icon">{'\u26A0\uFE0F'}</div><p className="error-state-text">Could not load dashboard data</p><button className="retry-btn" onClick={() => fetchAccounts()}>Retry</button></div></div></div>;
  return (
    <div className={styles.dashboard}>
      <MetricCards assetsChange={assetsChange} cashChange={cashChange} banksChange={banksChange} locale={locale} currency={currency} animTotalAssets={animTotalAssets} animCashInHand={animCashInHand} animTotalInBanks={animTotalInBanks} />
      <MonthSummary thisMonthIncome={thisMonthIncome} thisMonthExpenses={thisMonthExpenses} thisMonthNet={thisMonthNet} locale={locale} currency={currency} />
      <div className={styles.actions}>
        <button className={`${styles.actBtn} ${styles.actPrimary}`} onClick={openWizard}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>New Transaction</button>
        <button className={styles.actBtn} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'loan' })}>Quick Loan</button>
      </div>
      <div className={styles.content} data-cols={visibleCount || 1}>
        {showWhere && <div className={styles.panel}><div className={styles.panelHeader}><h2>Where Your Money Is</h2></div><WhereMoneyIsPanel filteredAccountsByMember={filteredAccountsByMember} memberById={memberById} internalMembers={internalMembers} expandedMembers={expandedMembers} closingMembers={closingMembers} toggleMember={toggleMember} memberTotalBalance={memberTotalBalance} searchQuery={searchQuery} locale={locale} currency={currency} /></div>}
        {showRecent && <div className={styles.panel}><div className={styles.panelHeader}><h2>Recent Transactions</h2></div><div className={styles.txList}><RecentTxsPanel filteredRecentTxs={filteredRecentTxs} searchQuery={searchQuery} locale={locale} currency={currency} /></div></div>}
        {showLoans && <div className={styles.panel}><div className={styles.panelHeader}><h2>Active Loans</h2></div><div className={styles.loanList}><ActiveLoansPanel filteredActiveLoanStacks={filteredActiveLoanStacks} searchQuery={searchQuery} locale={locale} currency={currency} navigate={navigate} /></div></div>}
        {visibleCount === 0 && <div className={styles.panel}><div className="empty-state" style={{ padding: '40px 20px' }}><div className="empty-state-icon">⚙️</div><p className="empty-state-text">All sections hidden — enable them in Settings → Dashboard.</p></div></div>}
      </div>
      <FAB />
    </div>
  );
}
