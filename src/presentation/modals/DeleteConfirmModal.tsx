import { Modal, BottomSheet } from '../components';
import { useState, useEffect } from 'react';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../../loans/presentation/stores/useLoanStore';
import { useReplay } from '../hooks/useReplay';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import styles from './DeleteConfirmModal.module.css';

interface DeleteConfirmModalProps {
  txId: string;
  onClose: () => void;
}

export function DeleteConfirmModal({ txId, onClose }: DeleteConfirmModalProps) {
  const softDeleteTransaction = useTransactionStore((s) => s.softDeleteTransaction);
  const reverseRepayment = useLoanStore((s) => s.reverseRepayment);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [cancelKey, replayCancel] = useReplay();
  const [deleteKey, replayDelete] = useReplay();
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // T-122: if this transaction mirrors an Other Ledger row, the delete offers
  // taking the mirror down too (checked by default — both stay restorable from
  // the Recycle Bin, so the choice is reversible within the 30-day window).
  const [linkedLedgerName, setLinkedLedgerName] = useState<string | null>(null);
  const [deleteLinked, setDeleteLinked] = useState(true);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const db = getDatabase();
        const entry = await db.getOtherLedgerEntryByTransactionId(txId);
        if (cancelled) return;
        if (!entry) { setLinkedLedgerName(null); return; }
        const ledger = await db.getOtherLedgerById(entry.ledgerId);
        if (cancelled) return;
        setLinkedLedgerName(ledger?.name ?? null);
      } catch {
        if (!cancelled) setLinkedLedgerName(null);
      }
    })();
    return () => { cancelled = true; };
  }, [txId]);

  const handleDelete = async () => {
    const tx = useTransactionStore.getState().transactions.find((t) => t.id === txId);
    await softDeleteTransaction(txId, linkedLedgerName !== null && deleteLinked);
    if (tx && tx.type === 'repay' && tx.sourceAccount) {
      await reverseRepayment(tx.sourceAccount, tx.amount);
    }
    onClose();
  };

  const descStyle: React.CSSProperties = { textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '12px 0' };

  if (isMobile) {
    return (
      <BottomSheet isOpen onClose={onClose} title="Delete Transaction">
        <p style={descStyle}>
          Are you sure you want to delete this transaction? It will be moved to the Recycle Bin and can be restored within 30 days.
        </p>
        {linkedLedgerName && (
          <label className={styles.linkRow}>
            <input type="checkbox" className={styles.linkCheckbox} checked={deleteLinked} onChange={(e) => setDeleteLinked(e.target.checked)} />
            <span className={styles.linkLabel}>{`Also delete the linked ledger row (#${linkedLedgerName})`}</span>
          </label>
        )}
        <div style={{ display: 'flex', gap: 10, padding: '8px 0 4px' }}>
          <button onClick={() => { replayCancel(); onClose(); }} className={cancelKey > 0 ? 'anim-pop' : ''} style={{ flex: 1, padding: 14, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)', color: 'var(--color-text)', font: '500 14px var(--font-display)', cursor: 'pointer' }}><span className="anim-target" key={cancelKey}>Cancel</span></button>
          <button onClick={() => { replayDelete(); void handleDelete(); }} className={deleteKey > 0 ? 'anim-pop' : ''} style={{ flex: 1, padding: 14, border: 'none', borderRadius: 12, background: 'var(--color-coral)', color: '#fff', font: '500 14px var(--font-display)', cursor: 'pointer' }}><span className="anim-target" key={deleteKey}>Delete</span></button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Delete Transaction" saveLabel="Delete" onSave={handleDelete}>
      <p style={descStyle}>
        Are you sure you want to delete this transaction? It will be moved to the Recycle Bin and can be restored within 30 days.
      </p>
      {linkedLedgerName && (
        <label className={styles.linkRow}>
          <input type="checkbox" className={styles.linkCheckbox} checked={deleteLinked} onChange={(e) => setDeleteLinked(e.target.checked)} />
          <span className={styles.linkLabel}>{`Also delete the linked ledger row (#${linkedLedgerName})`}</span>
        </label>
      )}
    </Modal>
  );
}
