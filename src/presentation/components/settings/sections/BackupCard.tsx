import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase } from '../../../../infrastructure/database/getDatabase';
import { ProgressBar } from '../../ProgressBar';
import { SettingsDisclosure } from '../SettingsDisclosure';
import { CloudSyncSection } from '../CloudSyncSection';
import { useBackupState } from './useBackupState';
import { RestorePoints } from './RestorePoints';
import { FolderBackup } from './FolderBackup';
import { EngineHealth } from './EngineHealth';
import { IntegrityRow } from './IntegrityRow';
import { ImportExportRow } from './ImportExportRow';
import type { Cx } from './cx';

interface BackupCardProps {
  cx: Cx;
  /** Deep link ?tab=backup opens this card on mount (remount via key). */
  defaultOpen?: boolean;
  /** Deep link ?open=google-drive-sync opens the Google section. */
  forceOpenSync?: boolean;
}

/** Restore points + folder backup + Drive sync + engine + import/export. */
export function BackupCard({ cx, defaultOpen = false, forceOpenSync = false }: BackupCardProps) {
  const navigate = useNavigate();
  const backup = useBackupState();
  const refreshBackup = backup.refresh;
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Refresh-on-mount lives here now (was in the Page effect).
  useEffect(() => { void refreshBackup(); }, [refreshBackup]);

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(10);
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.db';
      const file = await new Promise<File | null>((resolve) => {
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.addEventListener('cancel', () => resolve(null), { once: true });
        input.click();
        // Fallback for browsers without cancel event — check after focus returns
        const onFocus = () => {
          setTimeout(() => {
            if (!input.files?.length) resolve(null);
          }, 300);
          window.removeEventListener('focus', onFocus);
        };
        window.addEventListener('focus', onFocus, { once: true });
      });
      if (!file) {
        setImporting(false);
        setImportProgress(0);
        return;
      }
      setImportProgress(30);
      const buffer = await file.arrayBuffer();
      setImportProgress(60);
      await getDatabase().importFromBytes(new Uint8Array(buffer));
      setImportProgress(100);
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 400);
    } catch {
      setImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <>
      <SettingsDisclosure
        title="Backup & Storage"
        subtitle="Restore points, cloud folder, engine and import/export"
        badge={backup.snapshots.length > 0 ? `${backup.snapshots.length}` : undefined}
        defaultOpen={defaultOpen}
      >
        {backup.restoreError && <div className={cx.errorMsg}>{backup.restoreError}</div>}
        <div className={cx.sectionTitle}>Restore Points</div>
        <RestorePoints
          cx={cx}
          snapshots={backup.snapshots}
          restoring={backup.restoring}
          onRestore={backup.handleRestore}
          formatTime={backup.formatSnapshotTime}
        />
        <div className={cx.sectionTitle}>Cloud Backup</div>
        <FolderBackup
          cx={cx}
          folderName={backup.folderName}
          fsPermission={backup.fsPermission}
          backupFiles={backup.backupFiles}
          restoringFile={backup.restoringFile}
          onPickFolder={backup.handlePickFolder}
          onReauthorize={backup.handleReauthorize}
          onStopBackup={backup.handleStopBackup}
          onRestoreFile={backup.handleRestoreFile}
        />
        <CloudSyncSection forceOpen={forceOpenSync} />
        <div className={cx.sectionTitle}>Engine Health</div>
        <EngineHealth cx={cx} storageHealth={backup.storageHealth} />
        <div className={cx.sectionTitle}>Data Integrity</div>
        <IntegrityRow cx={cx} report={backup.integrity} />
        <div className={cx.sectionTitle}>Import / Export</div>
        <ImportExportRow cx={cx} onExport={backup.handleExportDb} onImport={handleImport} importDisabled={importing} />
      </SettingsDisclosure>
      {importing && (
        <div className={cx.importOverlay}>
          <div className={cx.importModal}>
            <div className={cx.importTitle}>Importing database…</div>
            <ProgressBar percent={importProgress} />
            <div className={cx.importSub}>Please wait — refreshing to dashboard</div>
          </div>
        </div>
      )}
    </>
  );
}
