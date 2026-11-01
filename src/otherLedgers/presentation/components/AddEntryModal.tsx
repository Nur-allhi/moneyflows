import { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../../../presentation/components';
import { DatePicker } from '../../../components/ui/date-picker';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useTagStore } from '../../../presentation/stores/useTagStore';
import { useReplay } from '../../../presentation/hooks/useReplay';
import txStyles from '../../../presentation/modals/TransactionFormModal.module.css';
import otherStyles from './OtherLedgerModals.module.css';

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
  const [debitKey, replayDebit] = useReplay();
  const [creditKey, replayCredit] = useReplay();
  const [tagTrigKey, replayTagTrig] = useReplay();
  const [delEntryKey, replayDelEntry] = useReplay();
  const [tagCloseKey, replayTagClose] = useReplay();
  const [tagAddKey, replayTagAdd] = useReplay();
  const [tagListKey, replayTagList] = useReplay();
  const [tagPicked, setTagPicked] = useState<string | null>(null);
  const [cancelKey, replayCancel] = useReplay();
  const [saveKey, replaySave] = useReplay();
  const [delCancelKey, replayDelCancel] = useReplay();
  const [delConfirmKey, replayDelConfirm] = useReplay();
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
    <div className={otherStyles.form}>
      <div className={otherStyles.toggleGroup}>
        <button onClick={() => { replayDebit(); setSide('debit'); }} className={`${otherStyles.toggleBtn} ${side === 'debit' ? otherStyles.toggleOn : ''} ${debitKey > 0 ? 'anim-pop' : ''}`}><span className="anim-target" key={debitKey}>Debit</span></button>
        <button onClick={() => { replayCredit(); setSide('credit'); }} className={`${otherStyles.toggleBtn} ${side === 'credit' ? otherStyles.toggleOn : ''} ${creditKey > 0 ? 'anim-pop' : ''}`}><span className="anim-target" key={creditKey}>Credit</span></button>
      </div>
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Date</span>
        <DatePicker value={date} onChange={setDate} />
      </div>
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" maxLength={200} rows={3} className={otherStyles.textareaField} />
      </div>
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Amount</span>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={txStyles.inputField} />
      </div>
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Tag (optional)</span>
        <button type="button" className={`${txStyles.pickerTrigger} ${tag ? txStyles.hasValue : ''} ${tagTrigKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayTagTrig(); setShowTagPicker(true); }}>
          <span className="anim-target" key={tagTrigKey}>{tag ? <><span className={txStyles.pickerValue}>{tag}</span><span className={txStyles.pickerArrow}>▾</span></> : <span className={txStyles.pickerPlaceholder}>Select tag (optional)</span>}</span>
        </button>
      </div>
      {error && <div className={otherStyles.errorText}>{error}</div>}
      {existing && (
        <button
          onClick={() => { replayDelEntry(); setShowDeleteConfirm(true); }}
          className={`${otherStyles.entryDeleteBtn} ${delEntryKey > 0 ? 'anim-pop' : ''}`}
        >
          <span className="anim-target" key={delEntryKey}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M3 4h10" /><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M6 7l0 5M10 7l0 5M4 4l0 8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1L12 4" /></svg>
          Delete entry
          </span>
        </button>
      )}
    </div>
  );

  const tagModal = showTagPicker ? (
    <div className={txStyles.pickerOverlay} onClick={() => setShowTagPicker(false)}>
      <div className={txStyles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={txStyles.pickerHeader}>
          <span className={txStyles.pickerTitle}>Select tag</span>
          <button className={`${txStyles.pickerClose} ${tagCloseKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayTagClose(); setShowTagPicker(false); }}>
            <svg key={tagCloseKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={txStyles.tagPickerCreate}>
          <input className={txStyles.inputField} value={newTagName} maxLength={30} placeholder="New tag name" onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTagName.trim()) { useTagStore.getState().addTag(newTagName.trim()); setTag(newTagName.trim()); setNewTagName(''); setShowTagPicker(false); } }} />
          <button className={`${txStyles.tagPickerAdd} ${tagAddKey > 0 ? 'anim-pop' : ''}`} disabled={!newTagName.trim()} onClick={() => { replayTagAdd(); useTagStore.getState().addTag(newTagName.trim()); setTag(newTagName.trim()); setNewTagName(''); setShowTagPicker(false); }}><span className="anim-target" key={tagAddKey}>Add</span></button>
        </div>
        <div className={txStyles.pickerList}>
          <button className={`${txStyles.pickerItem} ${tagPicked === '' && tagListKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayTagList(); setTagPicked(''); setTag(''); setShowTagPicker(false); }}><span className="anim-target" key={`none-${tagPicked === '' ? tagListKey : 0}`}><span className={txStyles.pickerPlaceholder}>No tag</span></span></button>
          {tags.map((t) => <button key={t} className={`${txStyles.pickerItem} ${tagPicked === t && tagListKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayTagList(); setTagPicked(t); setTag(t); setShowTagPicker(false); }}><span className="anim-target" key={`${t}-${tagPicked === t ? tagListKey : 0}`}><span className={txStyles.pickerItemName}>{t}</span></span></button>)}
          {tags.length === 0 && <div className={txStyles.pickerEmpty}>No tags yet — create one above</div>}
        </div>
      </div>
    </div>
  ) : null;

  const deleteConfirm = !showDeleteConfirm || !existing ? null : isMobile ? (
    <BottomSheet isOpen onClose={() => setShowDeleteConfirm(false)} title="Delete Entry">
      <p className={otherStyles.confirmDesc}>Are you sure you want to delete this entry? It will be moved to the Recycle Bin and can be restored within 30 days.</p>
      <div className={otherStyles.confirmRow}>
        <button onClick={() => { replayDelCancel(); setShowDeleteConfirm(false); }} className={`${otherStyles.confirmBtn} ${otherStyles.confirmGhost} ${delCancelKey > 0 ? 'anim-pop' : ''}`}><span className="anim-target" key={delCancelKey}>Cancel</span></button>
        <button onClick={() => { replayDelConfirm(); void handleDelete(); }} className={`${otherStyles.confirmBtn} ${otherStyles.confirmDanger} ${delConfirmKey > 0 ? 'anim-pop' : ''}`}><span className="anim-target" key={delConfirmKey}>Delete</span></button>
      </div>
    </BottomSheet>
  ) : (
    <Modal isOpen onClose={() => setShowDeleteConfirm(false)} title="Delete Entry" saveLabel="Delete" onSave={handleDelete}>
      <p className={otherStyles.confirmDesc}>Are you sure you want to delete this entry? It will be moved to the Recycle Bin and can be restored within 30 days.</p>
    </Modal>
  );

  if (isMobile) return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title={existing ? 'Edit Entry' : 'Add Entry'}>
        {form}
        <div className={otherStyles.sheetActions}>
          <button onClick={() => { replayCancel(); onClose(); }} className={`${otherStyles.sheetBtn} ${otherStyles.sheetBtnGhost} ${cancelKey > 0 ? 'anim-pop' : ''}`}><span className="anim-target" key={cancelKey}>Cancel</span></button>
          <button onClick={() => { replaySave(); void handleSave(); }} className={`${otherStyles.sheetBtn} ${otherStyles.sheetBtnPrimary} ${saveKey > 0 ? 'anim-pop' : ''}`}><span className="anim-target" key={saveKey}>{existing ? 'Save' : 'Add'}</span></button>
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
