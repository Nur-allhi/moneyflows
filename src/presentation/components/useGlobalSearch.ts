import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useAccountStore } from '../stores/useAccountStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { useTagStore } from '../stores/useTagStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useModalStore } from '../stores/useModalStore';
import { useOtherLedgerStore } from '../../otherLedgers/presentation/stores/useOtherLedgerStore';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { matchesAccount, matchesLoanStack, matchesTx } from '../utils/search';
import { formatAmount } from '../utils/format';

const TX_LIMIT = 6;
const ACCOUNT_LIMIT = 4;
const MEMBER_LIMIT = 4;
const LOAN_LIMIT = 3;
const GROUP_LIMIT = 3;
const TAG_LIMIT = 4;
const LEDGER_LIMIT = 3;

export interface GlobalSearchItem {
  key: string;
  title: string;
  sub?: string;
  run: () => void;
}

export interface GlobalSearchSection {
  label: string;
  items: GlobalSearchItem[];
}

/**
 * Global search across every entity. Reads the shared header query from
 * `useSearchStore` (same store the dashboard filters on) and returns grouped
 * results with keyboard navigation. Ledger-local `ledgerQuery` states are
 * untouched — this hook never writes to them.
 */
export function useGlobalSearch() {
  const navigate = useNavigate();
  const query = useSearchStore((s) => s.query);
  const debounced = useDebouncedValue(query.trim(), 200);
  const [activeIndex, setActiveIndex] = useState(0);
  const [groupList, setGroupList] = useState<{ id: string; name: string; count: number }[]>([]);

  const { locale, currency } = useSettingsStore((s) => s.settings);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const members = useMemberStore((s) => s.members);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  const transactions = useTransactionStore((s) => s.transactions);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const loanStacks = useLoanStore((s) => s.loanStacks);
  const fetchLoanStacks = useLoanStore((s) => s.fetchLoanStacks);
  const tags = useTagStore((s) => s.tags);
  const ledgers = useOtherLedgerStore((s) => s.ledgers);
  const fetchLedgers = useOtherLedgerStore((s) => s.fetchLedgers);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void fetchAccounts();
    void fetchTransactions({});
    void fetchMembers();
    void fetchLoanStacks();
    void fetchLedgers();
    getDatabase()
      .getAccountGroupsWithMembers()
      .then((gs) => setGroupList(gs.map((g) => ({ id: g.id, name: g.name, count: g.accountIds.length }))))
      .catch(() => {});
  }, [fetchAccounts, fetchTransactions, fetchMembers, fetchLoanStacks, fetchLedgers]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debounced]);

  const sections = useMemo<GlobalSearchSection[]>(() => {
    if (!debounced) return [];
    const ql = debounced.toLowerCase();
    const accountMap = new Map(accounts.map((a) => [a.id, { name: a.name }]));
    const memberMap = new Map(members.map((m) => [m.id, { name: m.name }]));
    const memberById = new Map(members.map((m) => [m.id, m]));
    const out: GlobalSearchSection[] = [];

    const txHits = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((tx) => matchesTx(tx, debounced, { accountMap, memberMap }))
      .slice(0, TX_LIMIT);
    if (txHits.length > 0) {
      out.push({
        label: 'Transactions',
        items: txHits.map((tx) => {
          const acctName =
            (tx.destAccount ? accountMap.get(tx.destAccount)?.name : undefined) ??
            (tx.sourceAccount ? accountMap.get(tx.sourceAccount)?.name : undefined) ??
            '';
          return {
            key: `tx-${tx.id}`,
            title: tx.description,
            sub: acctName ? `${acctName} · ${formatAmount(tx.amount, locale, currency)}` : formatAmount(tx.amount, locale, currency),
            run: () => useModalStore.getState().open('transaction-detail', { transaction: tx }),
          };
        }),
      });
    }

    const acctHits = accounts
      .filter((a) => matchesAccount(a.name, a.memberId ? (memberById.get(a.memberId)?.name ?? '') : '', debounced))
      .slice(0, ACCOUNT_LIMIT);
    if (acctHits.length > 0) {
      out.push({
        label: 'Accounts',
        items: acctHits.map((a) => ({
          key: `acct-${a.id}`,
          title: a.name,
          sub: a.memberId ? (memberById.get(a.memberId)?.name ?? '') : undefined,
          run: () => {
            if (a.memberId) navigate(`/member/${a.memberId}`);
            else if (a.type === 'counterparty') navigate('/loans');
            else navigate('/member');
          },
        })),
      });
    }

    const memberHits = members.filter((m) => m.name.toLowerCase().includes(ql)).slice(0, MEMBER_LIMIT);
    if (memberHits.length > 0) {
      out.push({
        label: 'Members',
        items: memberHits.map((m) => ({
          key: `member-${m.id}`,
          title: m.name,
          sub: m.isExternal ? 'External' : undefined,
          run: () => navigate(`/member/${m.id}`),
        })),
      });
    }

    const loanHits = loanStacks.filter((s) => matchesLoanStack(s.debtorName, debounced)).slice(0, LOAN_LIMIT);
    if (loanHits.length > 0) {
      out.push({
        label: 'Loans',
        items: loanHits.map((s) => ({
          key: `loan-${s.debtorId}`,
          title: s.debtorName,
          sub: `${formatAmount(s.totalOutstanding, locale, currency)} outstanding`,
          run: () => navigate(`/loans/${s.debtorId}`),
        })),
      });
    }

    const groupHits = groupList.filter((g) => g.name.toLowerCase().includes(ql)).slice(0, GROUP_LIMIT);
    if (groupHits.length > 0) {
      out.push({
        label: 'Groups',
        items: groupHits.map((g) => ({
          key: `group-${g.id}`,
          title: g.name,
          sub: `${g.count} accounts`,
          run: () => navigate(`/groups/${g.id}`),
        })),
      });
    }

    const tagHits = tags.filter((t) => t.toLowerCase().includes(ql)).slice(0, TAG_LIMIT);
    if (tagHits.length > 0) {
      out.push({
        label: 'Tags',
        items: tagHits.map((t) => ({
          key: `tag-${t}`,
          title: `#${t}`,
          run: () => navigate(`/tags/${encodeURIComponent(t)}`),
        })),
      });
    }

    const ledgerHits = ledgers
      .filter(
        (l) => l.name.toLowerCase().includes(ql) || (l.ownerName ?? '').toLowerCase().includes(ql),
      )
      .slice(0, LEDGER_LIMIT);
    if (ledgerHits.length > 0) {
      out.push({
        label: 'Other Ledgers',
        items: ledgerHits.map((l) => ({
          key: `ledger-${l.id}`,
          title: l.name,
          sub: l.ownerName ?? (l.ownerMemberId ? (memberById.get(l.ownerMemberId)?.name ?? '') : undefined),
          run: () => navigate(`/other-ledgers/${l.id}`),
        })),
      });
    }

    return out;
  }, [debounced, accounts, members, transactions, loanStacks, tags, ledgers, groupList, locale, currency, navigate]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const total = flat.length;

  const move = (delta: number) => {
    if (flat.length === 0) return;
    setActiveIndex((i) => Math.min(Math.max(i + delta, 0), flat.length - 1));
  };

  const selectActive = (): boolean => {
    const item = flat[activeIndex];
    if (!item) return false;
    item.run();
    return true;
  };

  return { query, debounced, sections, flat, total, activeIndex, setActiveIndex, move, selectActive };
}
