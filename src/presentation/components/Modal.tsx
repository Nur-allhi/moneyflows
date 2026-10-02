import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { handleFormFocus } from '../utils/focus';
import { useReplay } from '../hooks/useReplay';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  cancelLabel?: string;
  saveLabel?: string;
  onCancel?: () => void;
  onSave?: () => void;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  cancelLabel = 'Cancel',
  saveLabel = 'Save',
  onCancel,
  onSave,
  className = '',
}: ModalProps) {
  const [closeKey, replayClose] = useReplay();
  const [cancelKey, replayCancel] = useReplay();
  const [saveKey, replaySave] = useReplay();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={`${styles.close} ${closeKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClose(); onClose(); }} aria-label="Close"><span className="anim-target" key={closeKey}>&times;</span></button>
        </div>
        <div className={styles.body} onFocus={handleFormFocus}>
          {children}
        </div>
        {footer ?? (
          <div className={styles.footer}>
            <button className={`${styles.btnCancel} ${cancelKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCancel(); handleCancel(); }}><span className="anim-target" key={cancelKey}>{cancelLabel}</span></button>
            <button className={`${styles.btnSave} ${saveKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replaySave(); onSave?.(); }}><span className="anim-target" key={saveKey}>{saveLabel}</span></button>
          </div>
        )}
      </div>
    </div>
  );
}
