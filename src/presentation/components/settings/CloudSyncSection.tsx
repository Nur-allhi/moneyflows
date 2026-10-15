import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { googleAuth } from '../../../infrastructure/database/GoogleAuth';
import { GOOGLE_CLIENT_ID, isGoogleSyncConfigured } from '../../constants/googleClient';
import type { CloudStatus } from '../../../core/ports/IDatabaseService';
import { SettingsDisclosure } from './SettingsDisclosure';
import styles from './CloudSyncSection.module.css';

const ERROR_COPY: Record<string, string> = {
  reconnect: 'Google session expired — tap Sign in with Google again.',
  'upload-failed': 'Last upload failed (offline?) — will retry automatically.',
  'download-failed': 'Last download failed — will retry automatically.',
  conflict: 'This device and another device both changed data — a choice screen will follow.',
};

function formatSyncTime(at: number, locale: string): string {
  if (!at) return 'never';
  return new Date(at).toLocaleString(locale, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  } as const);
}

/** Google Drive sync block for Settings → Backup & Storage (Phase 19, T-148). */
export function CloudSyncSection() {
  const locale = useSettingsStore((s) => s.settings.locale);
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isGoogleSyncConfigured();

  const refresh = useCallback(async () => {
    try {
      setStatus(await getDatabase().getCloudStatus());
    } catch { /* offline boot path — stays unknown */ }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleSignIn = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await googleAuth.signIn(GOOGLE_CLIENT_ID);
      const result = await getDatabase().reconcileAfterSignIn();
      if (result === 'downloaded') {
        window.location.reload();
        return;
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error && /cancel|dismiss|popup|closed/i.test(e.message)
        ? 'Sign-in was cancelled — try again.'
        : 'Sign-in failed — check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const handleSyncNow = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await getDatabase().syncNow());
    } catch {
      setError('Sync failed — will retry automatically.');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setBusy(true);
    try {
      await googleAuth.signOut();
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const signedIn = status?.signedIn ?? false;
  const subtitle = !status ? 'Checking…' : signedIn ? status.email ?? 'Connected' : 'Not connected';

  return (
    <SettingsDisclosure title="Google Drive Sync" subtitle={subtitle} defaultOpen={false}>
      {error && <div className={styles.errorMsg}>{error}</div>}
      {!configured ? (
        <div className={styles.emptyState}>
          Online sync is not set up in this build yet — the publisher adds a Google Client ID at build time.
          The app works fully offline meanwhile.
        </div>
      ) : !status ? (
        <div className={styles.emptyState}>Checking sync status…</div>
      ) : !signedIn ? (
        <>
          <div className={styles.emptyState}>
            Sign in once with your Google account — your data then backs up to your own Google Drive
            automatically, and your other devices pick it up. Each account keeps its own separate data.
          </div>
          <div className={styles.row}>
            <button className={styles.actionBtn} onClick={handleSignIn} disabled={busy}>
              {busy ? 'Opening Google…' : 'Sign in with Google'}
            </button>
          </div>
          <div className={styles.note}>Test-mode sign-ins expire after 7 days — just sign in again.</div>
        </>
      ) : (
        <>
          <div className={styles.statusRow}>
            <span className={status.lastError ? styles.statusWarnDot : styles.statusDot} />
            <span className={styles.statusText}>
              {status.email} — last synced {formatSyncTime(status.lastSyncAt, locale)}
            </span>
          </div>
          {status.lastError && (
            <div className={styles.warnMsg}>{ERROR_COPY[status.lastError] ?? 'Sync needs attention — will retry automatically.'}</div>
          )}
          <div className={styles.row}>
            <button className={styles.actionBtn} onClick={handleSyncNow} disabled={busy}>
              {busy ? 'Syncing…' : 'Sync now'}
            </button>
            <button className={styles.actionBtn} onClick={handleDisconnect} disabled={busy}>
              Disconnect
            </button>
          </div>
          <div className={styles.note}>Disconnecting signs you out only — this device keeps its data.</div>
        </>
      )}
    </SettingsDisclosure>
  );
}
