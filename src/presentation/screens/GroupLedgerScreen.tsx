/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LedgerTable, LedgerSearch } from '../components';
import { useModalStore } from '../stores/useModalStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import styles from './GroupLedgerScreen.module.css';
import { useGroupData } from './groupLedger/useGroupData';

const TX_TABS = [{ key: 'all', label: 'All' }, { key: 'income', label: 'Income' }, { key: 'expense', label: 'Expense' }, { key: 'transfer', label: 'Transfer' }, { key: 'loan', label: 'Loan' }];

export function GroupLedgerScreen() {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { groupName, accounts, loading, typeFilter, setTypeFilter, query, setQuery, displayLimit, setDisplayLimit, isDesktop, displayTxs, filteredTxs } = useGroupData();

  if (loading) return <div className={styles.groupLedger}><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>;

  return (
    <div className={styles.groupLedger}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>&#8592; Back</button>
      <h2 className={styles.title}>{groupName || 'Group Ledger'}</h2>
      <div className={styles.toolbar}>
        <LedgerSearch value={query} onChange={setQuery} />
        <div className={styles.tabs}>{TX_TABS.map((t) => <button key={t.key} className={`${styles.tab} ${typeFilter === t.key ? styles.active : ''}`} onClick={() => setTypeFilter(t.key)}>{t.label}</button>)}</div>
      </div>
      <LedgerTable rows={displayTxs.map((tx) => ({ id: tx.id, date: tx.date, description: tx.description, balance: String(tx.amount), type: tx.type as any })) as any} desktop={isDesktop} showBalance={false} onRowClick={(row) => useModalStore.getState().open('transaction-detail', { transaction: displayTxs.find((x) => x.id === row.id) })} sentinel={<div ref={sentinelRef} style={{ height: 1 }} />} />
      {displayLimit < filteredTxs.length && <button className={styles.loadMore} onClick={() => setDisplayLimit((p) => p + 10)}>Load more ({filteredTxs.length - displayLimit} remaining)</button>}
      <div className={styles.summary}>Total: {formatAmount(displayTxs.reduce((s, t) => s + t.amount, 0), locale, currency)} · {accounts.length} accounts</div>
    </div>
  );
}
