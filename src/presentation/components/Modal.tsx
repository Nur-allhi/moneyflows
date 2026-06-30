import type { ReactNode } from 'react';
import { useEffect } from 'react';
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
          <button className={styles.close} onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
        {footer ?? (
          <div className={styles.footer}>
            <button className={styles.btnCancel} onClick={handleCancel}>{cancelLabel}</button>
            <button className={styles.btnSave} onClick={onSave}>{saveLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}
