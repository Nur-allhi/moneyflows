import { useState } from 'react';
import type { SnapshotInfo } from '../../../../core/ports/IDatabaseService';
import disclosureStyles from '../SettingsDisclosure.module.css';
import type { Cx } from './cx';

interface RestorePointsProps {
  cx: Cx;
  snapshots: SnapshotInfo[];
  restoring: boolean;
  restoreError?: string | null;
  onRestore: (index: number, time: string) => void;
  formatTime: (iso: string) => string;
}

/** Latest auto-backup + expandable history. Host owns data, card owns expansion. */
export function RestorePoints({ cx, snapshots, restoring, restoreError, onRestore, formatTime }: RestorePointsProps) {
  const [showAll, setShowAll] = useState(false);

  if (snapshots.length === 0) {
    return (
      <>
        {restoreError && <div className={cx.errorMsg}>{restoreError}</div>}
        <div className={cx.emptyState}>No backup snapshots found</div>
      </>
    );
  }

  return (
    <>
      {restoreError && <div className={cx.errorMsg}>{restoreError}</div>}
      <div className={cx.snapshotRow}>
        <span className={cx.snapshotDot} />
        <span className={cx.snapshotTime}>{formatTime(snapshots[0]!.time)}</span>
        <span className={cx.snapshotLabel}>— Latest auto-backup</span>
        <button
          className={cx.restoreBtn}
          onClick={() => onRestore(0, formatTime(snapshots[0]!.time))}
          disabled={restoring}
        >
          {restoring ? 'Restoring…' : 'Restore'}
        </button>
      </div>
      {snapshots.length > 1 && (
        <>
          <button className={disclosureStyles.showAllBtn} onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Hide history' : `Show all ${snapshots.length} snapshots ▾`}
          </button>
          {showAll && (
            <div className={cx.snapshotList}>
              {snapshots.slice(1).map((snap, idx) => (
                <div key={idx + 1} className={cx.snapshotRow}>
                  <span className={cx.snapshotDot} />
                  <span className={cx.snapshotTime}>{formatTime(snap.time)}</span>
                  <span className={cx.snapshotLabel}>— Auto-backup</span>
                  <button
                    className={cx.restoreBtn}
                    onClick={() => onRestore(idx + 1, formatTime(snap.time))}
                    disabled={restoring}
                  >
                    {restoring ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
