/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import type { Transaction } from '../../../core/domain/Transaction';
import type { Account } from '../../../core/domain/Account';
import type { TransactionFilter } from '../../../core/ports/IDatabaseService';
import { useDebouncedValue } from '../../utils/useDebouncedValue';
import { matchesTx } from '../../utils/search';

export function useGroupData() {
  const { groupId } = useParams<{ groupId: string }>();
  const [groupName, setGroupName] = useState('');
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 200);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  useEffect(() => {
    if (!groupId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const db = getDatabase();
      const groups = await db.getAccountGroupsWithMembers();
      const g = groups.find((x) => x.id === groupId);
      if (!alive) return;
      setGroupName(g?.name ?? '');
      const ids = g?.accountIds ?? [];
      setAccountIds(ids);
      if (ids.length) {
        const allAccts = await db.getAccounts?.() ?? [];
        const filtered = (allAccts as Account[]).filter((a) => ids.includes(a.id));
        setAccounts(filtered);
        const allTxs = (await db.getTransactions?.({} as TransactionFilter)) ?? [] as Transaction[];
        setTxs((allTxs as Transaction[]).filter((t) => ids.includes(t.sourceAccount ?? '') || ids.includes(t.destAccount ?? '')));
      } else { setAccounts([]); setTxs([]); }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [groupId]);

  const filteredTxs = useMemo(() => {
    let r = txs;
    if (typeFilter !== 'all') r = r.filter((t) => t.type === typeFilter || (typeFilter === 'loan' && ['lend','repay','loan_issue','loan_repayment'].includes(t.type)));
    if (debouncedQuery) {
      const map = new Map(accounts.map((a) => [a.id, { name: a.name }]));
      r = r.filter((tx) => matchesTx(tx, debouncedQuery, { accountMap: map }));
    }
    return [...r].sort((a,b) => b.date.localeCompare(a.date));
  }, [txs, typeFilter, debouncedQuery, accounts]);

  const displayTxs = useMemo(() => filteredTxs.slice(0, displayLimit), [filteredTxs, displayLimit]);

  const accountSet = useMemo(() => new Set(accountIds), [accountIds]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const isGroupDebit = useCallback((t: { sourceAccount?: string }) => accountSet.has(t.sourceAccount ?? ''), [accountSet]);
  const isGroupCredit = useCallback((t: { destAccount?: string }) => accountSet.has(t.destAccount ?? ''), [accountSet]);
  const totalBalance = useMemo(() => accounts.filter((a) => accountSet.has(a.id)).reduce((s, a) => s + a.balance, 0), [accounts, accountSet]);
  const resolveAccountDisplay = useCallback((tx: any): string => {
    if (tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay') {
      return tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? '?') : '?';
    }
    if (tx.type === 'expense' || tx.type === 'loan_issue' || tx.type === 'lend') {
      return tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '?') : '?';
    }
    if (tx.type === 'transfer') {
      const src = tx.sourceAccount ? (accountMap.get(tx.sourceAccount)?.name ?? '?') : '?';
      const dst = tx.destAccount ? (accountMap.get(tx.destAccount)?.name ?? '?') : '?';
      return `${src} \u2192 ${dst}`;
    }
    return '?';
  }, [accountMap]);
  const ledgerRows = useMemo(() => {
    let running = totalBalance;
    const sorted = [...filteredTxs].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(0, displayLimit).map((tx) => {
      const credit = isGroupCredit(tx) && !isGroupDebit(tx);
      const debit = isGroupDebit(tx) && !isGroupCredit(tx);
      if (credit) running -= tx.amount; else if (debit) running += tx.amount;
      const internal = isGroupDebit(tx) && isGroupCredit(tx);
      return {
        id: tx.id, date: tx.date, description: tx.description,
        account: internal ? `(internal) ${resolveAccountDisplay(tx)}` : resolveAccountDisplay(tx),
        debit: credit ? '\u2014' : tx.amount.toString(),
        credit: debit ? '\u2014' : tx.amount.toString(),
        balance: running.toString(),
        type: (tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : tx.type === 'transfer' ? 'transfer' : 'loan') as any,
      };
    });
  }, [filteredTxs, displayLimit, totalBalance, isGroupCredit, isGroupDebit, resolveAccountDisplay]);

  return { groupId, groupName, accountIds, accounts, txs, loading, typeFilter, setTypeFilter, query, setQuery, displayLimit, setDisplayLimit, isDesktop, filteredTxs, displayTxs, ledgerRows, totalBalance };
}
