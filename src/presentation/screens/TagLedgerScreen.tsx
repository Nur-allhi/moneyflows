import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTagStore } from '../stores/useTagStore';
import { formatAmount } from '../utils/format';
import { useSettingsStore } from '../stores/useSettingsStore';
import styles from './TagLedgerScreen.module.css';

const CREDIT_TYPES = new Set(['income', 'loan_repayment', 'repay', 'loan_received']);

function hasTag(tx: { metadata?: Record<string, unknown> }, tag: string): boolean {
  const tags = tx.metadata?.tags;
  return Array.isArray(tags) && tags.includes(tag);
}

export function TagLedgerScreen() {
  const navigate = useNavigate();
  const { tag } = useParams<{ tag: string }>();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const knownTags = useTagStore((s) => s.tags);
  const { transactions, fetchTransactions } = useTransactionStore();
  const { members, fetchMembers } = useMemberStore();
  const { accounts, fetchAccounts } = useAccountStore();

  useEffect(() => {
    fetchTransactions();
    fetchMembers();
    fetchAccounts();
  }, [fetchTransactions, fetchMembers, fetchAccounts]);

  const memberName = (id?: string) =>
    id ? members.find((m) => m.id === id)?.name ?? '(deleted member)' : '';
  const accountLabel = (id?: string) => {
    if (!id) return '';
    const acct = accounts.find((a) => a.id === id);
    return acct ? `${acct.name}` : '(deleted account)';
  };

  const tagged = useMemo(
    () => transactions.filter((tx) => tag && hasTag(tx, tag)),
    [transactions, tag],
  );

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    transactions.forEach((tx) => {
      if (!Array.isArray(tx.metadata?.tags)) return;
      (tx.metadata.tags as string[]).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    });
    knownTags.forEach((t) => { if (!counts.has(t)) counts.set(t, 0); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [transactions, knownTags]);

  const totalIn = tagged
    .filter((tx) => CREDIT_TYPES.has(tx.type))
    .reduce((s, tx) => s + tx.amount, 0);
  const totalOut = tagged
    .filter((tx) => !CREDIT_TYPES.has(tx.type))
    .reduce((s, tx) => s + tx.amount, 0);

  const sorted = [...tagged].sort((a, b) => b.date.localeCompare(a.date));

  if (!tag) {
    return (
      <div className={styles.page}>
        <h2 className={styles.heading}>Tags</h2>
        {tagCounts.length === 0 ? (
          <p className={styles.empty}>No tags yet. Add one while creating a transaction.</p>
        ) : (
          <div className={styles.tagGrid}>
            {tagCounts.map(([name, count]) => (
              <button key={name} className={styles.tagCard} onClick={() => navigate(`/tags/${encodeURIComponent(name)}`)}>
                <span className={styles.tagName}>{name}</span>
                <span className={styles.tagCount}>{count} transaction{count === 1 ? '' : 's'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/tags')}>← All tags</button>
      <h2 className={styles.heading}>
        #{tag}
        <span className={styles.sub}> {tagged.length} transaction{tagged.length === 1 ? '' : 's'} · across all members</span>
      </h2>
      <div className={styles.totals}>
        <span>In +{formatAmount(totalIn, locale, currency)}</span>
        <span>Out −{formatAmount(totalOut, locale, currency)}</span>
      </div>
      {sorted.length === 0 ? (
        <p className={styles.empty}>No transactions carry this tag.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Date</th><th>Member</th><th>Account</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              {sorted.map((tx) => {
                const credit = CREDIT_TYPES.has(tx.type);
                return (
                  <tr key={tx.id}>
                    <td>{tx.date.slice(0, 10)}</td>
                    <td>{memberName(tx.memberId)}</td>
                    <td>{credit ? accountLabel(tx.destAccount ?? tx.sourceAccount) : accountLabel(tx.sourceAccount ?? tx.destAccount)}</td>
                    <td>{tx.description}</td>
                    <td className={`${styles.amt} ${credit ? styles.in : styles.out}`}>
                      {credit ? '+' : '−'}{formatAmount(tx.amount, locale, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
