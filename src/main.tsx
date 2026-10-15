/* eslint-disable react-refresh/only-export-components -- app entry point: renders only, exports nothing */
import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SplashScreen } from './presentation/components/SplashScreen';
import { WhatsNewModal } from './presentation/components/WhatsNewModal';
import { whatsNewFor } from './presentation/constants/whatsNew';
import { useSettingsStore } from './presentation/stores/useSettingsStore';
import { initDatabase, getDatabase } from './infrastructure/database/getDatabase';
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
        const snaps = await getDatabase().getSnapshots();
        if (alive) setSnapList(snaps.map((s) => ({ time: s.time })));
      } catch {
        if (alive) setSnapList([]);
      }
    })();
    return () => { alive = false; };
  }, [dbError]);

  if (dbError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111', color: '#ccc', fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center', gap: 12 }}>
        <div style={{ fontSize: 40 }}>{'\u26A0\uFE0F'}</div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>Database Error</h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 400 }}>{dbError}</p>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, maxWidth: 420 }}>
          You can try restoring your latest auto-backup first. If that loads
          empty or old data, pick an older backup below — the newest entry is
          not always the best one.
        </p>
        <button
          onClick={async () => {
            replayRestore();
            try {
              const ok = await getDatabase().restoreNewestSnapshot();
              if (ok) window.location.reload();
              else setDbError('No valid auto-backup was found to restore.');
            } catch (e) {
              setDbError(e instanceof Error ? e.message : 'Restore failed');
            }
          }}
          className={restoreKey > 0 ? 'anim-pop' : ''}
          style={{ marginTop: 8, padding: '10px 24px', border: 'none', borderRadius: 8, background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          <span className="anim-target" key={restoreKey}>Restore Latest Backup</span>
        </button>
        {snapList !== null && snapList.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, maxWidth: 420, margin: '8px 0 0' }}>
              Or pick a specific backup:
            </p>            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, width: '100%', maxHeight: 220, overflowY: 'auto' }}>
              {snapList.map((s, i) => (
                <button
                  key={i}
                  disabled={slotBusy !== null}
                  onClick={async () => {
                    setSlotBusy(i);
                    setSlotError(null);
                    try {
                      await getDatabase().restoreSnapshotExact(i);
                      window.location.reload();
                    } catch (e) {
                      setSlotError(e instanceof Error ? e.message : `Backup ${i + 1} failed`);
                      setSlotBusy(null);
                    }
                  }}
                  style={{ padding: '10px 16px', border: '1px solid #444', borderRadius: 8, background: '#1c1c1c', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                >
                  {slotBusy === i ? 'Restoring…' : `${i === 0 ? 'Latest auto-backup' : `Auto-backup ${i + 1}`} — ${new Date(s.time).toLocaleString()}`}
                </button>
              ))}
            </div>
          </>
        )}
        {snapList !== null && snapList.length === 0 && (
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, maxWidth: 420 }}>
            No older backups could be listed.
          </p>
        )}
        {slotError && (
          <p style={{ fontSize: 13, color: '#ff6b6b', lineHeight: 1.5, maxWidth: 420 }}>{slotError}</p>
        )}
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, maxWidth: 420 }}>
          &ldquo;Start Fresh&rdquo; resets the app to empty. Only use this when
          your data is safely backed up elsewhere.
        </p>
        <button
          onClick={() => {
            replayFresh();
            void (async () => {
              // Engine-free wipe (BUG-12): works even when boot died before the
              // engine/storage initialized, where resetStorage() silently no-ops.
              // Reload re-inits everything; a signed-in device re-pulls Drive.
              try {
                await wipePersistedStorage({
                  mainKey: STORAGE_KEY,
                  snapshotPrefix: SNAPSHOT_PREFIX,
                  maxSnapshots: MAX_SNAPSHOTS,
                });
              } catch (e) {
                setDbError(e instanceof Error ? e.message : 'Wipe failed');
                return;
              }
              useSettingsStore.getState().updateSettings({ setupComplete: false });
              window.location.reload();
            })();
          }}
          className={freshKey > 0 ? 'anim-pop' : ''}
          style={{ padding: '10px 24px', border: 'none', borderRadius: 8, background: '#6c5ce7', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          <span className="anim-target" key={freshKey}>Start Fresh</span>
        </button>
      </div>
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
