import { useTagStore } from '../../stores/useTagStore';
import styles from '../TransactionFormModal.module.css';

export function TagPicker({ show, onClose, setTagName, newTagName, setNewTagName, knownTags }: {
  show: boolean; onClose: () => void; setTagName: (v: string) => void;
  newTagName: string; setNewTagName: (v: string) => void; knownTags: string[];
}) {
  if (!show) return null;
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>Select tag</span>
          <button className={styles.pickerClose} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={styles.tagPickerCreate}>
          <input className={styles.inputField} value={newTagName} maxLength={30} placeholder="New tag name" onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTagName.trim()) { useTagStore.getState().addTag(newTagName.trim()); setTagName(newTagName.trim()); setNewTagName(''); onClose(); } }} />
          <button className={styles.tagPickerAdd} disabled={!newTagName.trim()} onClick={() => { useTagStore.getState().addTag(newTagName.trim()); setTagName(newTagName.trim()); setNewTagName(''); onClose(); }}>Add</button>
        </div>
        <div className={styles.pickerList}>
          <button className={styles.pickerItem} onClick={() => { setTagName(''); onClose(); }}><span className={styles.pickerPlaceholder}>No tag</span></button>
          {knownTags.map((t) => (<button key={t} className={styles.pickerItem} onClick={() => { setTagName(t); onClose(); }}><span className={styles.pickerItemName}>{t}</span></button>))}
          {knownTags.length === 0 && <div className={styles.pickerEmpty}>No tags yet — create one above</div>}
        </div>
      </div>
    </div>
  );
}

export function CreatePersonModal({ show, onClose, newCpName, setNewCpName, onCreate, error }: {
  show: boolean; onClose: () => void; newCpName: string; setNewCpName: (v: string) => void; onCreate: () => void; error?: string;
}) {
  if (!show) return null;
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>Create New Person</span>
          <button className={styles.pickerClose} onClick={onClose}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
        </div>
        <div className={styles.pickerBody}>
          <div className={styles.createCpBody}>
            <input className={styles.inputField} placeholder="Person name" value={newCpName} onChange={(e) => setNewCpName(e.target.value)} autoFocus />
            {error && <span className={styles.errorText}>{error}</span>}
            <div className={styles.createCpActions}>
              <button className={styles.cancelBtn} onClick={() => { onClose(); setNewCpName(''); }}>Cancel</button>
              <button className={styles.saveBtn} onClick={onCreate}>Create</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
