import { formatAmount } from '../../utils/format';
import type { Account } from '../../../core/domain/Account';
import type { Member } from '../../../core/domain/Member';
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
  if (!pickerField) return null;
  return (
    <div className={styles.pickerOverlay} onClick={() => { setPickerField(null); setPickerMember(null); }}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <button className={styles.pickerBack} onClick={() => setPickerMember(null)} style={{ visibility: !pickerMember ? 'hidden' : 'visible' }}>{'\u25C0'}</button>
          <span className={styles.pickerTitle}>{pickerMember ? 'Select Account' : 'Select Member'}</span>
          <button className={styles.pickerClose} onClick={() => { setPickerField(null); setPickerMember(null); }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className={styles.pickerBody}>
          {!pickerMember ? (
            <div className={styles.pickerList}>
              {internalMembers.map((m) => (
                <button key={m.id} className={styles.pickerItem} onClick={() => setPickerMember(m.id)}>
                  <span className={styles.pickerItemName}>{m.name}</span>
                  {m.shortName && <span className={styles.pickerItemMeta}>{m.shortName}</span>}
                  <span className={styles.pickerItemCount}>{accountsByMember[m.id]?.length ?? 0} accounts</span>
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
                        className={styles.pickerItem}
                        onClick={() => {
                          onSelectDestination(a.id);
                          clearError('destination');
                          setPickerField(null);
                          setPickerMember(null);
                        }}
                      >
                        <span className={styles.pickerItemName}>{a.name}</span>
                        <span className={styles.pickerItemMeta}>Counterparty</span>
                        <span className={styles.pickerItemBalance}>{formatAmount(a.balance, locale, currency)}</span>
                      </button>
                    ))
                  )}
                  <button className={styles.pickerCreateBtn} onClick={() => { setShowAddCp(true); setPickerField(null); setPickerMember(null); }}>+ Create New Person</button>
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
                    className={styles.pickerItem}
                    onClick={() => {
                      if (pickerField === 'source') onSelectSource(a.id);
                      else onSelectDestination(a.id);
                      clearError(pickerField);
                      setPickerField(null);
                      setPickerMember(null);
                    }}
                  >
                    <span className={styles.pickerItemName}>{a.name}</span>
                    <span className={styles.pickerItemMeta}>{a.type.replace('_', ' ')}</span>
                    <span className={styles.pickerItemBalance}>{formatAmount(a.balance, locale, currency)}</span>
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

export function BorrowerPicker({ show, onClose, repayStackOptions, selectedBorrowerId, setSelectedBorrowerId }: {
  show: boolean;
  onClose: () => void;
  repayStackOptions: { borrowerId: string; label: string }[];
  selectedBorrowerId: string;
  setSelectedBorrowerId: (v: string) => void;
}) {
  if (!show) return null;
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <span className={styles.pickerTitle}>Select Counterparty</span>
          <button className={styles.pickerClose} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
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
                  className={`${styles.pickerItem} ${selectedBorrowerId === opt.borrowerId ? styles.pickerItemActive : ''}`}
                  onClick={() => {
                    setSelectedBorrowerId(opt.borrowerId);
                    onClose();
                  }}
                >
                  <span className={styles.pickerItemName}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
