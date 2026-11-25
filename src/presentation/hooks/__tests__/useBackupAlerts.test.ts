import { describe, expect, it } from 'vitest';
import { deriveBackupAlerts, type BackupAlertInputs } from '../useBackupAlerts';

/** T-176: every bell alert is derived from one testable map, not scattered JSX checks. */
const healthy: BackupAlertInputs = {
  fsaSupported: true,
  folderSet: true,
  permissionGranted: true,
  folderFileCount: 2,
  snapshots: 3,
  storageHealth: { backend: 'opfs', lastFlushAt: 1, lastFlushFailed: false },
  integrityIssues: 0,
};

function ids(inputs: BackupAlertInputs): string[] {
  return deriveBackupAlerts(inputs).map((a) => a.id);
}

describe('deriveBackupAlerts (T-176)', () => {
  it('stays quiet when every backup signal is healthy', () => {
    expect(deriveBackupAlerts(healthy)).toEqual([]);
  });

  it('warns when no backup folder is chosen', () => {
    expect(ids({ ...healthy, folderSet: false })).toEqual(['folder-not-set-up']);
  });

  it('warns when folder permission was lost', () => {
    expect(ids({ ...healthy, permissionGranted: false })).toEqual(['folder-permission']);
  });

  it('reports an empty folder as info, not a warning', () => {
    const [alert] = deriveBackupAlerts({ ...healthy, folderFileCount: 0 });
    expect(alert?.id).toBe('folder-empty');
    expect(alert?.tone).toBe('info');
  });

  it('warns when there are no restore points', () => {
    expect(ids({ ...healthy, snapshots: 0 })).toEqual(['no-restore-points']);
  });

  it('warns when the last save failed', () => {
    expect(ids({ ...healthy, storageHealth: { ...healthy.storageHealth!, lastFlushFailed: true } }))
      .toEqual(['save-failed']);
  });

  it('warns on invalid records, with correct singular/plural wording', () => {
    const one = deriveBackupAlerts({ ...healthy, integrityIssues: 1 })[0];
    const many = deriveBackupAlerts({ ...healthy, integrityIssues: 4 })[0];
    expect(one?.title).toBe('1 record needs attention');
    expect(many?.title).toBe('4 records need attention');
  });

  it('never treats an unavailable integrity scan as an issue', () => {
    expect(ids({ ...healthy, integrityIssues: null })).toEqual([]);
  });

  it('shows the browser limitation instead of folder warnings when FSA is missing', () => {
    expect(ids({ ...healthy, fsaSupported: false, folderSet: false, permissionGranted: false, folderFileCount: 0 }))
      .toEqual(['folder-unsupported']);
  });

  it('collects independent issues together', () => {
    expect(ids({
      ...healthy,
      folderSet: false,
      snapshots: 0,
      storageHealth: null,
      integrityIssues: 2,
    })).toEqual(['folder-not-set-up', 'no-restore-points', 'integrity']);
  });
});
