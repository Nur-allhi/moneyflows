import { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../../../presentation/components';
import { DatePicker } from '../../../components/ui/date-picker';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useMemberStore } from '../../../presentation/stores/useMemberStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import type { OtherLedger } from '../../domain/types';
import txStyles from '../../../presentation/modals/TransactionFormModal.module.css';

export function RenameLedgerModal({ isOpen, ledger, onClose }: { isOpen: boolean; ledger: OtherLedger; onClose: () => void }) {
  const updateLedger = useOtherLedgerStore((s) => s.updateLedger);
  const members = useMemberStore((s) => s.members);
  const accounts = useAccountStore((s) => s.accounts);
  const allLedgers = useOtherLedgerStore((s) => s.ledgers);
  const [name, setName] = useState(ledger.name);
  const [startingDate, setStartingDate] = useState(ledger.startingDate);
  const [ownerType, setOwnerType] = useState<'member' | 'external'>(ledger.ownerType);
  const [ownerMemberId, setOwnerMemberId] = useState(ledger.ownerMemberId ?? '');
  const [ownerName, setOwnerName] = useState(ledger.ownerName ?? '');
  const [openingBalance, setOpeningBalance] = useState(String(ledger.openingBalance));
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showOwnerPicker, setShowOwnerPicker] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    if (isOpen) {
      setName(ledger.name);
      setStartingDate(ledger.startingDate);
      setOwnerType(ledger.ownerType);
      setOwnerMemberId(ledger.ownerMemberId ?? '');
      setOwnerName(ledger.ownerName ?? '');
      setOpeningBalance(String(ledger.openingBalance));
    }
  }, [isOpen, ledger]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSave = async () => {
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      setError('Name must be 3-50 characters');
      return;
    }
    try {
      await updateLedger(ledger.id, {
        name: trimmed,
        startingDate,
        ownerType,
        ownerMemberId: ownerType === 'member' ? ownerMemberId : undefined,
        ownerName: ownerType === 'external' ? ownerName : undefined,
        openingBalance: Number(openingBalance) || 0,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const counterpartyNames = Array.from(new Set(accounts.filter((a) => a.type === 'counterparty').map((a) => a.name).filter(Boolean)));
  const existingExternalNames = Array.from(new Set(allLedgers.filter((l) => l.ownerType === 'external' && l.id !== ledger.id).map((l) => l.ownerName).filter((n): n is string => Boolean(n))));
  const allExternalNames = Array.from(new Set([...counterpartyNames, ...existingExternalNames])).sort();

  const form = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Ledger Name (3-50)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. House Rent" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      </label>
      <div className={txStyles.fieldGroup}>
        <span className={txStyles.fieldLabel}>Starting Date</span>
        <DatePicker value={startingDate} onChange={setStartingDate} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setOwnerType('member')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: ownerType === 'member' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: ownerType === 'member' ? 'var(--color-primary)' : 'var(--color-surface)', color: ownerType === 'member' ? 'white' : 'var(--color-text)' }}>Member</button>
        <button onClick={() => setOwnerType('external')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: ownerType === 'external' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: ownerType === 'external' ? 'var(--color-primary)' : 'var(--color-surface)', color: ownerType === 'external' ? 'white' : 'var(--color-text)' }}>Other person</button>
      </div>
      {ownerType === 'member' ? (
        <div className={txStyles.fieldGroup}>
          <span className={txStyles.fieldLabel}>Member</span>
          <button type="button" className={`${txStyles.pickerTrigger} ${ownerMemberId ? txStyles.pickerHasValue : ''}`} onClick={() => setShowMemberPicker(true)}>
            {ownerMemberId
              ? <><span className={txStyles.pickerValue}>{members.find((m) => m.id === ownerMemberId)?.name ?? 'Select member'}</span><span className={txStyles.pickerArrow}>▾</span></>
              : <span className={txStyles.pickerPlaceholder}>Select member</span>}
          </button>
        </div>
      ) : (
        <div className={txStyles.fieldGroup}>
          <span className={txStyles.fieldLabel}>Other Person</span>
          <button type="button" className={`${txStyles.pickerTrigger} ${ownerName ? txStyles.pickerHasValue : ''}`} onClick={() => setShowOwnerPicker(true)}>
            {ownerName
              ? <><span className={txStyles.pickerValue}>{ownerName}</span><span className={txStyles.pickerArrow}>▾</span></>
              : <span className={txStyles.pickerPlaceholder}>Select person or write new</span>}
          </button>
        </div>
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Opening Balance</span>
        <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      </label>
      {error && <div style={{ color: 'var(--color-expense)', fontSize: 13 }}>{error}</div>}

      {showMemberPicker && (
        <div className={txStyles.pickerOverlay} onClick={() => setShowMemberPicker(false)}>
          <div className={txStyles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={txStyles.pickerHeader}>
              <span className={txStyles.pickerTitle}>Select Member</span>
              <button className={txStyles.pickerClose} onClick={() => setShowMemberPicker(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className={txStyles.pickerList}>
              {members.length === 0
                ? <div className={txStyles.pickerEmpty}>No members yet</div>
                : members.map((m) => (
                    <button key={m.id} className={txStyles.pickerItem} onClick={() => { setOwnerMemberId(m.id); setShowMemberPicker(false); }}>
                      <span className={txStyles.pickerItemName}>{m.name}</span>
                    </button>
                  ))}
            </div>
          </div>
        </div>
      )}

      {showOwnerPicker && (
        <div className={txStyles.pickerOverlay} onClick={() => setShowOwnerPicker(false)}>
          <div className={txStyles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={txStyles.pickerHeader}>
              <span className={txStyles.pickerTitle}>Select Other Person</span>
              <button className={txStyles.pickerClose} onClick={() => setShowOwnerPicker(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className={txStyles.tagPickerCreate}>
              <input className={txStyles.inputField} value={newOwnerName} maxLength={50} placeholder="Write new person name" onChange={(e) => setNewOwnerName(e.target.value)} onKeyDown={(e) => {
                if (e.key === 'Enter' && newOwnerName.trim()) {
                  setOwnerName(newOwnerName.trim());
                  setNewOwnerName('');
                  setShowOwnerPicker(false);
                }
              }} />
              <button className={txStyles.tagPickerAdd} disabled={!newOwnerName.trim()} onClick={() => {
                if (newOwnerName.trim()) { setOwnerName(newOwnerName.trim()); setNewOwnerName(''); setShowOwnerPicker(false); }
              }}>Add</button>
            </div>
            <div className={txStyles.pickerList}>
              {allExternalNames.length === 0
                ? <div className={txStyles.pickerEmpty}>No other persons yet — write one above</div>
                : allExternalNames.map((n) => (
                    <button key={n} className={txStyles.pickerItem} onClick={() => { setOwnerName(n); setShowOwnerPicker(false); }}>
                      <span className={txStyles.pickerItemName}>{n}</span>
                    </button>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) return <BottomSheet isOpen={isOpen} onClose={onClose} title="Rename Ledger">{form}<div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)' }}>Cancel</button><button onClick={handleSave} style={{ flex: 1, padding: 10, borderRadius: 9999, background: 'var(--color-primary)', color: 'white', border: 'none' }}>Save</button></div></BottomSheet>;
  return <Modal isOpen={isOpen} onClose={onClose} title="Rename Ledger" onSave={handleSave} saveLabel="Save">{form}</Modal>;
}
