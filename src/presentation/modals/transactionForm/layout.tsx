import { SegmentedTabs } from '../../components';
import { handleFormFocus } from '../../utils/focus';
import styles from '../TransactionFormModal.module.css';

interface Props {
  tab: string;
  setTab: (v: string) => void;
  tabs: { key: string; label: string }[];
  formFields: React.ReactNode;
  buttonLabel: string;
  handleSubmit: () => void;
  handleClose: () => void;
  closing: boolean;
  rawAmount: string;
  errors: Record<string, string>;
}

export function TransactionFormLayout(props: Props) {
  const { tab, setTab, tabs, formFields, buttonLabel, handleSubmit, handleClose, closing, rawAmount, errors } = props;
  return (
    <>
      <div className={`${styles.mobileLayout} ${closing ? styles.closing : ''}`}>
        <div className={styles.wizard} onClick={handleClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} />
            <div className={styles.header}>
              <h2>New Transaction</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
            </div>
            <div className={styles.filterTabs}>
              <SegmentedTabs tabs={tabs} activeKey={tab} onChange={setTab} />
            </div>
            <div className={styles.formBody} onFocus={handleFormFocus} onKeyDown={(e) => { if (e.key !== 'Enter' || e.shiftKey) return; e.preventDefault(); void handleSubmit(); }}>
              {formFields}
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={!rawAmount || Object.keys(errors).length > 0}>{buttonLabel}</button>
            </div>
          </div>
        </div>
      </div>
      <div className={`${styles.desktopLayout} ${closing ? styles.closing : ''}`}>
        <div className={styles.desktopOverlay} onClick={handleClose} />
        <div className={styles.desktopModal}>
          <div className={styles.modalHeader}>
            <h2>New Transaction</h2>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
          </div>
          <div className={styles.modalBody} onKeyDown={(e) => { if (e.key !== 'Enter' || e.shiftKey) return; e.preventDefault(); void handleSubmit(); }}>
            <SegmentedTabs tabs={tabs} activeKey={tab} onChange={setTab} />
            {formFields}
          </div>
          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSubmit} disabled={!rawAmount || Object.keys(errors).length > 0}>{buttonLabel}</button>
          </div>
        </div>
      </div>
    </>
  );
}
