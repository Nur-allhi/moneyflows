import { useCallback } from 'react';
import { Modal } from '../../../presentation/components/Modal';
import { LoanReportViewer } from './LoanReportViewer';
import styles from './LoanReportModal.module.css';

interface LoanReportModalProps {
  onClose: () => void;
  initialBorrowerAccountId?: string;
}

export function LoanReportModal({ onClose, initialBorrowerAccountId }: LoanReportModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen title="Loan Report" onClose={handleClose} className={styles.reportModal} footer={
      <div className={styles.footerRow}>
        <button className={styles.cancelBtn} onClick={handleClose}>Close</button>
      </div>
    }>
      <LoanReportViewer initialBorrowerAccountId={initialBorrowerAccountId} onClose={handleClose} />
    </Modal>
  );
}
