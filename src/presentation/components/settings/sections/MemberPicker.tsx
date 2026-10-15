import { useState } from 'react';
import { useMemberStore } from '../../../stores/useMemberStore';
import styles from './MemberPicker.module.css';

interface MemberPickerProps {
  /** Member id, or '' for auto-detect. */
  value: string;
  onChange: (id: string) => void;
}

/**
 * Primary-member picker in the app modal-picker pattern
 * (DESIGN_IDENTITY §9: trigger + overlay + list, tokens only).
 * Host-independent — carries its own styles.
 */
export function MemberPicker({ value, onChange }: MemberPickerProps) {
  const members = useMemberStore((s) => s.members);
  const internalMembers = members.filter((m) => !m.isExternal);
  const [open, setOpen] = useState(false);

  const selectedName = value
    ? (internalMembers.find((m) => m.id === value)?.name ?? 'Auto-detect')
    : 'Auto-detect';

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        <span className={styles.value}>{selectedName}</span>
        <span className={styles.arrow} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Primary member">
            <div className={styles.header}>
              <span className={styles.title}>Primary Member</span>
              <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className={styles.list}>
              <button
                type="button"
                className={`${styles.item} ${value === '' ? styles.itemActive : ''}`}
                onClick={() => pick('')}
              >
                <span className={styles.itemName}>Auto-detect</span>
                <span className={styles.itemSub}>First family member</span>
              </button>
              {internalMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.item} ${value === m.id ? styles.itemActive : ''}`}
                  onClick={() => pick(m.id)}
                >
                  <span className={styles.itemName}>{m.name}</span>
                </button>
              ))}
              {internalMembers.length === 0 && (
                <div className={styles.empty}>No members yet — add one from Members.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
