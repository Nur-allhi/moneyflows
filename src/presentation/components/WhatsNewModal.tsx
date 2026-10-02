import { useReplay } from '../hooks/useReplay';
import styles from './WhatsNewModal.module.css';

interface WhatsNewModalProps {
  isOpen: boolean;
  version: string;
  items: string[];
  onClose: () => void;
}

export function WhatsNewModal({ isOpen, version, items, onClose }: WhatsNewModalProps) {
  const [closeKey, replayClose] = useReplay();
  const [gotItKey, replayGotIt] = useReplay();
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <button className={`${styles.closeBtn} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close">
            <svg key={closeKey} width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className={styles.title}>What&apos;s New in v{version}</span>
        </div>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item} className={styles.item}>{item}</li>
          ))}
        </ul>
        <button className={`${styles.gotIt} ${gotItKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayGotIt(); onClose(); }}><span className="anim-target" key={gotItKey}>Got it</span></button>
      </div>
    </div>
  );
}
