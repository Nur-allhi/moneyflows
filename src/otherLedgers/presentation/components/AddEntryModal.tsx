import { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../../../presentation/components';
import { DatePicker } from '../../../components/ui/date-picker';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useTransactionStore } from '../../../presentation/stores/useTransactionStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { useTagStore } from '../../../presentation/stores/useTagStore';
import { useReplay } from '../../../presentation/hooks/useReplay';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { formatAmount } from '../../../presentation/utils/format';
import txStyles from '../../../presentation/modals/TransactionFormModal.module.css';
import otherStyles from './OtherLedgerModals.module.css';

export function AddEntryModal({ isOpen, ledgerId, entryId, onClose }: { isOpen: boolean; ledgerId: string; entryId?: string; onClose: () => void }) {
  const { entriesByLedger, createEntry, updateEntry, deleteEntry } = useOtherLedgerStore();
  const tags = useTagStore((s) => s.tags);
  const transactions = useTransactionStore((s) => s.transactions);
  const { locale, currency } = useSettingsStore((s) => s.settings);
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

  // T-122: retro-link — this entry may mirror an existing transaction. The
  // selection lives as the chosen tx id; the label resolves on mount (the
  // linked transaction may live in another fetched window of the store).
  const [linkTxId, setLinkTxId] = useState<string | null>(() => existing?.linkedTransactionId ?? null);
  const [linkLabel, setLinkLabel] = useState('');
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [linkTrigKey, replayLinkTrig] = useReplay();
  const [linkCloseKey, replayLinkClose] = useReplay();
  const [linkListKey, replayLinkList] = useReplay();
  const [linkPicked, setLinkPicked] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!linkTxId) { setLinkLabel(''); return; }
    void (async () => {
      let tx = transactions.find((t) => t.id === linkTxId);
      if (!tx) {
        try { tx = (await getDatabase().getTransactionById(linkTxId)) ?? undefined; } catch { tx = undefined; }
      }
      if (cancelled) return;
      setLinkLabel(tx ? tx.description : 'Linked transaction');
    })();
    return () => { cancelled = true; };
  }, [linkTxId, transactions]);

  const openLinkPicker = async () => {
    try { setLinkedIds(await getDatabase().getLinkedTransactionIds()); } catch { setLinkedIds([]); }
    setShowLinkPicker(true);
  };
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
      const payload = { date, description: description.trim(), debit: side === 'debit' ? amt : 0, credit: side === 'credit' ? amt : 0, tags: tag ? [tag] : [], linkedTransactionId: linkTxId ?? undefined };
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
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Link to transaction (optional)</span>
        <button type="button" className={`${txStyles.pickerTrigger} ${linkTxId ? txStyles.hasValue : ''} ${linkTrigKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayLinkTrig(); void openLinkPicker(); }}>
          <span className="anim-target" key={linkTrigKey}>{linkTxId ? <><span className={txStyles.pickerValue}>{`↔ ${linkLabel}`}</span><span className={txStyles.pickerArrow}>▾</span></> : <span className={txStyles.pickerPlaceholder}>No link — pick a transaction</span>}</span>
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

  const linkModal = !showLinkPicker ? null : (() => {
    const q = linkQuery.trim().toLowerCase();
    const ownLink = existing?.linkedTransactionId ?? null;
    const candidates = transactions
      .filter((t) => t.type === 'income' || t.type === 'expense' || t.type === 'transfer')
      .filter((t) => !q || t.description.toLowerCase().includes(q) || t.date.includes(q) || String(t.amount).includes(q))
      .filter((t) => !linkedIds.includes(t.id) || t.id === ownLink)
      .slice(0, 60);
    return (
      <div className={txStyles.pickerOverlay} onClick={() => setShowLinkPicker(false)}>
        <div className={txStyles.pickerModal} onClick={(e) => e.stopPropagation()}>
          <div className={txStyles.pickerHeader}>
            <span className={txStyles.pickerTitle}>Link to transaction</span>
            <button className={`${txStyles.pickerClose} ${linkCloseKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayLinkClose(); setShowLinkPicker(false); }}>
              <svg key={linkCloseKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className={txStyles.tagPickerCreate}>
            <input className={txStyles.inputField} value={linkQuery} maxLength={50} placeholder="Search transactions" autoFocus onChange={(e) => setLinkQuery(e.target.value)} />
          </div>
          <div className={txStyles.pickerList}>
            <button className={`${txStyles.pickerItem} ${linkPicked === '' && linkListKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayLinkList(); setLinkPicked(''); setLinkTxId(null); setShowLinkPicker(false); }}><span className="anim-target" key={`nolink-${linkPicked === '' ? linkListKey : 0}`}><span className={txStyles.pickerPlaceholder}>No link (standalone)</span></span></button>
            {candidates.map((t) => (
              <button key={t.id} className={`${txStyles.pickerItem} ${linkPicked === t.id && linkListKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayLinkList(); setLinkPicked(t.id); setLinkTxId(t.id); setShowLinkPicker(false); }}>
                <span className="anim-target" key={`${t.id}-${linkPicked === t.id ? linkListKey : 0}`}>
                  <span className={txStyles.pickerItemName}>{t.description}</span>
                  <span className={txStyles.pickerMeta}>{new Date(t.date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })} · {formatAmount(t.amount, locale, currency)}</span>
                </span>
              </button>
            ))}
            {candidates.length === 0 && <div className={txStyles.pickerEmpty}>No matching unlinked transactions</div>}
          </div>
        </div>
      </div>
    );
  })();

  const deleteConfirm = !showDeleteConfirm || !existing ? null : isMobile ? (    <BottomSheet isOpen onClose={() => setShowDeleteConfirm(false)} title="Delete Entry">
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
      {linkModal}
      {deleteConfirm}
    </>
  );
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={existing ? 'Edit Entry' : 'Add Entry'} onSave={handleSave} saveLabel={existing ? 'Save' : 'Add'}>{form}</Modal>
      {tagModal}
      {linkModal}
      {deleteConfirm}
    </>
  );
}
