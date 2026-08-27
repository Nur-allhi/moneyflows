import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useMemberStore } from '../../../presentation/stores/useMemberStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { formatAmount } from '../../../presentation/utils/format';
import { Highlight } from '../../../presentation/utils/highlight';
import { CreateLedgerModal } from '../components/CreateLedgerModal';
import { AddEntryModal } from '../components/AddEntryModal';
import styles from './OtherLedgersIndex.module.css';

function ledgerGradient(name: string): string {
  const hues = [290, 170, 30, 85, 220, 330, 50, 190];
  let idx = 0;
  for (let i = 0; i < name.length; i++) idx = (idx * 31 + name.charCodeAt(i)) % hues.length;
  const h = hues[idx]!;
  return `linear-gradient(135deg, oklch(62% 0.22 ${h}), oklch(50% 0.2 ${h}))`;
}

export function OtherLedgersIndex() {
  const navigate = useNavigate();
  const { ledgers, entriesByLedger, loading, fetchLedgers, fetchEntries } = useOtherLedgerStore();
  const members = useMemberStore((s) => s.members);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEntryPicker, setShowEntryPicker] = useState(false);
  const [entryLedgerId, setEntryLedgerId] = useState<string | null>(null);

  useEffect(() => { fetchLedgers(); fetchMembers(); }, [fetchLedgers, fetchMembers]);
  useEffect(() => {
    ledgers.forEach((l) => {
      if (!entriesByLedger[l.id]) fetchEntries(l.id);
    });
  }, [ledgers, entriesByLedger, fetchEntries]);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ledgers;
    return ledgers.filter((l) => {
      const owner = l.ownerType === 'member' ? memberMap.get(l.ownerMemberId ?? '')?.name ?? '' : l.ownerName ?? '';
      return l.name.toLowerCase().includes(q) || owner.toLowerCase().includes(q);
    });
  }, [ledgers, search, memberMap]);

  const getBalance = (ledgerId: string, opening: number) => {
    const entries = entriesByLedger[ledgerId] ?? [];
    if (entries.length === 0) return opening;
    const last = entries[entries.length - 1];
    return last ? last.balance : opening;
  };

  const getCount = (ledgerId: string) => (entriesByLedger[ledgerId] ?? []).length;

  if (loading && ledgers.length === 0) {
    return <div className={styles.page}><div className={styles.grid}>{[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-card" />)}</div></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <span className={styles.leftCount}>{filtered.length} ledger{filtered.length !== 1 ? 's' : ''}</span>
        <div className={styles.rightControls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <circle cx="7" cy="7" r="5.5" /><path d="M11 11l3.5 3.5" />
              </svg>
            </span>
            <input placeholder="Search ledgers..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6" /></svg></button>}
          </div>
          <button className={styles.addBtn} onClick={() => setShowEntryPicker(true)} title="Add entry">+ Entry</button>
          <button className={styles.addBtn} onClick={() => setShowCreate(true)}>+ New Ledger</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>{search ? `No matches for "${search}"` : 'No ledgers yet. Create your first register.'}</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((l) => {
            const owner = l.ownerType === 'member' ? memberMap.get(l.ownerMemberId ?? '')?.name ?? 'Unknown' : l.ownerName ?? '—';
            const bal = getBalance(l.id, l.openingBalance);
            return (
              <button key={l.id} className={styles.card} onClick={() => navigate(`/other-ledgers/${l.id}`)}>
                <span className={styles.cardLeft}>
                  <span className={styles.cardAvatar} style={{ background: ledgerGradient(l.name) }}>{(l.name[0] ?? 'O').toUpperCase()}</span>
                  <span className={styles.cardInfo}>
                    <span className={styles.cardName}><Highlight text={l.name} query={search} /></span>
                    <span className={styles.cardTag}>{owner} · {getCount(l.id)} entries · {l.startingDate}</span>
                  </span>
                </span>
                <span className={styles.cardBalance}>{formatAmount(bal, locale, currency)}</span>
              </button>
            );
          })}
        </div>
      )}

      {showCreate && <CreateLedgerModal isOpen onClose={() => setShowCreate(false)} onCreated={() => setShowCreate(false)} />}
      {showEntryPicker && (
        <div className={styles.pickerOverlay} onClick={() => setShowEntryPicker(false)}>
          <div className={styles.pickerSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerTitle}>Choose ledger</div>
            <div className={styles.pickerList}>
              {ledgers.map((l) => (
                <button key={l.id} className={styles.pickerItem} onClick={() => { setEntryLedgerId(l.id); setShowEntryPicker(false); }}>{l.name}</button>
              ))}
              {ledgers.length === 0 && <div className={styles.empty}>No ledgers — create one first</div>}
            </div>
          </div>
        </div>
      )}
      {entryLedgerId && <AddEntryModal isOpen ledgerId={entryLedgerId} onClose={() => setEntryLedgerId(null)} />}
    </div>
  );
}
