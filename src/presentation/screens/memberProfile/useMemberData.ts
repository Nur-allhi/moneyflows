import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMemberStore } from '../../stores/useMemberStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTagStore } from '../../stores/useTagStore';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { matchesTx } from '../../utils/search';
import { formatAmountParts } from '../../utils/format';
import { shortDate } from '../../constants/dates';
import { sumIncomeExpense } from '../../../core/domain/transactionCategory';
import { withRunningBalances } from '../../utils/runningBalance';
import { ledgerAmountCells, memberLedgerDelta } from '../../utils/memberLedger';
import type { LedgerRow } from '../../components';
import type { Transaction } from '../../../core/domain/Transaction';

export function useMemberData() {
  const { id: memberId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const knownTags = useTagStore((s) => s.tags);
  const { members, fetchMembers } = useMemberStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { if (memberId) { fetchAccounts(); fetchTransactions(); } }, [memberId, fetchAccounts, fetchTransactions]);

  const member = useMemo(() => members.find((m) => m.id === memberId) ?? null, [members, memberId]);
  const memberAccounts = useMemo(() => accounts.filter((a) => a.memberId === memberId), [accounts, memberId]);
  useEffect(() => {
    if (!memberAccounts.length) return;
    const acctParam = searchParams.get('account');
    if (acctParam && memberAccounts.some((a) => a.id === acctParam)) setSelectedAccountId(acctParam);
  }, [memberAccounts, searchParams]);

  const totalBalance = useMemo(() => memberAccounts.reduce((s, a) => s + a.balance, 0), [memberAccounts]);
  const memberTxs = useMemo(() => {
    const acctIds = new Set(memberAccounts.map((a) => a.id));
    return transactions.filter((t) => acctIds.has(t.sourceAccount ?? '') || acctIds.has(t.destAccount ?? ''));
  }, [transactions, memberAccounts]);
  const accountTxs = useMemo(() => {
    if (!selectedAccountId) return memberTxs;
    return memberTxs.filter((t) => t.sourceAccount === selectedAccountId || t.destAccount === selectedAccountId);
  }, [memberTxs, selectedAccountId]);
  // Same classification the dashboard's Income / Expenses totals use, so the
  // two surfaces cannot disagree about the same transactions (BUG-26).
  const memberTotals = useMemo(() => sumIncomeExpense(memberTxs), [memberTxs]);
  const totalIncome = memberTotals.income;
  const totalExpenses = memberTotals.expense;
  const sortedTxs = useMemo(() => [...accountTxs].sort((a, b) => a.date.localeCompare(b.date)), [accountTxs]);
  const debouncedLedgerQuery = useDebouncedValue(ledgerQuery, 200);
  const accountMapForSearch = useMemo(() => new Map(accounts.map((a) => [a.id, { name: a.name }])), [accounts]);

  const searchFilteredAll = useMemo(() => {
    let r = sortedTxs;
    if (debouncedLedgerQuery.trim()) r = r.filter((t) => matchesTx(t, debouncedLedgerQuery, { accountMap: accountMapForSearch }));
    if (tagFilter) r = r.filter((t) => (t.metadata as Record<string, unknown>)?.tags && ((t.metadata as { tags: string[] }).tags.includes(tagFilter)));
    return r;
  }, [sortedTxs, debouncedLedgerQuery, tagFilter, accountMapForSearch]);

  const filteredTxs = useMemo(() => {
    const ordered = sortOrder === 'desc' ? [...searchFilteredAll].reverse() : searchFilteredAll;
    return ordered.slice(0, displayLimit);
  }, [searchFilteredAll, displayLimit, sortOrder]);
  const ledgerTagOptions = useMemo(() => {
    const s = new Set<string>();
    sortedTxs.forEach((t) => { const tags = (t.metadata as { tags?: string[] })?.tags; if (tags) tags.forEach((x) => s.add(x)); });
    return [...s].sort();
  }, [sortedTxs]);

  const ledgerRows: LedgerRow[] = useMemo(() => {
    // The view is one account when one is selected, otherwise every account the
    // member holds — the second case used to treat every transfer and every
    // received repayment as a debit because it compared against a null id
    // (BUG-32).
    const viewIds = selectedAccountId
      ? new Set([selectedAccountId])
      : new Set(memberAccounts.map((a) => a.id));
    const deltaOf = (tx: Transaction) => memberLedgerDelta(tx, viewIds);

    // Balances walk the member's whole history oldest→newest (the search box and
    // filters only decide which rows are shown), so the balance after a row is
    // the same figure wherever that row appears.
    const walked = withRunningBalances(
      sortedTxs,
      deltaOf,
      sortedTxs.reduce((sum, tx) => sum + deltaOf(tx), 0),
    );

    const rows: LedgerRow[] = [];
    for (const { item: tx, balance } of walked) {
      if (!searchFilteredAll.includes(tx)) continue;
      const mappedType: LedgerRow['type'] = tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : tx.type === 'transfer' ? 'transfer' : 'loan';
      const delta = deltaOf(tx);
      const fmt = formatAmountParts(tx.amount, locale, currency);
      const cells = ledgerAmountCells(delta, fmt.amount);
      rows.push({
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: tx.description,
        // Locale-formatted through the same helper as every other money cell —
        // this used to be String(balance), printed raw (BUG-33).
        balance: formatAmountParts(balance, locale, currency).amount,
        currencyLabel: currency,
        type: mappedType,
        credit: cells.credit,
        debit: cells.debit,
      });
    }
    // Balances are computed walking oldest→newest; display order follows sortOrder.
    if (sortOrder === 'desc') rows.reverse();
    return rows;
  }, [sortedTxs, memberAccounts, searchFilteredAll, selectedAccountId, locale, currency, sortOrder]);

  const filteredLedger = useMemo(() => {
    let r = ledgerRows;
    if (ledgerFilter !== 'all') r = r.filter((x) => x.type === ledgerFilter);
    return r.slice(0, displayLimit);
  }, [ledgerRows, ledgerFilter, displayLimit]);

  const selectedAcct = useMemo(() => memberAccounts.find((a) => a.id === selectedAccountId), [memberAccounts, selectedAccountId]);
  const handleReachEnd = useCallback(() => setDisplayLimit((p) => Math.min(p + 20, searchFilteredAll.length)), [searchFilteredAll.length]);

  return {
    memberId, member, memberAccounts, selectedAccountId, setSelectedAccountId, accountsOpen, setAccountsOpen, displayLimit, setDisplayLimit, isDesktop,
    ledgerFilter, setLedgerFilter, ledgerQuery, setLedgerQuery, tagFilter, setTagFilter, knownTags, ledgerTagOptions,
    sortOrder, setSortOrder,
    totalBalance, totalIncome, totalExpenses, memberTxs, accountTxs, sortedTxs, filteredTxs, searchFilteredAll, ledgerRows, filteredLedger, selectedAcct, handleReachEnd,
    members, accounts, transactions, locale, currency, debouncedLedgerQuery,
  };
}
