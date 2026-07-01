import { Modal } from '../components';
import { useTransactionStore } from '../stores/useTransactionStore';

interface DeleteConfirmModalProps {
  txId: string;
  onClose: () => void;
}

export function DeleteConfirmModal({ txId, onClose }: DeleteConfirmModalProps) {
  const softDeleteTransaction = useTransactionStore((s) => s.softDeleteTransaction);

  const handleDelete = async () => {
    await softDeleteTransaction(txId);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Delete Transaction" saveLabel="Delete" onSave={handleDelete}>
      <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '12px 0' }}>
        Are you sure you want to delete this transaction? It will be moved to the Recycle Bin and can be restored within 30 days.
      </p>
    </Modal>
  );
}
