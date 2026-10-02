import styles from '../TransactionFormModal.module.css';

export function EmptyAccountsState({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className={styles.mobileLayout}>
        <div className={styles.wizard} onClick={onClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} />
            <div className={styles.header}><h2>New Transaction</h2><button className={styles.closeBtn} onClick={onClose} aria-label="Close">&times;</button></div>
            <div className="empty-state"><div className="empty-state-icon">{'\u{1F4B0}'}</div><p className="empty-state-text">No accounts available</p><button className="retry-btn" onClick={onClose}>Go Back</button></div>
          </div>
        </div>
      </div>
      <div className={styles.desktopLayout}>
        <div className={styles.desktopOverlay} onClick={onClose} />
        <div className={styles.desktopModal}>
          <div className={styles.modalHeader}><h2>New Transaction</h2><button className={styles.closeBtn} onClick={onClose} aria-label="Close">&times;</button></div>
          <div className="empty-state"><div className="empty-state-icon">{'\u{1F4B0}'}</div><p className="empty-state-text">No accounts available</p><button className="retry-btn" onClick={onClose}>Go Back</button></div>
        </div>
      </div>
    </>
  );
}
export function ErrorState({ error, onRetry, onClose }: { error: string; onRetry: () => void; onClose: () => void }) {
  return (
    <>
      <div className={styles.mobileLayout}>
        <div className={styles.wizard} onClick={onClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} /><div className={styles.header}><h2>New Transaction</h2><button className={styles.closeBtn} onClick={onClose} aria-label="Close">&times;</button></div>
            <div className="error-state"><div className="error-state-icon">{'\u26A0\uFE0F'}</div><p className="error-state-text">{error}</p><button className="retry-btn" onClick={onRetry}>Retry</button></div>
          </div>
        </div>
      </div>
      <div className={styles.desktopLayout}>
        <div className={styles.desktopOverlay} onClick={onClose} /><div className={styles.desktopModal}><div className={styles.modalHeader}><h2>New Transaction</h2><button className={styles.closeBtn} onClick={onClose} aria-label="Close">&times;</button></div><div className="error-state"><div className="error-state-icon">{'\u26A0\uFE0F'}</div><p className="error-state-text">{error}</p><button className="retry-btn" onClick={onRetry}>Retry</button></div></div>
      </div>
    </>
  );
}
export function LoadingState({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className={styles.mobileLayout}>
        <div className={styles.wizard} onClick={onClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} /><div className={styles.header}><h2>New Transaction</h2><button className={styles.closeBtn} onClick={onClose} aria-label="Close">&times;</button></div>
            <div className={styles.loadingBody}><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /></div>
          </div>
        </div>
      </div>
      <div className={styles.desktopLayout}><div className={styles.desktopOverlay} onClick={onClose} /><div className={styles.desktopModal}><div className={styles.modalHeader}><h2>New Transaction</h2><button className={styles.closeBtn} onClick={onClose} aria-label="Close">&times;</button></div><div className={styles.loadingBody}><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /></div><div className={styles.modalActions}><div className="skeleton skeleton-wizard" /><div className="skeleton skeleton-wizard" /></div></div></div>
    </>
  );
}
