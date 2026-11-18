import { useSettingsStore } from '../stores/useSettingsStore';
import styles from './DatabaseErrorScreen.module.css';

interface DatabaseErrorScreenProps {
  message: string;
  snapshots: { time: string }[] | null;
  slotBusy: number | null;
  slotError: string | null;
  actionBusy: 'restore' | 'fresh' | null;
  wipeFailed: string[] | null;
  restoreKey: number;
  freshKey: number;
  onRestore: () => void;
  onRestoreSlot: (index: number) => void;
  onFresh: () => void;
}

/** Full-screen recovery UI (BUG-7/BUG-12). Uses theme tokens so it reads correctly in light mode too. */
export function DatabaseErrorScreen({ message, snapshots, slotBusy, slotError, actionBusy, wipeFailed, restoreKey, freshKey, onRestore, onRestoreSlot, onFresh }: DatabaseErrorScreenProps) {
  const locale = useSettingsStore((s) => s.settings.locale);
  return (
    <div className={styles.screen}>
      <div className={styles.iconWrap} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
      </div>
      <h1 className={styles.title}>Database Error</h1>
      <p className={styles.message}>{message}</p>
      <p className={styles.hint}>
        You can try restoring your latest auto-backup first. If that loads
        empty or old data, pick an older backup below — the newest entry is
        not always the best one.
      </p>
      <button disabled={actionBusy !== null} onClick={onRestore} className={`${styles.primaryBtn} ${restoreKey > 0 ? 'anim-pop' : ''}`}>
        <span className="anim-target" key={restoreKey}>{actionBusy === 'restore' ? 'Restoring…' : 'Restore Latest Backup'}</span>
      </button>
      {snapListHas(snapshots) && (
        <>
          <p className={styles.hintSpaced}>Or pick a specific backup:</p>
          <div className={styles.slotList}>
            {snapshots.map((s, i) => (
              <button
                key={i}
                disabled={slotBusy !== null || actionBusy !== null}
                onClick={() => onRestoreSlot(i)}
                className={styles.slotBtn}
              >
                {slotBusy === i ? 'Restoring…' : `${i === 0 ? 'Latest auto-backup' : `Auto-backup ${i + 1}`} — ${new Date(s.time).toLocaleString(locale)}`}
              </button>
            ))}
          </div>
        </>
      )}
      {snapshots !== null && snapshots.length === 0 && (
        <p className={styles.hint}>No older backups could be listed.</p>
      )}
      {slotError && <p className={styles.errorText}>{slotError}</p>}
      <p className={styles.hint}>
        &ldquo;Start Fresh&rdquo; resets the app to empty. Only use this when
        your data is safely backed up elsewhere.
      </p>
      <button disabled={actionBusy !== null} onClick={onFresh} className={`${styles.freshBtn} ${freshKey > 0 ? 'anim-pop' : ''}`}>
        <span className="anim-target" key={freshKey}>{actionBusy === 'fresh' ? 'Wiping…' : 'Start Fresh'}</span>
      </button>
      {wipeFailed && (
        <p className={styles.warningText}>
          Automatic wipe timed out on: {wipeFailed.join(', ')}. Clear it by hand —
          F12 → Application → Storage → Clear site data → reload the page.
        </p>
      )}
    </div>
  );
}

function snapListHas(snapshots: { time: string }[] | null): snapshots is { time: string }[] {
  return snapshots !== null && snapshots.length > 0;
}
