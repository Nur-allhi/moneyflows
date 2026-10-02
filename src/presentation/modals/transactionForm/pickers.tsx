import { useState } from 'react';
import { formatAmount } from '../../utils/format';
import type { Account } from '../../../core/domain/Account';
import type { Member } from '../../../core/domain/Member';
import { useReplay } from '../../hooks/useReplay';
import styles from '../TransactionFormModal.module.css';

interface PickerProps {
  pickerField: 'source' | 'destination' | null;
  pickerMember: string | null;
  setPickerField: (v: 'source' | 'destination' | null) => void;
  setPickerMember: (v: string | null) => void;
  internalMembers: Member[];
  accountsByMember: Record<string, Account[]>;
  counterpartyAccounts: Account[];
  onSelectSource: (id: string) => void;
  onSelectDestination: (id: string) => void;
  setShowAddCp: (v: boolean) => void;
  clearError: (field: string) => void;
  locale: string;
  currency: string;
  tab: string;
}

export function SourceDestinationPickers(props: PickerProps) {
  const { pickerField, pickerMember, setPickerField, setPickerMember, internalMembers, accountsByMember, counterpartyAccounts, onSelectSource, onSelectDestination, setShowAddCp, clearError, locale, currency, tab } = props;
  const [backKey, replayBack] = useReplay();
  const [closeKey, replayClose] = useReplay();
  const [listKey, replayList] = useReplay();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [createKey, replayCreate] = useReplay();
  if (!pickerField) return null;
  return (
    <div className={styles.pickerOverlay} onClick={() => { setPickerField(null); setPickerMember(null); }}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <button className={`${styles.pickerBack} ${backKey > 0 ? 'anim-nudge' : ''}`} onClick={() => { replayBack(); setPickerMember(null); }} style={{ visibility: !pickerMember ? 'hidden' : 'visible' }}><span className="anim-target" key={backKey}>{'\u25C0'}</span></button>
          <span className={styles.pickerTitle}>{pickerMember ? 'Select Account' : 'Select Member'}</span>
          <button className={`${styles.pickerClose} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); setPickerField(null); setPickerMember(null); }}>
            <svg key={closeKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={styles.pickerBody}>
          {!pickerMember ? (
            <div className={styles.pickerList}>
              {internalMembers.map((m) => (
                <button key={m.id} className={`${styles.pickerItem} ${pickedId === m.id && listKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayList(); setPickedId(m.id); setPickerMember(m.id); }}>
                  <span className="anim-target" key={`${m.id}-${pickedId === m.id ? listKey : 0}`}>
                  <span className={styles.pickerItemName}>{m.name}</span>
                  {m.shortName && <span className={styles.pickerItemMeta}>{m.shortName}</span>}
                  <span className={styles.pickerItemCount}>{accountsByMember[m.id]?.length ?? 0} accounts</span>
                  </span>
                </button>
              ))}
              {tab === 'loan' && pickerField === 'destination' && (
                <>
                  <div className={styles.pickerItem} style={{ opacity: 0.4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 14px', cursor: 'default' }}>Person</div>
                  {counterpartyAccounts.length === 0 ? (
                    <div className={styles.pickerEmpty}>No persons yet</div>
                  ) : (
                    counterpartyAccounts.map((a) => (
                      <button
                        key={a.id}
                        className={`${styles.pickerItem} ${pickedId === a.id && listKey > 0 ? 'anim-pop' : ''}`}
                        onClick={() => {
                          replayList(); setPickedId(a.id);
                          onSelectDestination(a.id);
                          clearError('destination');
                          setPickerField(null);
                          setPickerMember(null);
                        }}
                      >
                        <span className="anim-target" key={`${a.id}-${pickedId === a.id ? listKey : 0}`}>
                        <span className={styles.pickerItemName}>{a.name}</span>
                        <span className={styles.pickerItemMeta}>Counterparty</span>
                        <span className={styles.pickerItemBalance}>{formatAmount(a.balance, locale, currency)}</span>
                        </span>
                      </button>
                    ))
                  )}
                  <button className={`${styles.pickerCreateBtn} ${createKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCreate(); setShowAddCp(true); setPickerField(null); setPickerMember(null); }}><span className="anim-target" key={createKey}>+ Create New Person</span></button>
                </>
              )}
            </div>
          ) : (
            <div className={styles.pickerList}>
              {(accountsByMember[pickerMember] ?? []).length === 0 ? (
                <div className={styles.pickerEmpty}>No accounts for this member</div>
              ) : (
                (accountsByMember[pickerMember] ?? []).map((a) => (
                  <button
                    key={a.id}
                    className={`${styles.pickerItem} ${pickedId === a.id && listKey > 0 ? 'anim-pop' : ''}`}
                    onClick={() => {
                      replayList(); setPickedId(a.id);
                      if (pickerField === 'source') onSelectSource(a.id);
                      else onSelectDestination(a.id);
                      clearError(pickerField);
                      setPickerField(null);
                      setPickerMember(null);
                    }}
                  >
                    <span className="anim-target" key={`${a.id}-${pickedId === a.id ? listKey : 0}`}>
                    <span className={styles.pickerItemName}>{a.name}</span>
                    <span className={styles.pickerItemMeta}>{a.type.replace('_', ' ')}</span>
                    <span className={styles.pickerItemBalance}>{formatAmount(a.balance, locale, currency)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LenderPicker({ show, onClose, lenderOptions, selectedLenderId, setSelectedLenderId }: {
  show: boolean;
  onClose: () => void;
  lenderOptions: { lenderId: string; label: string }[];
  selectedLenderId: string;
  setSelectedLenderId: (v: string) => void;
}) {
  const [lenderCloseKey, replayLenderClose] = useReplay();
  const [lenderListKey, replayLenderList] = useReplay();
  const [lenderPicked, setLenderPicked] = useState<string | null>(null);
  if (!show) return null;
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>Pay To — Select Lender</span>
          <button className={`${styles.pickerClose} ${lenderCloseKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayLenderClose(); onClose(); }}>
            <svg key={lenderCloseKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={styles.pickerBody}>
          {lenderOptions.length === 0 ? (
            <div className={styles.pickerEmpty}>No lenders with outstanding balance</div>
          ) : (
            <div className={styles.pickerList}>
              {lenderOptions.map((opt) => (
                <button
                  key={opt.lenderId}
                  className={`${styles.pickerItem} ${selectedLenderId === opt.lenderId ? styles.pickerItemActive : ''} ${lenderPicked === opt.lenderId && lenderListKey > 0 ? 'anim-pop' : ''}`}
                  onClick={() => {
                    replayLenderList(); setLenderPicked(opt.lenderId);
                    setSelectedLenderId(opt.lenderId);
                    onClose();
                  }}
                >
                  <span className="anim-target" key={`${opt.lenderId}-${lenderPicked === opt.lenderId ? lenderListKey : 0}`}><span className={styles.pickerItemName}>{opt.label}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BorrowerPicker({ show, onClose, repayStackOptions, selectedBorrowerId, setSelectedBorrowerId }: {
  show: boolean;
  onClose: () => void;
  repayStackOptions: { borrowerId: string; label: string }[];
  selectedBorrowerId: string;
  setSelectedBorrowerId: (v: string) => void;
}) {
  const [borrowerCloseKey, replayBorrowerClose] = useReplay();
  const [borrowerListKey, replayBorrowerList] = useReplay();
  const [borrowerPicked, setBorrowerPicked] = useState<string | null>(null);
  if (!show) return null;
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>Select Counterparty</span>
          <button className={`${styles.pickerClose} ${borrowerCloseKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayBorrowerClose(); onClose(); }}>
            <svg key={borrowerCloseKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={styles.pickerBody}>
          {repayStackOptions.length === 0 ? (
            <div className={styles.pickerEmpty}>No counterparties with outstanding loans</div>
          ) : (
            <div className={styles.pickerList}>
              {repayStackOptions.map((opt) => (
                <button
                  key={opt.borrowerId}
                  className={`${styles.pickerItem} ${selectedBorrowerId === opt.borrowerId ? styles.pickerItemActive : ''} ${borrowerPicked === opt.borrowerId && borrowerListKey > 0 ? 'anim-pop' : ''}`}
                  onClick={() => {
                    replayBorrowerList(); setBorrowerPicked(opt.borrowerId);
                    setSelectedBorrowerId(opt.borrowerId);
                    onClose();
                  }}
                >
                  <span className="anim-target" key={`${opt.borrowerId}-${borrowerPicked === opt.borrowerId ? borrowerListKey : 0}`}><span className={styles.pickerItemName}>{opt.label}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
