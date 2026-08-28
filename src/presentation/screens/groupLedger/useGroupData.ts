import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import type { Transaction } from '../../../core/domain/Transaction';
import type { Account } from '../../../core/domain/Account';
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
        const allTxs = await db.getTransactions?.({} as any) ?? [];
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

  return { groupId, groupName, accountIds, accounts, txs, loading, typeFilter, setTypeFilter, query, setQuery, displayLimit, setDisplayLimit, isDesktop, filteredTxs, displayTxs };
}
