import { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../../../presentation/components';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useTagStore } from '../../../presentation/stores/useTagStore';

export function AddEntryModal({ isOpen, ledgerId, entryId, onClose }: { isOpen: boolean; ledgerId: string; entryId?: string; onClose: () => void }) {
  const { entriesByLedger, createEntry, updateEntry } = useOtherLedgerStore();
  const tags = useTagStore((s) => s.tags);
  const addTag = useTagStore((s) => s.addTag);
  const existing = entryId ? (entriesByLedger[ledgerId] ?? []).find((e) => e.id === entryId) : undefined;
  const [date, setDate] = useState(() => existing?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(() => existing?.description ?? '');
  const [amount, setAmount] = useState(() => existing ? String(existing.debit || existing.credit) : '');
  const [side, setSide] = useState<'debit' | 'credit'>(() => (existing?.credit ? 'credit' : 'debit'));
  const [tag, setTag] = useState(() => (existing?.metadata?.tags as string[] | undefined)?.[0] ?? '');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSave = async () => {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Amount must be > 0'); return; }
    if (!description.trim()) { setError('Description required'); return; }
    if (!date) { setError('Date required'); return; }
    try {
      if (tag) addTag(tag);
      const payload = { date, description: description.trim(), debit: side === 'debit' ? amt : 0, credit: side === 'credit' ? amt : 0, tags: tag ? [tag] : [] };
      if (existing) {
        await updateEntry(existing.id, { ...existing, ...payload, metadata: { ...existing.metadata, tags: tag ? [tag] : [] } } as unknown as Record<string, unknown> as never);
      } else {
        await createEntry({ ledgerId, ...payload });
      }
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const form = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setSide('debit')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: side === 'debit' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: side === 'debit' ? 'var(--color-primary)' : 'var(--color-surface)', color: side === 'debit' ? 'white' : 'var(--color-text)' }}>Debit</button>
        <button onClick={() => setSide('credit')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: side === 'credit' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: side === 'credit' ? 'var(--color-primary)' : 'var(--color-surface)', color: side === 'credit' ? 'white' : 'var(--color-text)' }}>Credit</button>
      </div>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (1–200)" maxLength={200} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowTagPicker((v) => !v)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', textAlign: 'left' }}>{tag || 'Tag (optional)'}</button>
        {showTagPicker && (
          <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, backdropFilter: 'blur(24px)', zIndex: 350, maxHeight: 180, overflowY: 'auto' }}>
            <button onClick={() => { setTag(''); setShowTagPicker(false); }} style={{ width: '100%', padding: 10, textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--color-text)' }}>No tag</button>
            {tags.map((t) => <button key={t} onClick={() => { setTag(t); setShowTagPicker(false); }} style={{ width: '100%', padding: 10, textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--color-text)' }}>{t}</button>)}
          </div>
        )}
      </div>
      {error && <div style={{ color: 'var(--color-expense)', fontSize: 13 }}>{error}</div>}
    </div>
  );
  if (isMobile) return <BottomSheet isOpen={isOpen} onClose={onClose} title={existing ? 'Edit Entry' : 'Add Entry'}>{form}<div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)' }}>Cancel</button><button onClick={handleSave} style={{ flex: 1, padding: 10, borderRadius: 9999, background: 'var(--color-primary)', color: 'white', border: 'none' }}>{existing ? 'Save' : 'Add'}</button></div></BottomSheet>;
  return <Modal isOpen={isOpen} onClose={onClose} title={existing ? 'Edit Entry' : 'Add Entry'} onSave={handleSave} saveLabel={existing ? 'Save' : 'Add'}>{form}</Modal>;
}
