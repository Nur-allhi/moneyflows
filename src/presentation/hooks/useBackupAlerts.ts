import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { folderSync, isFsaSupported } from '../../infrastructure/database/FolderSync';
import type { IntegrityReport } from '../../core/domain/transactionIntegrity';
import type { StorageHealth } from '../../core/ports/IDatabaseService';
import { BACKUP_ALERT_POLL_MS } from '../constants/config';

export type BackupAlertId =
  | 'folder-unsupported'
  | 'folder-not-set-up'
  | 'folder-permission'
  | 'folder-empty'
  | 'no-restore-points'
  | 'save-failed'
  | 'integrity';

export interface BackupAlert {
  id: BackupAlertId;
  tone: 'warn' | 'info';
  title: string;
  detail: string;
}

/** Read-only inputs gathered from cheap sources; separate so the mapping is testable. */
export interface BackupAlertInputs {
  fsaSupported: boolean;
  folderSet: boolean;
  permissionGranted: boolean;
  folderFileCount: number;
  snapshots: number;
  storageHealth: StorageHealth | null;
  /** null = the integrity scan could not run (never treated as an issue). */
  integrityIssues: number | null;
}

export function deriveBackupAlerts(i: BackupAlertInputs): BackupAlert[] {
  const alerts: BackupAlert[] = [];

  if (!i.fsaSupported) {
    alerts.push({
      id: 'folder-unsupported',
      tone: 'info',
      title: 'Folder backup unavailable',
      detail: 'This browser cannot back up to a folder. Use Chrome or Edge, or export your data from Backup settings.',
    });
  } else if (!i.folderSet) {
    alerts.push({
      id: 'folder-not-set-up',
      tone: 'warn',
      title: 'No backup folder chosen',
      detail: 'Your data is not being copied to a folder. Open Backup settings to choose one.',
    });
  } else if (!i.permissionGranted) {
    alerts.push({
      id: 'folder-permission',
      tone: 'warn',
      title: 'Backup folder needs permission',
      detail: 'Backups are paused until you re-authorize the folder.',
    });
  } else if (i.folderFileCount === 0) {
    alerts.push({
      id: 'folder-empty',
      tone: 'info',
      title: 'Backup folder has no files yet',
      detail: 'The first backup file will appear after your next save.',
    });
  }

  if (i.snapshots === 0) {
    alerts.push({
      id: 'no-restore-points',
      tone: 'warn',
      title: 'No restore points yet',
      detail: 'There is no saved snapshot to roll back to if something goes wrong.',
    });
  }
  if (i.storageHealth?.lastFlushFailed) {
    alerts.push({
      id: 'save-failed',
      tone: 'warn',
      title: 'Last save failed',
      detail: 'Check free space or browser storage — your latest changes may not be stored.',
    });
  }
  if (i.integrityIssues !== null && i.integrityIssues > 0) {
    alerts.push({
      id: 'integrity',
      tone: 'warn',
      title: i.integrityIssues === 1
        ? '1 record needs attention'
        : `${i.integrityIssues} records need attention`,
      detail: 'Some transactions do not check out. See Data Integrity in Backup settings.',
    });
  }
  return alerts;
}

/**
 * Header bell state (T-176). Cheap read-only poll over the same signals the
 * Backup & Storage card shows. Cloud sync is deliberately excluded — it owns
 * the separate sync glyph in the header. Every read is isolated so one
 * unavailable source can never hide the other alerts.
 */
export function useBackupAlerts(): { alerts: BackupAlert[]; summary: string } {
  const [alerts, setAlerts] = useState<BackupAlert[]>([]);
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      let folderSet = false;
      let permissionGranted = false;
      let folderFileCount = 0;
      let snapshots = 0;
      let storageHealth: StorageHealth | null = null;
      let integrityIssues: number | null = null;

      try {
        const handle = await folderSync.getFolderHandle();
        folderSet = !!handle;
        if (handle) {
          permissionGranted = await folderSync.hasPermission();
          if (permissionGranted) folderFileCount = (await folderSync.listFiles()).length;
        }
      } catch { /* handle store not ready */ }

      try { snapshots = (await getDatabase().getSnapshots()).length; } catch { /* db not ready */ }
      try { storageHealth = getDatabase().getStorageHealth(); } catch { /* db not ready */ }
      try {
        const report: IntegrityReport = await getDatabase().findInvalidTransactions();
        integrityIssues = report.issues.length;
      } catch { /* scan unavailable — never a warning by itself */ }

      if (!alive) return;
      setAlerts(deriveBackupAlerts({
        fsaSupported: isFsaSupported,
        folderSet,
        permissionGranted,
        folderFileCount,
        snapshots,
        storageHealth,
        integrityIssues,
      }));
    };

    void refresh();
    const timer = setInterval(() => { void refresh(); }, BACKUP_ALERT_POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const onStatus = () => { void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('moneyflows:backup-status', onStatus);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('moneyflows:backup-status', onStatus);
    };
  }, [pathname]);

  const summary = alerts.length === 0
    ? ''
    : alerts.length === 1
      ? `Backup alert: ${alerts[0]!.title}`
      : `${alerts.length} backup issues need attention`;
  return { alerts, summary };
}
