/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LedgerTable, LedgerSearch } from '../components';
import { useModalStore } from '../stores/useModalStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import styles from './GroupLedgerScreen.module.css';
import { useGroupData } from './groupLedger/useGroupData';

const TX_TABS = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'loan', label: 'Loan' },
];

export function GroupLedgerScreen() {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const d = useGroupData();
  const { groupName, accounts, loading, typeFilter, setTypeFilter, query, setQuery, displayLimit, setDisplayLimit, isDesktop, displayTxs, filteredTxs, totalBalance, accountIds } = d;
  const accountSet = new Set(accountIds);
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  if (loading) {
    return (
      <div className={styles.groupLedger}>
        <div className="skeleton skeleton-card" style={{ height: 300 }} />
      </div>
    );
  }

  const rows = displayTxs.map((tx) => {
    const isIncomeLike = tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay';
    const isExpenseLike = tx.type === 'expense' || tx.type === 'loan_issue' || tx.type === 'lend';
    const srcInGroup = accountSet.has(tx.sourceAccount ?? '');
    const dstInGroup = accountSet.has(tx.destAccount ?? '');
    const credit = dstInGroup && !srcInGroup;
    const debit = srcInGroup && !dstInGroup;
    const internal = srcInGroup && dstInGroup;
    const srcName = tx.sourceAccount ? accountMap.get(tx.sourceAccount)?.name ?? '?' : '?';
    const dstName = tx.destAccount ? accountMap.get(tx.destAccount)?.name ?? '?' : '?';
    const account = internal
      ? `(internal) ${srcName} → ${dstName}`
      : isIncomeLike
        ? dstName
        : isExpenseLike
          ? srcName
          : tx.type === 'transfer'
            ? `${srcName} → ${dstName}`
            : '?';
    const mappedType = tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : tx.type === 'transfer' ? 'transfer' : 'loan';
    return {
      id: tx.id,
      date: tx.date,
      description: tx.description,
      account,
      debit: credit ? '—' : String(tx.amount),
      credit: debit ? '—' : String(tx.amount),
      balance: '',
      type: mappedType,
    };
  });

  return (
    <div className={styles.groupLedger}>
      <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">← Back</button>
      <h2 className={styles.title}>{groupName || 'Group Ledger'}</h2>
      <div className={styles.toolbar}>
        <LedgerSearch value={query} onChange={setQuery} />
        <div className={styles.tabs}>
          {TX_TABS.map((t) => (
            <button key={t.key} className={`${styles.tab} ${typeFilter === t.key ? styles.active : ''}`} onClick={() => setTypeFilter(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <LedgerTable
        rows={rows as any}
        desktop={isDesktop}
        showBalance={false}
        onRowClick={(row) => useModalStore.getState().open('transaction-detail', { transaction: displayTxs.find((x) => x.id === row.id) })}
        sentinel={<div ref={sentinelRef} style={{ height: 1 }} />}
      />
      {displayLimit < filteredTxs.length && (
        <button className={styles.loadMore} onClick={() => setDisplayLimit((p) => p + 10)}>
          Load more ({filteredTxs.length - displayLimit} remaining)
        </button>
      )}
      <div className={styles.summary}>
        Group Total: {formatAmount(totalBalance, locale, currency)} · {accounts.length} accounts
      </div>
    </div>
  );
}
