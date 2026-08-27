import { useState, useEffect } from 'react';
import { Modal, BottomSheet } from '../../../presentation/components';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import type { Member } from '../../../core/domain/Member';

export function CreateLedgerModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated?: () => void }) {
  const createLedger = useOtherLedgerStore((s) => s.createLedger);
  const [name, setName] = useState('');
  const [startingDate, setStartingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [ownerType, setOwnerType] = useState<'member' | 'external'>('member');
  const [ownerMemberId, setOwnerMemberId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    getDatabase().getMembers().then(setMembers).catch(() => {});
  }, []);
  useEffect(() => {
    if (members.length > 0 && !ownerMemberId) setOwnerMemberId(members[0]!.id);
  }, [members, ownerMemberId]);

  const handleSave = async () => {
    setError(null);
    try {
      await createLedger({
        name,
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
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Ledger Name (3–50)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. House Rent" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Starting Date</span>
        <input type="date" value={startingDate} onChange={(e) => setStartingDate(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setOwnerType('member')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: ownerType === 'member' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: ownerType === 'member' ? 'var(--color-primary)' : 'var(--color-surface)', color: ownerType === 'member' ? 'white' : 'var(--color-text)' }}>Member</button>
        <button onClick={() => setOwnerType('external')} style={{ flex: 1, padding: 10, borderRadius: 9999, border: ownerType === 'external' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: ownerType === 'external' ? 'var(--color-primary)' : 'var(--color-surface)', color: ownerType === 'external' ? 'white' : 'var(--color-text)' }}>Other person</button>
      </div>
      {ownerType === 'member' ? (
        <select value={ownerMemberId} onChange={(e) => setOwnerMemberId(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      ) : (
        <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Person name" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Opening Balance</span>
        <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
      </label>
      {error && <div style={{ color: 'var(--color-expense)', fontSize: 13 }}>{error}</div>}
    </div>
  );

  if (isMobile) return <BottomSheet isOpen={isOpen} onClose={onClose} title="New Ledger">{form}<div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 9999, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)' }}>Cancel</button><button onClick={handleSave} style={{ flex: 1, padding: 10, borderRadius: 9999, background: 'var(--color-primary)', color: 'white', border: 'none' }}>Create</button></div></BottomSheet>;
  return <Modal isOpen={isOpen} onClose={onClose} title="New Ledger" onSave={handleSave} saveLabel="Create">{form}</Modal>;
}
