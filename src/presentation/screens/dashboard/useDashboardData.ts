import { useEffect, useMemo } from 'react';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useLoanStore } from '../../stores/useLoanStore';
import { useMemberStore } from '../../stores/useMemberStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useSearchStore } from '../../stores/useSearchStore';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { matchesTx, matchesAccount } from '../../utils/search';
import { DASHBOARD_TX_DISPLAY_LIMIT } from '../../constants/config';

const INCOME_TYPES = new Set(['income', 'loan_repayment', 'repay', 'loan_received']);
const EXPENSE_TYPES = new Set(['expense', 'loan_issue', 'lend', 'loan_paidback']);

export function useDashboardData() {
  const { accounts, loading: acctLoading, error: acctError, fetchAccounts } = useAccountStore();
  const { locale, currency, totalAssetsIncludeLoans } = useSettingsStore((s) => s.settings);
  const { transactions, loading: txLoading, error: txError, fetchTransactions } = useTransactionStore();
  const { loanStacks, fetchLoanStacks } = useLoanStore();
  const { members, fetchMembers } = useMemberStore();

  useEffect(() => { fetchAccounts(); fetchTransactions({}); fetchLoanStacks(); fetchMembers(); }, [fetchAccounts, fetchTransactions, fetchLoanStacks, fetchMembers]);

  const loading = acctLoading || txLoading;
  const error = acctError || txError;
  const internalMembers = useMemo(() => members.filter((m) => !m.isExternal), [members]);
  const activeLoansOutstanding = useMemo(() => loanStacks.reduce((s, ls) => s + ls.totalOutstanding, 0), [loanStacks]);
  const totalAssets = useMemo(() => {
    const base = accounts.filter((a) => a.type !== 'counterparty').reduce((s, a) => s + a.balance, 0);
    return totalAssetsIncludeLoans ? base + activeLoansOutstanding : base;
  }, [accounts, totalAssetsIncludeLoans, activeLoansOutstanding]);
  const cashInHand = useMemo(() => accounts.filter((a) => a.type === 'cash' || a.type === 'mobile_wallet').reduce((s, a) => s + a.balance, 0), [accounts]);
  const totalInBanks = useMemo(() => accounts.filter((a) => a.type === 'bank' || a.type === 'savings' || a.type === 'business').reduce((s, a) => s + a.balance, 0), [accounts]);
  const activeLoanStacks = useMemo(() => loanStacks.filter((ls) => ls.totalOutstanding > 0 && !ls.loans.every((l) => l.status === 'settled')), [loanStacks]);
  const recentTxs = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, DASHBOARD_TX_DISPLAY_LIMIT), [transactions]);
  const now = new Date(); const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); const lastMonthDate = new Date(monthStart); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTxs = useMemo(() => transactions.filter((tx) => tx.date.startsWith(thisMonth)), [transactions, thisMonth]);
  const lastMonthTxs = useMemo(() => transactions.filter((tx) => tx.date.startsWith(lastMonth)), [transactions, lastMonth]);
  const thisMonthIncome = useMemo(() => thisMonthTxs.filter((tx) => INCOME_TYPES.has(tx.type)).reduce((s, tx) => s + tx.amount, 0), [thisMonthTxs]);
  const thisMonthExpenses = useMemo(() => thisMonthTxs.filter((tx) => EXPENSE_TYPES.has(tx.type)).reduce((s, tx) => s + tx.amount, 0), [thisMonthTxs]);
  const thisMonthNet = thisMonthIncome - thisMonthExpenses;
  const lastMonthNet = useMemo(() => {
    const inc = lastMonthTxs.filter((tx) => INCOME_TYPES.has(tx.type)).reduce((s, tx) => s + tx.amount, 0);
    const exp = lastMonthTxs.filter((tx) => EXPENSE_TYPES.has(tx.type)).reduce((s, tx) => s + tx.amount, 0);
    return inc - exp;
  }, [lastMonthTxs]);
  const prevAssets = totalAssets - thisMonthNet; const prevCash = cashInHand - thisMonthNet; const prevBanks = totalInBanks - lastMonthNet; const prevLoans = activeLoansOutstanding - lastMonthNet;
  const assetsChange = prevAssets > 0 ? ((totalAssets - prevAssets) / prevAssets) * 100 : 0;
  const cashChange = prevCash > 0 ? ((cashInHand - prevCash) / prevCash) * 100 : 0;
  const banksChange = prevBanks > 0 ? ((totalInBanks - prevBanks) / prevBanks) * 100 : 0;
  const loansChange = prevLoans > 0 ? ((activeLoansOutstanding - prevLoans) / prevLoans) * 100 : 0;
  const accountsByMember = useMemo(() => {
    const map = new Map<string, typeof accounts>();
    for (const acct of accounts) { if (acct.type === 'counterparty') continue; const mid = acct.memberId ?? '__unassigned__'; if (!map.has(mid)) map.set(mid, []); map.get(mid)!.push(acct); }
    return map;
  }, [accounts]);
  const rawQuery = useSearchStore((s) => s.query); const searchQuery = rawQuery.trim(); const debouncedQuery = useDebouncedValue(searchQuery, 200);
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const accountMapForSearch = useMemo(() => new Map(accounts.map((a) => [a.id, { name: a.name }])), [accounts]);
  const memberMapForSearch = useMemo(() => new Map(members.map((m) => [m.id, { name: m.name }])), [members]);
  const filteredAccountsByMember = useMemo(() => {
    if (!debouncedQuery) return accountsByMember;
    const result = new Map<string, typeof accounts>();
    for (const [mid, accts] of accountsByMember) {
      const member = memberById[mid]; const mName = member?.name ?? '';
      const filtered = accts.filter((a) => matchesAccount(a.name, mName, debouncedQuery));
      if (filtered.length > 0) result.set(mid, filtered);
    }
    return result;
  }, [accountsByMember, memberById, debouncedQuery]);
  const filteredRecentTxs = useMemo(() => {
    if (!debouncedQuery) return recentTxs;
    const sortedAll = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    return sortedAll.filter((tx) => matchesTx(tx, debouncedQuery, { accountMap: accountMapForSearch, memberMap: memberMapForSearch }));
  }, [recentTxs, transactions, debouncedQuery, accountMapForSearch, memberMapForSearch]);

  return {
    accounts, members, transactions, loanStacks, locale, currency, totalAssetsIncludeLoans, loading, error, internalMembers, totalAssets, cashInHand, totalInBanks, activeLoansOutstanding, activeLoanStacks, recentTxs, thisMonth, lastMonth, thisMonthTxs, lastMonthTxs, thisMonthIncome, thisMonthExpenses, thisMonthNet, lastMonthNet, prevAssets, prevCash, prevBanks, prevLoans, assetsChange, cashChange, banksChange, loansChange, accountsByMember, filteredAccountsByMember, filteredRecentTxs, rawQuery, debouncedQuery, memberById,
  };
}
