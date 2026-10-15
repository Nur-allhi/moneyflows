import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { googleAuth } from '../../../infrastructure/database/GoogleAuth';
import { GOOGLE_CLIENT_ID, isGoogleSyncConfigured } from '../../constants/googleClient';
import type { CloudStatus } from '../../../core/ports/IDatabaseService';
import { SettingsDisclosure } from './SettingsDisclosure';
import { ProgressBar } from '../ProgressBar';
import styles from './CloudSyncSection.module.css';

const ERROR_COPY: Record<string, string> = {
  reconnect: 'Google session expired — tap Sign in with Google again.',
  'upload-failed': 'Last upload failed (offline?) — will retry automatically.',
  'download-failed': 'Last download failed — will retry automatically.',
  'remote-corrupt': 'Your cloud backup looks damaged — this device was left untouched. You can replace the cloud copy with this device below.',
  conflict: 'This device and another device both changed data — a choice screen will follow.',
};

function formatSyncTime(at: number, locale: string): string {
  if (!at) return 'never';
  return new Date(at).toLocaleString(locale, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  } as const);
}

/** Google Drive sync block for Settings → Backup & Storage (Phase 19, T-148). */
export function CloudSyncSection({ forceOpen = false }: { forceOpen?: boolean }) {
  const locale = useSettingsStore((s) => s.settings.locale);
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [remote, setRemote] = useState<{ dbFiles: number; hashPresent: boolean; modifiedTime: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  /** Staged progress so a slow sign-in never looks dead: google popup → sync. */
  const [stage, setStage] = useState<'google' | 'syncing' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isGoogleSyncConfigured();

  const refresh = useCallback(async () => {
    try {
      setStatus(await getDatabase().getCloudStatus());
      setRemote(await getDatabase().remoteInfo().catch(() => null));
      // Nudge header indicator + sidebar footer to re-read status immediately.
      window.dispatchEvent(new Event('moneyflows:cloud-status'));
    } catch { /* offline boot path — stays unknown */ }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleSignIn = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStage('google');
    try {
      await googleAuth.signIn(GOOGLE_CLIENT_ID);
      setStage('syncing');
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
      setStage(null);
    }
  }, [refresh]);

  const handleSyncNow = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStage('syncing');
    try {
      // Cached/silent session first; the popup appears only when the session
      // is truly dead — acceptable on an explicit tap, never in background.
      const token = await googleAuth.getValidToken().catch(() => null);
      if (!token) {
        const fresh = await googleAuth.refreshInteractive().catch(() => null);
        if (!fresh) {
          setError('Google session expired — tap Sign in with Google again.');
          return;
        }
      }
      setStatus(await getDatabase().syncNow());
    } catch {
      setError('Sync failed — will retry automatically.');
    } finally {
      setBusy(false);
      setStage(null);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setBusy(true);
    try {
      await googleAuth.signOut();
      setRemote(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  /** Warned escape hatch for a corrupt remote (T-160): explicit choice only. */
  const handleReplaceCloud = useCallback(async () => {
    if (!window.confirm('Replace your cloud backup with this device’s data? The current cloud copy will be overwritten.')) return;
    setBusy(true);
    setError(null);
    setStage('syncing');
    try {
      const ok = await getDatabase().overwriteRemote();
      if (!ok) setError('Replace failed — check your connection and try again.');
      await refresh();
    } catch {
      setError('Replace failed — check your connection and try again.');
    } finally {
      setBusy(false);
      setStage(null);
    }
  }, [refresh]);

  const signedIn = status?.signedIn ?? false;
  const subtitle = !status ? 'Checking…' : signedIn ? status.email ?? 'Connected' : 'Not connected';

  return (
    <SettingsDisclosure title="Google Drive Sync" subtitle={subtitle} defaultOpen={forceOpen}>
      {error && <div className={styles.errorMsg}>{error}</div>}
      {busy && stage && (
        <ProgressBar
          percent={stage === 'google' ? 35 : 75}
          label={stage === 'google' ? 'Contacting Google…' : 'Syncing your data…'}
          sublabel="Stay on this screen — finishing up."
        />
      )}
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
              {busy ? (stage === 'syncing' ? 'Syncing…' : 'Connecting…') : 'Sign in with Google'}
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
          {remote && (
            <div className={styles.note}>
              {remote.dbFiles === 0
                ? 'Drive: no backup file yet.'
                : `Drive: ${remote.dbFiles} backup file${remote.dbFiles > 1 ? 's' : ''}${remote.hashPresent ? '' : ' (hash missing)'}${remote.modifiedTime ? ` · updated ${formatSyncTime(Date.parse(remote.modifiedTime), locale)}` : ''}`}
            </div>
          )}
          <div className={styles.row}>
            <button className={styles.actionBtn} onClick={handleSyncNow} disabled={busy}>
              {busy ? 'Syncing…' : 'Sync now'}
            </button>
            {status.lastError === 'remote-corrupt' && (
              <button className={styles.actionBtn} onClick={handleReplaceCloud} disabled={busy}>
                Replace cloud backup
              </button>
            )}
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
