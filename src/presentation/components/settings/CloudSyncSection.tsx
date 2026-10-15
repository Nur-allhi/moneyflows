import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { googleAuth } from '../../../infrastructure/database/GoogleAuth';
import type { CloudStatus } from '../../../core/ports/IDatabaseService';
import { SettingsDisclosure } from './SettingsDisclosure';
import styles from './CloudSyncSection.module.css';

const ERROR_COPY: Record<string, string> = {
  reconnect: 'Google session expired — tap Connect to sign in again.',
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
  const { settings, updateSettings } = useSettingsStore();
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [clientId, setClientId] = useState(settings.cloudClientId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getDatabase().getCloudStatus());
    } catch { /* offline boot path — stays unknown */ }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { setClientId(settings.cloudClientId); }, [settings.cloudClientId]);

  const handleConnect = useCallback(async () => {
    const id = clientId.trim();
    if (!id) {
      setError('Paste your Google Client ID first — see the setup steps below.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await googleAuth.signIn(id);
      updateSettings({ cloudClientId: id });
      await refresh();
    } catch (e) {
      setError(e instanceof Error && /cancel|dismiss|popup|closed/i.test(e.message)
        ? 'Sign-in was cancelled — try again.'
        : 'Sign-in failed — check the Client ID and your connection.');
    } finally {
      setBusy(false);
    }
  }, [clientId, refresh, updateSettings]);

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
      {!status ? (
        <div className={styles.emptyState}>Checking sync status…</div>
      ) : !signedIn ? (
        <>
          <div className={styles.emptyState}>
            Sign in once — your database then backs up to your own Google Drive automatically,
            and other devices signed into the same account pick it up.
          </div>
          <ol className={styles.steps}>
            <li>Create a project at console.cloud.google.com and enable the Google Drive API.</li>
            <li>OAuth consent screen (External, Test mode) — add your Gmail as a test user.</li>
            <li>Credentials → OAuth client ID (Web) → paste the Client ID below.</li>
          </ol>
          <div className={styles.note}>Test-mode sign-ins expire after 7 days — just reconnect. The Client ID is public, not a secret.</div>
          <div className={styles.row}>
            <input
              className={styles.inputField}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Google Client ID (…apps.googleusercontent.com)"
              inputMode="text"
              autoComplete="off"
            />
            <button className={styles.actionBtn} onClick={handleConnect} disabled={busy}>
              {busy ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.statusRow}>
            <span className={status.lastError ? styles.statusWarnDot : styles.statusDot} />
            <span className={styles.statusText}>
              {status.email} — last synced {formatSyncTime(status.lastSyncAt, settings.locale)}
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
