import { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../../../presentation/components';
import { DatePicker } from '../../../components/ui/date-picker';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useTagStore } from '../../../presentation/stores/useTagStore';
import txStyles from '../../../presentation/modals/TransactionFormModal.module.css';

export function AddEntryModal({ isOpen, ledgerId, entryId, onClose }: { isOpen: boolean; ledgerId: string; entryId?: string; onClose: () => void }) {
  const { entriesByLedger, createEntry, updateEntry, deleteEntry } = useOtherLedgerStore();
  const tags = useTagStore((s) => s.tags);
  const existing = entryId ? (entriesByLedger[ledgerId] ?? []).find((e) => e.id === entryId) : undefined;
  const [date, setDate] = useState(() => existing?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(() => existing?.description ?? '');
  const [amount, setAmount] = useState(() => existing ? String(existing.debit || existing.credit) : '');
  const [side, setSide] = useState<'debit' | 'credit'>(() => (existing?.credit ? 'credit' : 'debit'));
  const [tag, setTag] = useState(() => (existing?.metadata?.tags as string[] | undefined)?.[0] ?? '');
  const [newTagName, setNewTagName] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
      if (tag) useTagStore.getState().addTag(tag);
      const payload = { date, description: description.trim(), debit: side === 'debit' ? amt : 0, credit: side === 'credit' ? amt : 0, tags: tag ? [tag] : [] };
      if (existing) {
        await updateEntry(existing.id, { ...existing, ...payload, metadata: { ...existing.metadata, tags: tag ? [tag] : [] } } as unknown as Record<string, unknown> as never);
      } else {
        await createEntry({ ledgerId, ...payload });
      }
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const handleDelete = async () => {
    if (!existing) return;
    try {
      await deleteEntry(existing.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const form = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setSide('debit')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: side === 'debit' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: side === 'debit' ? 'var(--color-primary)' : 'var(--color-surface)', color: side === 'debit' ? 'white' : 'var(--color-text)' }}>Debit</button>
        <button onClick={() => setSide('credit')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: side === 'credit' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: side === 'credit' ? 'var(--color-primary)' : 'var(--color-surface)', color: side === 'credit' ? 'white' : 'var(--color-text)' }}>Credit</button>
      </div>
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Date</span>
        <DatePicker value={date} onChange={setDate} />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (1–200)" maxLength={200} rows={3} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: 88, resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.4 }} />
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Tag (optional)</span>
        <button type="button" className={`${txStyles.pickerTrigger} ${tag ? txStyles.hasValue : ''}`} onClick={() => setShowTagPicker(true)}>
          {tag ? <><span className={txStyles.pickerValue}>{tag}</span><span className={txStyles.pickerArrow}>▾</span></> : <span className={txStyles.pickerPlaceholder}>Select tag (optional)</span>}
        </button>
      </div>
      {error && <div style={{ color: 'var(--color-expense)', fontSize: 13 }}>{error}</div>}
      {existing && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid oklch(62% 0.22 25 / 0.28)', background: 'oklch(62% 0.22 25 / 0.10)', color: 'var(--color-expense)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M3 4h10" /><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M6 7l0 5M10 7l0 5M4 4l0 8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1L12 4" /></svg>
          Delete entry
        </button>
      )}
    </div>
  );

  const tagModal = showTagPicker ? (
    <div className={txStyles.pickerOverlay} onClick={() => setShowTagPicker(false)}>
      <div className={txStyles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={txStyles.pickerHeader}>
          <span className={txStyles.pickerTitle}>Select tag</span>
          <button className={txStyles.pickerClose} onClick={() => setShowTagPicker(false)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={txStyles.tagPickerCreate}>
          <input className={txStyles.inputField} value={newTagName} maxLength={30} placeholder="New tag name" onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTagName.trim()) { useTagStore.getState().addTag(newTagName.trim()); setTag(newTagName.trim()); setNewTagName(''); setShowTagPicker(false); } }} />
          <button className={txStyles.tagPickerAdd} disabled={!newTagName.trim()} onClick={() => { useTagStore.getState().addTag(newTagName.trim()); setTag(newTagName.trim()); setNewTagName(''); setShowTagPicker(false); }}>Add</button>
        </div>
        <div className={txStyles.pickerList}>
          <button className={txStyles.pickerItem} onClick={() => { setTag(''); setShowTagPicker(false); }}><span className={txStyles.pickerPlaceholder}>No tag</span></button>
          {tags.map((t) => <button key={t} className={txStyles.pickerItem} onClick={() => { setTag(t); setShowTagPicker(false); }}><span className={txStyles.pickerItemName}>{t}</span></button>)}
          {tags.length === 0 && <div className={txStyles.pickerEmpty}>No tags yet — create one above</div>}
        </div>
      </div>
    </div>
  ) : null;

  const descStyle: React.CSSProperties = { textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '12px 0' };
  const deleteConfirm = !showDeleteConfirm || !existing ? null : isMobile ? (
    <BottomSheet isOpen onClose={() => setShowDeleteConfirm(false)} title="Delete Entry">
      <p style={descStyle}>Are you sure you want to delete this entry? It will be moved to the Recycle Bin and can be restored within 30 days.</p>
      <div style={{ display: 'flex', gap: 10, padding: '8px 0 4px' }}>
        <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: 14, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)', color: 'var(--color-text)', font: '500 14px var(--font-display)', cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleDelete} style={{ flex: 1, padding: 14, border: 'none', borderRadius: 12, background: 'var(--color-coral)', color: '#fff', font: '500 14px var(--font-display)', cursor: 'pointer' }}>Delete</button>
      </div>
    </BottomSheet>
  ) : (
    <Modal isOpen onClose={() => setShowDeleteConfirm(false)} title="Delete Entry" saveLabel="Delete" onSave={handleDelete}>
      <p style={descStyle}>Are you sure you want to delete this entry? It will be moved to the Recycle Bin and can be restored within 30 days.</p>
    </Modal>
  );

  if (isMobile) return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title={existing ? 'Edit Entry' : 'Add Entry'}>
        {form}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: 10, borderRadius: 9999, background: 'var(--color-primary)', color: 'white', border: 'none' }}>{existing ? 'Save' : 'Add'}</button>
        </div>
      </BottomSheet>
      {tagModal}
      {deleteConfirm}
    </>
  );
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={existing ? 'Edit Entry' : 'Add Entry'} onSave={handleSave} saveLabel={existing ? 'Save' : 'Add'}>{form}</Modal>
      {tagModal}
      {deleteConfirm}
    </>
  );
}
