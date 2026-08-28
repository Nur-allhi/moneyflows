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
import type { LedgerRow } from '../../components';

export function useMemberData() {
  const { id: memberId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
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
  const totalIncome = useMemo(() => memberTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [memberTxs]);
  const totalExpenses = useMemo(() => memberTxs.filter((t) => t.type === 'expense' || t.type === 'loan_issue' || t.type === 'lend').reduce((s, t) => s + t.amount, 0), [memberTxs]);
  const sortedTxs = useMemo(() => [...accountTxs].sort((a, b) => a.date.localeCompare(b.date)), [accountTxs]);
  const debouncedLedgerQuery = useDebouncedValue(ledgerQuery, 200);
  const accountMapForSearch = useMemo(() => new Map(accounts.map((a) => [a.id, { name: a.name }])), [accounts]);

  const searchFilteredAll = useMemo(() => {
    let r = sortedTxs;
    if (debouncedLedgerQuery.trim()) r = r.filter((t) => matchesTx(t, debouncedLedgerQuery, { accountMap: accountMapForSearch }));
    if (tagFilter) r = r.filter((t) => (t.metadata as Record<string, unknown>)?.tags && ((t.metadata as { tags: string[] }).tags.includes(tagFilter)));
    return r;
  }, [sortedTxs, debouncedLedgerQuery, tagFilter, accountMapForSearch]);

  const filteredTxs = useMemo(() => searchFilteredAll.slice(0, displayLimit), [searchFilteredAll, displayLimit]);
  const ledgerTagOptions = useMemo(() => {
    const s = new Set<string>();
    sortedTxs.forEach((t) => { const tags = (t.metadata as { tags?: string[] })?.tags; if (tags) tags.forEach((x) => s.add(x)); });
    return [...s].sort();
  }, [sortedTxs]);

  const ledgerRows: LedgerRow[] = useMemo(() => {
    let bal = 0; const rows: LedgerRow[] = [];
    const acctIds = new Set(memberAccounts.map((a) => a.id));
    const withBalance = sortedTxs.map((tx) => {
      const isCredit = tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay';
      const isRelevant = acctIds.has(tx.sourceAccount ?? '') || acctIds.has(tx.destAccount ?? '');
      if (isRelevant) bal += isCredit ? tx.amount : -tx.amount;
      return { tx, balance: bal };
    });
    for (const { tx, balance } of withBalance) {
      if (!searchFilteredAll.includes(tx)) continue;
      const mappedType: LedgerRow['type'] = tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : tx.type === 'transfer' ? 'transfer' : 'loan';
      const isCredit = tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay';
      const fmt = formatAmountParts(tx.amount, locale, currency);
      rows.push({ id: tx.id, date: tx.date, description: tx.description, balance: String(balance), currencyLabel: currency, type: mappedType, credit: isCredit ? fmt.amount : '', debit: !isCredit ? fmt.amount : '' } as unknown as LedgerRow);
    }
    return rows;
  }, [sortedTxs, memberAccounts, searchFilteredAll, locale, currency]);

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
    totalBalance, totalIncome, totalExpenses, memberTxs, accountTxs, sortedTxs, filteredTxs, searchFilteredAll, ledgerRows, filteredLedger, selectedAcct, handleReachEnd,
    members, accounts, transactions, locale, currency, debouncedLedgerQuery,
  };
}
