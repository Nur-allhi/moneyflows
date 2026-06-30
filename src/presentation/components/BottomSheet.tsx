import type { ReactNode } from 'react';
import { useEffect } from 'react';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className = '' }: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={`${styles.sheet} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </>
  );
}
