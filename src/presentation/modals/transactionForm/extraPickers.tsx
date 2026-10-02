import { useState } from 'react';
import { useTagStore } from '../../stores/useTagStore';
import { useReplay } from '../../hooks/useReplay';
import styles from '../TransactionFormModal.module.css';

export function TagPicker({ show, onClose, setTagName, newTagName, setNewTagName, knownTags }: {
  show: boolean; onClose: () => void; setTagName: (v: string) => void;
  newTagName: string; setNewTagName: (v: string) => void; knownTags: string[];
}) {
  const [closeKey, replayClose] = useReplay();
  const [addKey, replayAdd] = useReplay();
  const [listKey, replayList] = useReplay();
  const [pickedTag, setPickedTag] = useState<string | null>(null);
  if (!show) return null;
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>Select tag</span>
          <button className={`${styles.pickerClose} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }}>
            <svg key={closeKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={styles.tagPickerCreate}>
          <input className={styles.inputField} value={newTagName} maxLength={30} placeholder="New tag name" onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTagName.trim()) { useTagStore.getState().addTag(newTagName.trim()); setTagName(newTagName.trim()); setNewTagName(''); onClose(); } }} />
          <button className={`${styles.tagPickerAdd} ${addKey > 0 ? 'anim-pop' : ''}`} disabled={!newTagName.trim()} onClick={() => { replayAdd(); useTagStore.getState().addTag(newTagName.trim()); setTagName(newTagName.trim()); setNewTagName(''); onClose(); }}><span className="anim-target" key={addKey}>Add</span></button>
        </div>
        <div className={styles.pickerList}>
          <button className={`${styles.pickerItem} ${pickedTag === '' && listKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayList(); setPickedTag(''); setTagName(''); onClose(); }}><span className="anim-target" key={`none-${pickedTag === '' ? listKey : 0}`}><span className={styles.pickerPlaceholder}>No tag</span></span></button>
          {knownTags.map((t) => (<button key={t} className={`${styles.pickerItem} ${pickedTag === t && listKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayList(); setPickedTag(t); setTagName(t); onClose(); }}><span className="anim-target" key={`${t}-${pickedTag === t ? listKey : 0}`}><span className={styles.pickerItemName}>{t}</span></span></button>))}
          {knownTags.length === 0 && <div className={styles.pickerEmpty}>No tags yet — create one above</div>}
        </div>
      </div>
    </div>
  );
}

export function CreatePersonModal({ show, onClose, newCpName, setNewCpName, onCreate, error }: {
  show: boolean; onClose: () => void;   newCpName: string; setNewCpName: (v: string) => void; onCreate: () => void; error?: string;
}) {
  const [closeKey, replayClose] = useReplay();
  const [cancelKey, replayCancel] = useReplay();
  const [createKey, replayCreate] = useReplay();
  if (!show) return null;
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>Create New Person</span>
          <button className={`${styles.pickerClose} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }}><svg key={closeKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <div className={styles.pickerBody}>
          <div className={styles.createCpBody}>
            <input className={styles.inputField} placeholder="Person name" value={newCpName} onChange={(e) => setNewCpName(e.target.value)} autoFocus />
            {error && <span className={styles.errorText}>{error}</span>}
            <div className={styles.createCpActions}>
              <button className={`${styles.cancelBtn} ${cancelKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCancel(); onClose(); setNewCpName(''); }}><span className="anim-target" key={cancelKey}>Cancel</span></button>
              <button className={`${styles.saveBtn} ${createKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCreate(); onCreate(); }}><span className="anim-target" key={createKey}>Create</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
