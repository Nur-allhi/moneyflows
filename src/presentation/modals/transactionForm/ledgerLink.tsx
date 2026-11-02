import { useState } from 'react';

import { useOtherLedgerStore } from '../../../otherLedgers/presentation/stores/useOtherLedgerStore';
import { CreateLedgerModal } from '../../../otherLedgers/presentation/components/CreateLedgerModal';
import { useReplay } from '../../hooks/useReplay';
import type { OtherLedger } from '../../../otherLedgers/domain/types';
import styles from '../TransactionFormModal.module.css';
import otherStyles from '../../../otherLedgers/presentation/components/OtherLedgerModals.module.css';
import type { LedgerSide } from './ledgerLinkHelpers';

function ledgerOwnerLabel(ledger: OtherLedger): string {
  return ledger.ownerType === 'member' ? (ledger.ownerName ?? 'Member') : (ledger.ownerName ?? 'Other person');
}

/**
 * "Also post to Other Ledger" row: a switch that reveals the ledger picker
 * trigger and the debit/credit side choice (plan doc: OTHER_LEDGERS_FUTURE_V2 §3).
 */
export function LedgerLinkRow({ on, onToggle, ledgers, ledgerId, side, onSideChange, onOpenPicker, error }: {
  on: boolean;
  onToggle: () => void;
  ledgers: OtherLedger[];
  ledgerId: string;
  side: LedgerSide;
  onSideChange: (v: LedgerSide) => void;
  onOpenPicker: () => void;
  error?: string;
}) {
  const [trigKey, replayTrig] = useReplay();
  const [debitKey, replayDebit] = useReplay();
  const [creditKey, replayCredit] = useReplay();
  const selected = ledgers.find((l) => l.id === ledgerId);
  return (
    <>
      <div className={styles.ledgerSwitchRow}>
        <span className={styles.ledgerSwitchLabel}>Also post to Other Ledger</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Also post to Other Ledger"
          className={`${styles.ledgerSwitch} ${on ? styles.ledgerSwitchOn : ''}`}
          onClick={onToggle}
        >
          <span className={styles.ledgerKnob} />
        </button>
      </div>
      {on && (
        <>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Other Ledger</span>
            <button
              type="button"
              className={`${styles.pickerTrigger} ${ledgerId ? styles.pickerHasValue : ''} ${error ? styles.fieldError : ''} ${trigKey > 0 ? 'anim-pop' : ''}`}
              onClick={() => { replayTrig(); onOpenPicker(); }}
            >
              <span className="anim-target" key={trigKey}>{selected
                ? <><span className={styles.pickerValue}>{`#${selected.name} · ${ledgerOwnerLabel(selected)}`}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></>
                : <span className={styles.pickerPlaceholder}>Select ledger</span>}</span>
            </button>
            {error && <span className={styles.errorText}>{error}</span>}
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Ledger Side</span>
            <div className={otherStyles.toggleGroup} role="group" aria-label="Ledger side">
              <button type="button" className={`${otherStyles.toggleBtn} ${side === 'debit' ? otherStyles.toggleOn : ''} ${debitKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayDebit(); onSideChange('debit'); }}><span className="anim-target" key={debitKey}>Debit</span></button>
              <button type="button" className={`${otherStyles.toggleBtn} ${side === 'credit' ? otherStyles.toggleOn : ''} ${creditKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCredit(); onSideChange('credit'); }}><span className="anim-target" key={creditKey}>Credit</span></button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/** Overlay to pick an existing ledger (or create one inline, then auto-select). */
export function LedgerPickerOverlay({ show, onClose, onSelect }: {
  show: boolean;
  onClose: () => void;
  onSelect: (ledgerId: string) => void;
}) {
  const ledgers = useOtherLedgerStore((s) => s.ledgers);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [closeKey, replayClose] = useReplay();
  const [createKey, replayCreate] = useReplay();
  const [listKey, replayList] = useReplay();
  const [picked, setPicked] = useState<string | null>(null);
  if (!show) return null;
  const q = query.trim().toLowerCase();
  const filtered = ledgers
    .filter((l) => !q || l.name.toLowerCase().includes(q) || ledgerOwnerLabel(l).toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <div className={styles.pickerOverlay} onClick={onClose}>
        <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.pickerHeader}>
            <span className={styles.pickerTitle}>Select Other Ledger</span>
            <button className={`${styles.pickerClose} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close">
              <svg key={closeKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className={styles.tagPickerCreate}>
            <input
              className={styles.inputField}
              value={query}
              maxLength={50}
              placeholder="Search ledgers"
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.pickerList}>
            <button className={`${styles.pickerItem} ${createKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCreate(); setCreating(true); }}>
              <span className="anim-target" key={createKey}><span className={styles.pickerPlaceholder}>+ Create new ledger…</span></span>
            </button>
            {filtered.map((l) => (
              <button key={l.id} className={`${styles.pickerItem} ${picked === l.id && listKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayList(); setPicked(l.id); onSelect(l.id); onClose(); }}>
                <span className="anim-target" key={`${l.id}-${picked === l.id ? listKey : 0}`}>
                  <span className={styles.pickerItemName}>{`#${l.name}`}</span>
                  <span className={styles.pickerMeta}>{ledgerOwnerLabel(l)}</span>
                </span>
              </button>
            ))}
            {filtered.length === 0 && <div className={styles.pickerEmpty}>No ledgers match — create one above</div>}
          </div>
        </div>
      </div>
      <CreateLedgerModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        onCreated={(ledger) => { setCreating(false); onSelect(ledger.id); onClose(); }}
      />
    </>
  );
}
