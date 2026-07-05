import { Modal, BottomSheet } from '../components';
import { useState, useEffect } from 'react';
import { useTransactionStore } from '../stores/useTransactionStore';

interface DeleteConfirmModalProps {
  txId: string;
  onClose: () => void;
}

export function DeleteConfirmModal({ txId, onClose }: DeleteConfirmModalProps) {
  const softDeleteTransaction = useTransactionStore((s) => s.softDeleteTransaction);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleDelete = async () => {
    await softDeleteTransaction(txId);
    onClose();
  };

  const descStyle: React.CSSProperties = { textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '12px 0' };

  if (isMobile) {
    return (
      <BottomSheet isOpen onClose={onClose} title="Delete Transaction">
        <p style={descStyle}>
          Are you sure you want to delete this transaction? It will be moved to the Recycle Bin and can be restored within 30 days.
        </p>
        <div style={{ display: 'flex', gap: 10, padding: '8px 0 4px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)', color: 'var(--color-text)', font: '500 14px var(--font-display)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleDelete} style={{ flex: 1, padding: 14, border: 'none', borderRadius: 12, background: 'var(--color-coral)', color: '#fff', font: '500 14px var(--font-display)', cursor: 'pointer' }}>Delete</button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Delete Transaction" saveLabel="Delete" onSave={handleDelete}>
      <p style={descStyle}>
        Are you sure you want to delete this transaction? It will be moved to the Recycle Bin and can be restored within 30 days.
      </p>
    </Modal>
  );
}
