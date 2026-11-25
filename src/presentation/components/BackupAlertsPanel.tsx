import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from './BottomSheet';
import { Modal } from './Modal';
import { useReplay } from '../hooks/useReplay';
import type { BackupAlert } from '../hooks/useBackupAlerts';
import styles from './BackupAlertsPanel.module.css';

interface BackupAlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: BackupAlert[];
}

/** Notification list behind the header bell. Desktop modal, mobile sheet (§9). */
export function BackupAlertsPanel({ isOpen, onClose, alerts }: BackupAlertsPanelProps) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [actionKey, replayAction] = useReplay();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const openBackup = () => {
    replayAction();
    onClose();
    navigate('/settings?tab=backup');
  };

  const intro = (
    <p className={styles.intro}>
      {alerts.length === 0
        ? 'No backup problems right now — your data is being saved and restore points exist.'
        : 'Your backup needs attention. Nothing has been changed — open Backup settings to fix these.'}
    </p>
  );

  const list = (
    <div className={styles.list}>
      {alerts.map((alert) => (
        <button
          key={alert.id}
          type="button"
          className={styles.alert}
          data-testid="backup-alert"
          data-alert-id={alert.id}
          onClick={openBackup}
        >
          <span className={`${styles.dot} ${alert.tone === 'warn' ? styles.warn : styles.info}`} />
          <span className={styles.copy}>
            <span className={styles.title}>{alert.title}</span>
            <span className={styles.detail}>{alert.detail}</span>
          </span>
        </button>
      ))}
    </div>
  );

  const action = (
    <button type="button" className={`${styles.action} ${actionKey > 0 ? 'anim-pop' : ''}`} onClick={openBackup}>
      <span className="anim-target" key={actionKey}>Open Backup settings</span>
    </button>
  );

  if (!isOpen) return null;

  return isMobile ? (
    <BottomSheet isOpen onClose={onClose} title="Backup alerts">
      {intro}
      {list}
      {action}
    </BottomSheet>
  ) : (
    <Modal isOpen onClose={onClose} title="Backup alerts" footer={<div className={styles.footer}>{action}</div>}>
      {intro}
      {list}
    </Modal>
  );
}
