import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useMemberStore } from '../../../presentation/stores/useMemberStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { formatAmount } from '../../../presentation/utils/format';
import { shortDate } from '../../../presentation/constants/dates';
import { AddEntryModal } from '../components/AddEntryModal';

export function OtherLedgerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ledgers, entriesByLedger, fetchLedgers, fetchEntries, deleteEntry } = useOtherLedgerStore();
  const members = useMemberStore((s) => s.members);
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { fetchLedgers(); }, [fetchLedgers]);
  useEffect(() => { if (id) fetchEntries(id); }, [id, fetchEntries]);
  const ledger = useMemo(() => ledgers.find((l) => l.id === id), [ledgers, id]);
  const entries = useMemo(() => (id ? entriesByLedger[id] ?? [] : []), [id, entriesByLedger]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.description.toLowerCase().includes(q) || e.date.includes(q) || String(e.debit).includes(q) || String(e.credit).includes(q));
  }, [entries, search]);

  const currentBalance = entries.length > 0 ? entries[entries.length - 1]!.balance : ledger?.openingBalance ?? 0;

  const downloadPdf = () => {
    if (!ledger) return;
    const doc = new jsPDF();
    doc.text(`${ledger.name} — ${ledger.startingDate}`, 14, 14);
    autoTable(doc, {
      head: [['Date', 'Description', 'Debit', 'Credit', 'Balance']],
      body: filtered.map((r) => [r.date, r.description, r.debit ? formatAmount(r.debit, locale, currency) : '', r.credit ? formatAmount(r.credit, locale, currency) : '', formatAmount(r.balance, locale, currency)]),
      startY: 20,
      styles: { fontSize: 8, overflow: 'linebreak' },
    });
    doc.save(`other_ledger_${ledger.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!ledger) return <div style={{ padding: 24, color: 'var(--color-text-secondary)' }}>Ledger not found <button onClick={() => navigate('/other-ledgers')} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button></div>;

  const owner = ledger.ownerType === 'member' ? memberMap.get(ledger.ownerMemberId ?? '') ?? 'Unknown' : ledger.ownerName ?? '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
      <button onClick={() => navigate('/other-ledgers')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>← Back to Other Ledgers</button>
      <div style={{ padding: 16, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>{ledger.name}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{owner} · Starting {shortDate(ledger.startingDate, locale)} · {entries.length} entries</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>{formatAmount(currentBalance, locale, currency)}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 9999, background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>+ Add Entry</button>
            <button onClick={downloadPdf} style={{ padding: '8px 12px', borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>PDF</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 9999, padding: '8px 12px' }}>
          <input placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)' }} />
        </div>
      </div>

      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 90px 110px 80px', gap: 8, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
          <span>Date</span><span>Description</span><span>Debit</span><span>Credit</span><span>Balance</span><span />
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>{search ? `No matches for "${search}"` : 'No entries yet — tap + to add first row.'}</div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 90px 110px 80px', gap: 8, padding: '10px 12px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{shortDate(r.date, locale)}</span>
              <span style={{ color: 'var(--color-text)' }}>{r.description}</span>
              <span style={{ color: 'var(--color-expense)' }}>{r.debit ? formatAmount(r.debit, locale, currency) : '—'}</span>
              <span style={{ color: 'var(--color-income)' }}>{r.credit ? formatAmount(r.credit, locale, currency) : '—'}</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-text)' }}>{formatAmount(r.balance, locale, currency)}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditId(r.id)} style={{ width: 28, height: 28, borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✎</button>
                <button onClick={async () => { if (window.confirm('Delete entry?')) await deleteEntry(r.id); }} style={{ width: 28, height: 28, borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
              </span>
            </div>
          ))
        )}
      </div>
      {showAdd && id && <AddEntryModal isOpen ledgerId={id} onClose={() => setShowAdd(false)} />}
      {editId && id && <AddEntryModal isOpen ledgerId={id} entryId={editId} onClose={() => setEditId(null)} />}
    </div>
  );
}
