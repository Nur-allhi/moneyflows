import { useReplay } from '../../hooks/useReplay';
import styles from '../TransactionFormModal.module.css';

export function EmptyAccountsState({ onClose }: { onClose: () => void }) {
  const [closeKey, replayClose] = useReplay();
  const [backKey, replayBack] = useReplay();
  return (
    <>
      <div className={styles.mobileLayout}>
        <div className={styles.wizard} onClick={onClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} />
            <div className={styles.header}><h2>New Transaction</h2><button className={`${styles.closeBtn} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close"><span className="anim-target" key={closeKey}>&times;</span></button></div>
            <div className="empty-state"><div className="empty-state-icon">{'\u{1F4B0}'}</div><p className="empty-state-text">No accounts available</p><button className={`retry-btn ${backKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayBack(); onClose(); }}><span className="anim-target" key={backKey}>Go Back</span></button></div>
          </div>
        </div>
      </div>
      <div className={styles.desktopLayout}>
        <div className={styles.desktopOverlay} onClick={onClose} />
        <div className={styles.desktopModal}>
          <div className={styles.modalHeader}><h2>New Transaction</h2><button className={`${styles.closeBtn} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close"><span className="anim-target" key={closeKey}>&times;</span></button></div>
          <div className="empty-state"><div className="empty-state-icon">{'\u{1F4B0}'}</div><p className="empty-state-text">No accounts available</p><button className={`retry-btn ${backKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayBack(); onClose(); }}><span className="anim-target" key={backKey}>Go Back</span></button></div>
        </div>
      </div>
    </>
  );
}
export function ErrorState({ error, onRetry, onClose }: { error: string; onRetry: () => void; onClose: () => void }) {
  const [closeKey, replayClose] = useReplay();
  const [retryKey, replayRetry] = useReplay();
  return (
    <>
      <div className={styles.mobileLayout}>
        <div className={styles.wizard} onClick={onClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} /><div className={styles.header}><h2>New Transaction</h2><button className={`${styles.closeBtn} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close"><span className="anim-target" key={closeKey}>&times;</span></button></div>
            <div className="error-state"><div className="error-state-icon">{'\u26A0\uFE0F'}</div><p className="error-state-text">{error}</p><button className={`retry-btn ${retryKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayRetry(); onRetry(); }}><span className="anim-target" key={retryKey}>Retry</span></button></div>
          </div>
        </div>
      </div>
      <div className={styles.desktopLayout}>
        <div className={styles.desktopOverlay} onClick={onClose} /><div className={styles.desktopModal}><div className={styles.modalHeader}><h2>New Transaction</h2><button className={`${styles.closeBtn} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close"><span className="anim-target" key={closeKey}>&times;</span></button></div><div className="error-state"><div className="error-state-icon">{'\u26A0\uFE0F'}</div><p className="error-state-text">{error}</p><button className={`retry-btn ${retryKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayRetry(); onRetry(); }}><span className="anim-target" key={retryKey}>Retry</span></button></div></div>
      </div>
    </>
  );
}
export function LoadingState({ onClose }: { onClose: () => void }) {
  const [closeKey, replayClose] = useReplay();
  return (
    <>
      <div className={styles.mobileLayout}>
        <div className={styles.wizard} onClick={onClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} /><div className={styles.header}><h2>New Transaction</h2><button className={`${styles.closeBtn} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close"><span className="anim-target" key={closeKey}>&times;</span></button></div>
            <div className={styles.loadingBody}><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /></div>
          </div>
        </div>
      </div>
      <div className={styles.desktopLayout}><div className={styles.desktopOverlay} onClick={onClose} /><div className={styles.desktopModal}><div className={styles.modalHeader}><h2>New Transaction</h2><button className={`${styles.closeBtn} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close"><span className="anim-target" key={closeKey}>&times;</span></button></div><div className={styles.loadingBody}><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-row" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-row" /></div><div className={styles.modalActions}><div className="skeleton skeleton-wizard" /><div className="skeleton skeleton-wizard" /></div></div></div>
    </>
  );
}
