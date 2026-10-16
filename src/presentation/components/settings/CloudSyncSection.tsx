import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { clearLastSyncMeta } from '../../../infrastructure/database/CloudSync';
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

/** Hold the completed bar briefly so success registers (T-167). */
const DONE_HOLD_MS = 1200;

function StageBar({ stage }: { stage: 'google' | 'syncing' | 'done' }) {
  const percent = stage === 'google' ? 35 : stage === 'syncing' ? 75 : 100;
  const label = stage === 'google' ? 'Contacting Google…' : stage === 'syncing' ? 'Syncing your data…' : 'Synced ✓';
  return (
    <ProgressBar
      percent={percent}
      label={label}
      sublabel={stage === 'done' ? undefined : 'Stay on this screen — finishing up.'}
    />
  );
}

function formatSyncTime(at: number, locale: string): string {
  if (!at) return 'never';
  return new Date(at).toLocaleString(locale, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  } as const);
}

/** Google Drive sync block for Settings → Backup & Storage (Phase 19, T-148). */
export function CloudSyncSection({ forceOpen = false }: { forceOpen?: boolean }) {
  const locale = useSettingsStore((s) => s.settings.locale);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [remote, setRemote] = useState<{ dbFiles: number; hashPresent: boolean; modifiedTime: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  /** Staged progress so a slow sign-in never looks dead: google popup → sync. */
  const [stage, setStage] = useState<'google' | 'syncing' | 'done' | null>(null);
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
      setStage('done');
      await refresh();
      await new Promise((resolve) => setTimeout(resolve, DONE_HOLD_MS));
    } catch (e) {
      // BUG-16: a popup that dies with no answer is a config/blocker issue,
      // not a user cancel — say so instead of hanging or mislabeling it.
      const msg = e instanceof Error ? e.message : '';
      if (/timed out|no response/i.test(msg)) {
        setError('Google closed the popup without signing in — this site may not be an authorized origin, or a blocker stopped the popup. Check and try again.');
      } else if (/cancel|dismiss|popup|closed/i.test(msg)) {
        setError('Sign-in was cancelled — try again.');
      } else {
        setError('Sign-in failed — check your connection and try again.');
      }
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
      setStage('done');
      await new Promise((resolve) => setTimeout(resolve, DONE_HOLD_MS));
    } catch {
      setError('Sync failed — will retry automatically.');
    } finally {
      setBusy(false);
      setStage(null);
    }
  }, []);

  /**
   * Sign out + erase device: final upload first (aborts to a warned choice
   * when the backup fails), then revoke Google, wipe local DB + snapshots +
   * sync fingerprint, and land on the wizard so another account can sign in.
   * The Drive backup itself is never touched.
   */
  const handleSignOut = useCallback(async () => {
    if (!window.confirm('Sign out of Google and erase this device’s data? Your Drive backup stays untouched — this device is wiped so another account can sign in.')) return;
    setBusy(true);
    setError(null);
    setStage('syncing');
    try {
      let backedUp = false;
      try {
        const st = await getDatabase().syncNow();
        backedUp = !st.lastError;
      } catch {
        backedUp = false;
      }
      if (!backedUp) {
        if (!window.confirm('Couldn’t back up to Drive (offline?). Unsynced changes will be lost. Sign out anyway?')) {
          setBusy(false);
          setStage(null);
          return;
        }
      }
      await googleAuth.signOut();
      await getDatabase().resetStorage();
      await clearLastSyncMeta();
      updateSettings({ setupComplete: false });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign out failed — try again.');
      setBusy(false);
      setStage(null);
    }
  }, [updateSettings]);

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
      {busy && stage && <StageBar stage={stage} />}
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
            <button className={styles.actionBtn} onClick={handleSignOut} disabled={busy}>
              Sign out
            </button>
          </div>
          <div className={styles.note}>Signing out erases this device’s data — your Drive backup stays.</div>
        </>
      )}
    </SettingsDisclosure>
  );
}
