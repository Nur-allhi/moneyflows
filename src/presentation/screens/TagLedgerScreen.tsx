import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTagStore } from '../stores/useTagStore';
import { formatAmount } from '../utils/format';
import { useSettingsStore } from '../stores/useSettingsStore';
import styles from './TagLedgerScreen.module.css';

const CREDIT_TYPES = new Set(['income', 'loan_repayment', 'repay', 'loan_received']);

function txHasTag(tx: { metadata?: Record<string, unknown> }, tag: string): boolean {
  const tags = tx.metadata?.tags;
  return Array.isArray(tags) && tags.includes(tag);
}

export function TagLedgerScreen() {
  const navigate = useNavigate();
  const { tag } = useParams<{ tag: string }>();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const knownTags = useTagStore((s) => s.tags);
  const addTag = useTagStore((s) => s.addTag);
  const removeTag = useTagStore((s) => s.removeTag);
  const renameTag = useTagStore((s) => s.renameTag);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const { transactions, fetchTransactions } = useTransactionStore();
  const { members, fetchMembers } = useMemberStore();
  const { accounts, fetchAccounts } = useAccountStore();

  useEffect(() => {
    fetchTransactions();
    fetchMembers();
    fetchAccounts();
  }, [fetchTransactions, fetchMembers, fetchAccounts]);

  // create / rename UI state
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  /** Rewrites the tag inside every matching transaction's metadata. */
  const applyToTxs = async (tag: string, transform: (tags: string[]) => string[]) => {
    const affected = transactions.filter((tx) => txHasTag(tx, tag));
    for (const tx of affected) {
      const current = Array.isArray(tx.metadata?.tags) ? (tx.metadata.tags as string[]) : [];
      const next = transform(current.filter((t) => t.toLowerCase() === tag.toLowerCase() || t !== tag));
      const metadata = { ...tx.metadata };
      if (next.length > 0) metadata.tags = next;
      else delete metadata.tags;
      await updateTransaction(tx.id, { ...tx, metadata });
    }
  };

  const handleCreate = async () => {
    const clean = newName.trim();
    if (!clean) return;
    addTag(clean);
    setNewName('');
  };

  const handleRename = async (oldName: string) => {
    const clean = renameValue.trim();
    if (!clean || clean.toLowerCase() === oldName.toLowerCase()) {
      setRenaming(null);
      return;
    }
    await applyToTxs(oldName, () => [clean]);
    if (tag === oldName) navigate(`/tags/${encodeURIComponent(clean)}`);
    renameTag(oldName, clean);
    setRenaming(null);
  };

  const handleDelete = async (name: string) => {
    await applyToTxs(name, () => []);
    removeTag(name);
    setDeleting(null);
    if (tag === name) navigate('/tags');
  };

  const tagged = useMemo(
    () => (tag ? transactions.filter((tx) => txHasTag(tx, tag)) : []),
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
        <div className={styles.createRow}>
          <input
            className={styles.createInput}
            value={newName}
            maxLength={30}
            placeholder="New tag name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { void handleCreate(); } }}
          />
          <button className={styles.addBtn} onClick={() => void handleCreate()} disabled={!newName.trim()}>
            Add tag
          </button>
        </div>

        {tagCounts.length === 0 ? (
          <p className={styles.empty}>No tags yet — create one above or attach it while adding a transaction.</p>
        ) : (
          <div className={styles.tagGrid}>
            {tagCounts.map(([name, count]) => (
              <div key={name} className={styles.tagCard}>
                {renaming === name ? (
                  <div className={styles.renameRow}>
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      maxLength={30}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleRename(name); if (e.key === 'Escape') setRenaming(null); }}
                    />
                    <button className={styles.iconBtn} onClick={() => void handleRename(name)} aria-label="Save name">✓</button>
                    <button className={styles.iconBtn} onClick={() => setRenaming(null)} aria-label="Cancel">✕</button>
                  </div>
                ) : (
                  <>
                    {deleting === name ? (
                      <div className={styles.deleteRow}>
                        <span className={styles.deleteText}>Remove from {count} transaction{count === 1 ? '' : 's'}?</span>
                        <button className={styles.confirmBtn} onClick={() => void handleDelete(name)}>Yes</button>
                        <button className={styles.cancelBtn} onClick={() => setDeleting(null)}>No</button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.tagName}>{name}</span>
                        <span className={styles.tagCount}>{count} transaction{count === 1 ? '' : 's'}</span>
                        <div className={styles.cardActions}>
                          <button
                            className={styles.openBtn}
                            onClick={() => navigate(`/tags/${encodeURIComponent(name)}`)}
                            disabled={count === 0}
                          >
                            Open ledger
                          </button>
                          <button className={styles.iconBtn} title="Rename" aria-label={`Rename ${name}`}
                            onClick={() => { setRenaming(name); setRenameValue(name); }}>
                            ✎
                          </button>
                          <button className={styles.iconBtnDanger} title="Delete tag" aria-label={`Delete ${name}`}
                            onClick={() => setDeleting(name)}>
                            🗑
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const memberName = (id?: string) =>
    id ? members.find((m) => m.id === id)?.name ?? '(deleted member)' : '';
  const accountLabel = (id?: string) => {
    if (!id) return '';
    const acct = accounts.find((a) => a.id === id);
    return acct ? `${acct.name}` : '(deleted account)';
  };

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
        <p className={styles.empty}>
          No transactions carry this tag anymore.
          {' '}
          <button className={styles.deleteInline} onClick={() => void handleDelete(tag)}>
            Delete this empty tag
          </button>
        </p>
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
