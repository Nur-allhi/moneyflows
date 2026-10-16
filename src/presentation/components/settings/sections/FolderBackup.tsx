import { useState } from 'react';
import { isFsaSupported } from '../../../../infrastructure/database/FolderSync';
import disclosureStyles from '../SettingsDisclosure.module.css';
import type { Cx } from './cx';
import type { BackupFile } from './useBackupState';

interface FolderBackupProps {
  cx: Cx;
  folderName: string | null;
  fsPermission: boolean | null;
  backupFiles: BackupFile[];
  restoringFile: string | null;
  onPickFolder: () => void;
  onReauthorize: () => void;
  onStopBackup: () => void;
  onRestoreFile: (name: string) => void;
}

function fileLabel(name: string): string {
  const ts = name.replace('moneyflows-', '').replace('.db', '');
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(9, 11)}:${ts.slice(11, 13)}`;
}

/** Local-folder backup (Chrome/Edge File System Access). Card owns file-list expansion. */
export function FolderBackup({
  cx,
  folderName,
  fsPermission,
  backupFiles,
  restoringFile,
  onPickFolder,
  onReauthorize,
  onStopBackup,
  onRestoreFile,
}: FolderBackupProps) {
  const [showAllFiles, setShowAllFiles] = useState(false);

  if (!isFsaSupported) {
    return <div className={cx.emptyState}>Cloud backup requires Chrome or Edge</div>;
  }

  if (fsPermission === null) {
    return (
      <div className={cx.emptyState}>
        <button className={cx.actionBtn} onClick={onPickFolder}>Choose backup folder</button>
      </div>
    );
  }

  return (
    <>
      {fsPermission ? (
        <div className={cx.statusRow}>
          <span className={cx.statusDot} />
          <span className={cx.statusText}>Backing up to {folderName}</span>
          <button className={cx.restoreBtn} onClick={onStopBackup}>Stop backup</button>
          <button className={cx.restoreBtn} onClick={onPickFolder}>Change folder</button>
        </div>
      ) : (
        <div className={cx.statusRow}>
          <span className={cx.statusWarnDot} />
          <span className={cx.statusText}>Permission needed — click to re-authorize</span>
          <button className={cx.restoreBtn} onClick={onReauthorize}>Re-authorize</button>
        </div>
      )}
      {fsPermission && (
        <>
          {backupFiles.length === 0 ? (
            <div className={cx.emptyState}>No backup files found in folder</div>
          ) : (
            <>
              {(() => {
                const f = backupFiles[0]!;
                return (
                  <div className={cx.snapshotRow}>
                    <span className={cx.statusDot} />
                    <span className={cx.snapshotTime}>{fileLabel(f.name)}</span>
                    <span className={cx.snapshotLabel}>— Latest file</span>
                    <button
                      className={cx.restoreBtn}
                      onClick={() => onRestoreFile(f.name)}
                      disabled={restoringFile === f.name}
                    >
                      {restoringFile === f.name ? 'Restoring…' : 'Restore'}
                    </button>
                  </div>
                );
              })()}
              {backupFiles.length > 1 && (
                <>
                  <button className={disclosureStyles.showAllBtn} onClick={() => setShowAllFiles((s) => !s)}>
                    {showAllFiles ? 'Hide files' : `Show all ${backupFiles.length} files ▾`}
                  </button>
                  {showAllFiles && (
                    <div className={cx.snapshotList}>
                      {backupFiles.slice(1, 10).map((f) => (
                        <div key={f.name} className={cx.snapshotRow}>
                          <span className={cx.statusDot} />
                          <span className={cx.snapshotTime}>{fileLabel(f.name)}</span>
                          <button
                            className={cx.restoreBtn}
                            onClick={() => onRestoreFile(f.name)}
                            disabled={restoringFile === f.name}
                          >
                            {restoringFile === f.name ? 'Restoring…' : 'Restore'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
