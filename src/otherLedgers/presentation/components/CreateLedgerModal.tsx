import { useState, useEffect, useMemo } from 'react';
import { Modal, BottomSheet } from '../../../presentation/components';
import { DatePicker } from '../../../components/ui/date-picker';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useReplay } from '../../../presentation/hooks/useReplay';
import type { Member } from '../../../core/domain/Member';
import txStyles from '../../../presentation/modals/TransactionFormModal.module.css';

export function CreateLedgerModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated?: () => void }) {
  const createLedger = useOtherLedgerStore((s) => s.createLedger);
  const allLedgers = useOtherLedgerStore((s) => s.ledgers);
  const accounts = useAccountStore((s) => s.accounts);
  const [name, setName] = useState('');
  const [startingDate, setStartingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [ownerType, setOwnerType] = useState<'member' | 'external'>('member');
  const [ownerMemberId, setOwnerMemberId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [members, setMembers] = useState<Member[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showOwnerPicker, setShowOwnerPicker] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [memberTKey, replayMemberT] = useReplay();
  const [extTKey, replayExtT] = useReplay();
  const [memberTrigKey, replayMemberTrig] = useReplay();
  const [ownerTrigKey, replayOwnerTrig] = useReplay();
  const [memberCloseKey, replayMemberClose] = useReplay();
  const [memberListKey, replayMemberList] = useReplay();
  const [memberPicked, setMemberPicked] = useState<string | null>(null);
  const [ownerCloseKey, replayOwnerClose] = useReplay();
  const [ownerAddKey, replayOwnerAdd] = useReplay();
  const [ownerListKey, replayOwnerList] = useReplay();
  const [ownerPicked, setOwnerPicked] = useState<string | null>(null);
  const [cancelKey, replayCancel] = useReplay();
  const [createKey, replayCreate] = useReplay();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    getDatabase().getMembers().then(setMembers).catch(() => {});
  }, [isOpen]);
  useEffect(() => {
    if (members.length > 0 && !ownerMemberId) setOwnerMemberId(members[0]!.id);
  }, [members, ownerMemberId]);

  const counterpartyNames = useMemo(() => Array.from(new Set(accounts.filter((a) => a.type === 'counterparty').map((a) => a.name).filter(Boolean))), [accounts]);
  const existingExternalNames = useMemo(() => Array.from(new Set(allLedgers.filter((l) => l.ownerType === 'external' && l.ownerName).map((l) => l.ownerName as string))), [allLedgers]);
  const allExternalNames = useMemo(() => Array.from(new Set([...counterpartyNames, ...existingExternalNames])).sort(), [counterpartyNames, existingExternalNames]);

  const handleSave = async () => {
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      setError('Name must be 3-50 characters');
      return;
    }
    try {
      await createLedger({
        name: trimmed,
        startingDate,
        ownerType,
        ownerMemberId: ownerType === 'member' ? ownerMemberId : undefined,
        ownerName: ownerType === 'external' ? ownerName : undefined,
        openingBalance: Number(openingBalance) || 0,
      });
      setName('');
      setOwnerName('');
      setOpeningBalance('0');
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

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
        <button onClick={() => { replayMemberT(); setOwnerType('member'); }} className={memberTKey > 0 ? 'anim-pop' : ''} style={{ flex: 1, padding: 10, borderRadius: 9999, border: ownerType === 'member' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: ownerType === 'member' ? 'var(--color-primary)' : 'var(--color-surface)', color: ownerType === 'member' ? 'white' : 'var(--color-text)' }}><span className="anim-target" key={memberTKey}>Member</span></button>
        <button onClick={() => { replayExtT(); setOwnerType('external'); }} className={extTKey > 0 ? 'anim-pop' : ''} style={{ flex: 1, padding: 10, borderRadius: 9999, border: ownerType === 'external' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: ownerType === 'external' ? 'var(--color-primary)' : 'var(--color-surface)', color: ownerType === 'external' ? 'white' : 'var(--color-text)' }}><span className="anim-target" key={extTKey}>Other person</span></button>
      </div>
      {ownerType === 'member' ? (
        <div className={txStyles.fieldGroup}>
          <span className={txStyles.fieldLabel}>Member</span>
          <button type="button" className={`${txStyles.pickerTrigger} ${ownerMemberId ? txStyles.pickerHasValue : ''} ${memberTrigKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayMemberTrig(); setShowMemberPicker(true); }}>
            <span className="anim-target" key={memberTrigKey}>{ownerMemberId
              ? <><span className={txStyles.pickerValue}>{members.find((m) => m.id === ownerMemberId)?.name ?? 'Select member'}</span><span className={txStyles.pickerArrow}>▾</span></>
              : <span className={txStyles.pickerPlaceholder}>Select member</span>}</span>
          </button>
        </div>
      ) : (
        <div className={txStyles.fieldGroup}>
          <span className={txStyles.fieldLabel}>Other Person</span>
          <button type="button" className={`${txStyles.pickerTrigger} ${ownerName ? txStyles.pickerHasValue : ''} ${ownerTrigKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayOwnerTrig(); setShowOwnerPicker(true); }}>
            <span className="anim-target" key={ownerTrigKey}>{ownerName
              ? <><span className={txStyles.pickerValue}>{ownerName}</span><span className={txStyles.pickerArrow}>▾</span></>
              : <span className={txStyles.pickerPlaceholder}>Select person or write new</span>}</span>
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
              <button className={`${txStyles.pickerClose} ${memberCloseKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayMemberClose(); setShowMemberPicker(false); }}>
                <svg key={memberCloseKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className={txStyles.pickerList}>
              {members.length === 0
                ? <div className={txStyles.pickerEmpty}>No members yet</div>
                : members.map((m) => (
                    <button key={m.id} className={`${txStyles.pickerItem} ${memberPicked === m.id && memberListKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayMemberList(); setMemberPicked(m.id); setOwnerMemberId(m.id); setShowMemberPicker(false); }}>
                      <span className="anim-target" key={`${m.id}-${memberPicked === m.id ? memberListKey : 0}`}><span className={txStyles.pickerItemName}>{m.name}</span></span>
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
              <button className={`${txStyles.pickerClose} ${ownerCloseKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayOwnerClose(); setShowOwnerPicker(false); }}>
                <svg key={ownerCloseKey} width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
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
              <button className={`${txStyles.tagPickerAdd} ${ownerAddKey > 0 ? 'anim-pop' : ''}`} disabled={!newOwnerName.trim()} onClick={() => {
                replayOwnerAdd();
                if (newOwnerName.trim()) { setOwnerName(newOwnerName.trim()); setNewOwnerName(''); setShowOwnerPicker(false); }
              }}><span className="anim-target" key={ownerAddKey}>Add</span></button>
            </div>
            <div className={txStyles.pickerList}>
              {allExternalNames.length === 0
                ? <div className={txStyles.pickerEmpty}>No other persons yet — write one above</div>
                : allExternalNames.map((n) => (
                    <button key={n} className={`${txStyles.pickerItem} ${ownerPicked === n && ownerListKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayOwnerList(); setOwnerPicked(n); setOwnerName(n); setShowOwnerPicker(false); }}>
                      <span className="anim-target" key={`${n}-${ownerPicked === n ? ownerListKey : 0}`}><span className={txStyles.pickerItemName}>{n}</span></span>
                    </button>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) return <BottomSheet isOpen={isOpen} onClose={onClose} title="New Ledger">{form}<div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button onClick={() => { replayCancel(); onClose(); }} className={cancelKey > 0 ? 'anim-pop' : ''} style={{ flex: 1, padding: 10, borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)' }}><span className="anim-target" key={cancelKey}>Cancel</span></button><button onClick={() => { replayCreate(); void handleSave(); }} className={createKey > 0 ? 'anim-pop' : ''} style={{ flex: 1, padding: 10, borderRadius: 9999, background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', border: 'none' }}><span className="anim-target" key={createKey}>Create</span></button></div></BottomSheet>;
  return <Modal isOpen={isOpen} onClose={onClose} title="New Ledger" onSave={handleSave} saveLabel="Create">{form}</Modal>;
}
