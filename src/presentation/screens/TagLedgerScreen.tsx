import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTagStore } from '../stores/useTagStore';
import { formatAmount } from '../utils/format';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Highlight } from '../utils/highlight';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { matchesTx } from '../utils/search';
import { shortDate } from '../constants/dates';
import { useReplay } from '../hooks/useReplay';
import { LedgerSearch } from '../components';
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
  const [addTagKey, replayAddTag] = useReplay();
  const [renameKey, replayRename] = useReplay();
  const [pickedRename, setPickedRename] = useState<string | null>(null);
  const [saveKey, replaySave] = useReplay();
  const [cancelKey, replayCancel] = useReplay();
  const [noKey, replayNo] = useReplay();
  const [yesKey, replayYes] = useReplay();
  const [openKey, replayOpen] = useReplay();
  const [pickedOpen, setPickedOpen] = useState<string | null>(null);
  const [delKey, replayDel] = useReplay();
  const [pickedDel, setPickedDel] = useState<string | null>(null);
  const [backKey, replayBack] = useReplay();
  const [delEmptyKey, replayDelEmpty] = useReplay();

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

  const [ledgerQuery, setLedgerQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const debouncedLedgerQuery = useDebouncedValue(ledgerQuery, 200);
  const filteredSorted = useMemo(() => {
    const ordered = sortOrder === 'desc' ? sorted : [...sorted].reverse();
    if (!debouncedLedgerQuery.trim()) return ordered;
    const memberMap = new Map(members.map((m) => [m.id, { name: m.name }]));
    const accountMap = new Map(accounts.map((a) => [a.id, { name: a.name }]));
    return ordered.filter((tx) =>
      matchesTx(tx, debouncedLedgerQuery, {
        memberMap,
        accountMap,
        shortDateFn: (iso) => shortDate(iso, locale),
      }),
    );
  }, [sorted, sortOrder, debouncedLedgerQuery, members, accounts, locale]);

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
          <button className={`${styles.addBtn} ${addTagKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayAddTag(); void handleCreate(); }} disabled={!newName.trim()}>
            <span className="anim-target" key={addTagKey}>Add tag</span>
          </button>
        </div>

        {tagCounts.length === 0 ? (
          <p className={styles.empty}>No tags yet — create one above or attach it while adding a transaction.</p>
        ) : (
          <div className={styles.tagGrid}>
            {tagCounts.map(([name, count]) => (
              <div
                key={name}
                className={`${styles.tagCard} ${styles.tagCardClickable}`}
                onClick={() => {
                  if (renaming === name || deleting === name || count === 0) return;
                  navigate(`/tags/${encodeURIComponent(name)}`);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renaming !== name && deleting !== name && count > 0) {
                    navigate(`/tags/${encodeURIComponent(name)}`);
                  }
                }}
              >
                {count > 0 && renaming !== name && deleting !== name && (
                  <button
                    className={`${styles.tagRenameBtn} ${pickedRename === name && renameKey > 0 ? 'anim-swap' : ''}`}
                    title="Rename tag"
                    aria-label={`Rename ${name}`}
                    onClick={(e) => { replayRename(); setPickedRename(name); e.stopPropagation(); setRenaming(name); setRenameValue(name); }}
                  >
                    <svg key={`${name}-${pickedRename === name ? renameKey : 0}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                  </button>
                )}
                {renaming === name ? (
                  <div className={styles.renameRow}>
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      maxLength={30}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleRename(name); if (e.key === 'Escape') setRenaming(null); }}
                    />
                    <div className={styles.renameActions}>
                      <button className={`${styles.actBtn} ${saveKey > 0 ? 'anim-pop' : ''}`} aria-label="Save name" title="Save"
                        onClick={(e) => { replaySave(); e.stopPropagation(); void handleRename(name); }}>
                        <svg key={saveKey} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button className={`${styles.actBtn} ${cancelKey > 0 ? 'anim-twist' : ''}`} aria-label="Cancel" title="Cancel"
                        onClick={(e) => { replayCancel(); e.stopPropagation(); setRenaming(null); }}>
                        <svg key={cancelKey} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>
                      </button>
                    </div>
                  </div>
                ) : deleting === name ? (
                  <div className={styles.deleteRow}>
                    <span className={styles.deleteText}>
                      {count === 0
                        ? 'Delete this unused tag?'
                        : `Remove this tag from ${count} transaction${count === 1 ? '' : 's'}?`}
                    </span>
                    <div className={styles.deleteActions}>
                      <button className={`${styles.cancelBtn} ${noKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayNo(); setDeleting(null); }}><span className="anim-target" key={noKey}>No</span></button>
                      <button className={`${styles.confirmBtn} ${yesKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayYes(); void handleDelete(name); }}><span className="anim-target" key={yesKey}>Yes, remove</span></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className={styles.tagName}>{name}</span>
                    <span className={styles.tagCount}>{count} transaction{count === 1 ? '' : 's'}</span>
                    <div className={styles.cardActions}>
                      <button
                        className={`${styles.openBtn} ${pickedOpen === name && openKey > 0 ? 'anim-pop' : ''}`}
                        onClick={(e) => { replayOpen(); setPickedOpen(name); e.stopPropagation(); navigate(`/tags/${encodeURIComponent(name)}`); }}
                        disabled={count === 0}
                      >
                        <span className="anim-target" key={`${name}-${pickedOpen === name ? openKey : 0}`}>Open ledger</span>
                      </button>
                      <button className={`${styles.actBtn} ${styles.actDanger} ${pickedDel === name && delKey > 0 ? 'anim-twist' : ''}`} title="Delete tag" aria-label={`Delete ${name}`}
                        onClick={(e) => { replayDel(); setPickedDel(name); e.stopPropagation(); setDeleting(name); }}>
                        <svg key={`${name}-${pickedDel === name ? delKey : 0}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
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
      <button className={`${styles.backBtn} ${backKey > 0 ? 'anim-nudge' : ''}`} onClick={() => { replayBack(); navigate('/tags'); }}><span className="anim-target" key={backKey}>← All tags</span></button>
      <h2 className={styles.heading}>
        #{tag}
        <span className={styles.sub}> {tagged.length} transaction{tagged.length === 1 ? '' : 's'} · across all members</span>
      </h2>
      <div className={styles.totals}>
        <span>In +{formatAmount(totalIn, locale, currency)}</span>
        <span>Out −{formatAmount(totalOut, locale, currency)}</span>
      </div>
      <div className={styles.filterRow}>
        <LedgerSearch value={ledgerQuery} onChange={setLedgerQuery} />
        <div className={styles.sortPills} role="group" aria-label="Sort order">
          <button
            type="button"
            className={`${styles.sortPill} ${sortOrder === 'desc' ? styles.sortPillActive : ''}`}
            onClick={() => setSortOrder('desc')}
            aria-pressed={sortOrder === 'desc'}
          >Newest first</button>
          <button
            type="button"
            className={`${styles.sortPill} ${sortOrder === 'asc' ? styles.sortPillActive : ''}`}
            onClick={() => setSortOrder('asc')}
            aria-pressed={sortOrder === 'asc'}
          >Oldest first</button>
        </div>
      </div>
      {filteredSorted.length === 0 ? (
        <p className={styles.empty}>
          {sorted.length === 0 ? (
            <>
              No transactions carry this tag anymore.{' '}
              <button className={`${styles.deleteInline} ${delEmptyKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayDelEmpty(); void handleDelete(tag!); }}>
                <span className="anim-target" key={delEmptyKey}>Delete this empty tag</span>
              </button>
            </>
          ) : (
            <>No matches for &ldquo;{ledgerQuery}&rdquo;</>
          )}
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Date</th><th>Member</th><th>Account</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              {filteredSorted.map((tx) => {
                const credit = CREDIT_TYPES.has(tx.type);
                return (
                  <tr key={tx.id}>
                    <td>{shortDate(tx.date, locale)}</td>
                    <td><Highlight text={memberName(tx.memberId)} query={ledgerQuery} /></td>
                    <td><Highlight text={credit ? accountLabel(tx.destAccount ?? tx.sourceAccount) : accountLabel(tx.sourceAccount ?? tx.destAccount)} query={ledgerQuery} /></td>
                    <td><Highlight text={tx.description} query={ledgerQuery} /></td>
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
