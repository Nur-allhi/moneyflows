/* eslint-disable react-refresh/only-export-components -- app entry point: renders only, exports nothing */
import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SplashScreen } from './presentation/components/SplashScreen';
import { WhatsNewModal } from './presentation/components/WhatsNewModal';
import { DatabaseErrorScreen } from './presentation/components/DatabaseErrorScreen';
import { whatsNewFor } from './presentation/constants/whatsNew';
import { useSettingsStore } from './presentation/stores/useSettingsStore';
import { initDatabase, getDatabase } from './infrastructure/database/getDatabase';
import { withStorageTimeout } from './infrastructure/database/SQLiteDatabaseService';
import { wipePersistedStorage } from './infrastructure/database/storage';
import { STORAGE_KEY, SNAPSHOT_PREFIX, MAX_SNAPSHOTS } from './presentation/constants/config';
import { APP_VERSION } from './presentation/constants/appVersion';
import { useReplay } from './presentation/hooks/useReplay';
import { logger } from './core/logging';
// Self-hosted variable fonts (offline-first; replaces the Google Fonts @import).
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter';
import '@fontsource-variable/anek-bangla';
import '@fontsource-variable/jetbrains-mono';
import './presentation/styles/tailwind.css';
import './presentation/styles/reset.css';
import './presentation/styles/tokens.css';
import './presentation/styles/typography.css';
import './presentation/styles/glassmorphism.css';
import './presentation/styles/click-anims.css';

function Root() {
  const [ready, setReady] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  /** Boot progress for the splash (T-161): fraction 0..1 + stage label. */
  const [bootPercent, setBootPercent] = useState(5);
  const [bootStatus, setBootStatus] = useState('Starting…');
  const [whatsNew, setWhatsNew] = useState<{ version: string; items: string[] } | null>(null);
  const [restoreKey, replayRestore] = useReplay();
  const [freshKey, replayFresh] = useReplay();
  /** Recovery slot list (BUG-12): newest-first times for exact-slot restore. */
  const [snapList, setSnapList] = useState<{ time: string }[] | null>(null);
  const [slotBusy, setSlotBusy] = useState<number | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  /** Recovery action feedback (BUG-12): silent buttons looked dead on hung storage. */
  const [actionBusy, setActionBusy] = useState<'restore' | 'fresh' | null>(null);
  const [wipeFailed, setWipeFailed] = useState<string[] | null>(null);

  const handleFinish = useCallback(() => setShowApp(true), []);

  React.useEffect(() => {
    if (!showApp) return;
    const { settings, updateSettings } = useSettingsStore.getState();
    if (settings.lastSeenVersion !== APP_VERSION) {
      // Any change (including first install) surfaces the latest notes once.
      setWhatsNew(whatsNewFor(APP_VERSION));
      updateSettings({ lastSeenVersion: __APP_VERSION__ });
    }
  }, [showApp]);

  React.useEffect(() => {
    logger.info('app', 'boot', { version: APP_VERSION, route: window.location.pathname });
    const onErr = (e: ErrorEvent) => logger.error('app', e.message, { filename: e.filename, lineno: e.lineno } as unknown as Record<string, unknown>, (e.error as Error)?.stack);
    const onRej = (e: PromiseRejectionEvent) => logger.error('app', String((e.reason as Error)?.message ?? e.reason), {}, (e.reason as Error)?.stack);
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    // Splash watchdog: never hang forever if a boot step stalls (BUG-7).
    // Names the stalled stage (BUG-12) so the next diagnosis starts somewhere.
    let lastStage = 'Starting…';
    const watchdog = window.setTimeout(() => {
      if (!cancelled) setDbError(`Startup timed out during: ${lastStage}. Your data may need recovery.`);
    }, 15000);
    initDatabase((fraction, label) => {
      if (!cancelled) {
        lastStage = label;
        setBootPercent(Math.round(fraction * 100));
        setBootStatus(label);
      }
    })
      .then(async () => {
        if (!cancelled) {
          setBootPercent(95);
          setBootStatus('Finalizing…');
        }
        await getDatabase().recalculateBalances();
        if (!cancelled) {
          setDbError(null); // clears a watchdog message if init finished late
          setBootPercent(100);
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        logger.error('storage', 'init failed', {}, err instanceof Error ? err.stack : String(err));
        if (!cancelled) setDbError(err instanceof Error ? err.message : 'Unknown database error');
      })
      .finally(() => window.clearTimeout(watchdog));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      (window as unknown as Record<string, unknown>).__installPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
      (window as unknown as Record<string, unknown>).__installPrompt = null;
    });

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
    };
  }, []);

  // Load the snapshot slot list once the recovery screen shows. The instance
  // is registered before boot runs, so this works even when init failed.
  React.useEffect(() => {
    if (!dbError) return;
    let alive = true;
    (async () => {
      try {
        const snaps = await withStorageTimeout(getDatabase().getSnapshots());
        if (alive) setSnapList(snaps.map((s) => ({ time: s.time })));
      } catch {
        if (alive) setSnapList([]);
      }
    })();
    return () => { alive = false; };
  }, [dbError]);

  if (dbError) {
    return (
      <DatabaseErrorScreen
        message={dbError}
        snapshots={snapList}
        slotBusy={slotBusy}
        slotError={slotError}
        actionBusy={actionBusy}
        wipeFailed={wipeFailed}
        restoreKey={restoreKey}
        freshKey={freshKey}
        onRestore={async () => {
          replayRestore();
          setActionBusy('restore');
          try {
            const ok = await withStorageTimeout(getDatabase().restoreNewestSnapshot());
            if (ok) window.location.reload();
            else setDbError('No valid auto-backup was found to restore.');
          } catch (e) {
            setDbError(e instanceof Error ? e.message : 'Restore failed');
          } finally {
            setActionBusy(null);
          }
        }}
        onRestoreSlot={async (i) => {
          setSlotBusy(i);
          setSlotError(null);
          try {
            await withStorageTimeout(getDatabase().restoreSnapshotExact(i));
            window.location.reload();
          } catch (e) {
            setSlotError(e instanceof Error ? e.message : `Backup ${i + 1} failed`);
            setSlotBusy(null);
          }
        }}
        onFresh={() => {
          replayFresh();
          setWipeFailed(null);
          setActionBusy('fresh');
          void (async () => {
            // Engine-free wipe (BUG-12): works even when boot died before the
            // engine/storage initialized, where resetStorage() silently no-ops.
            // Reload re-inits everything; a signed-in device re-pulls Drive.
            try {
              const report = await wipePersistedStorage({
                mainKey: STORAGE_KEY,
                snapshotPrefix: SNAPSHOT_PREFIX,
                maxSnapshots: MAX_SNAPSHOTS,
              });
              const failed = (Object.keys(report) as (keyof typeof report)[]).filter((k) => !report[k]);
              if (failed.length > 0) {
                setWipeFailed(failed);
                setActionBusy(null);
                return;
              }
            } catch (e) {
              setDbError(e instanceof Error ? e.message : 'Wipe failed');
              setActionBusy(null);
              return;
            }
            useSettingsStore.getState().updateSettings({ setupComplete: false });
            window.location.reload();
          })();
        }}
      />
    );
  }

  if (showApp) {
    return (
      <>
        <App />
        {whatsNew && (
          <WhatsNewModal
            isOpen
            version={whatsNew.version}
            items={whatsNew.items}
            onClose={() => setWhatsNew(null)}
          />
        )}
      </>
    );
  }

  return <SplashScreen ready={ready} onFinish={handleFinish} percent={bootPercent} status={bootStatus} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
