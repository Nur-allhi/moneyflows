/* eslint-disable react-refresh/only-export-components -- app entry point: renders only, exports nothing */
import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SplashScreen } from './presentation/components/SplashScreen';
import { initDatabase, getDatabase } from './infrastructure/database/getDatabase';
import './presentation/styles/tailwind.css';
import './presentation/styles/reset.css';
import './presentation/styles/tokens.css';
import './presentation/styles/typography.css';
import './presentation/styles/glassmorphism.css';

function Root() {
  const [ready, setReady] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const handleFinish = useCallback(() => setShowApp(true), []);

  React.useEffect(() => {
    let cancelled = false;
    // Splash watchdog: never hang forever if a boot step stalls (BUG-7).
    const watchdog = window.setTimeout(() => {
      if (!cancelled) setDbError('Startup timed out. Your data may need recovery.');
    }, 15000);
    initDatabase()
      .then(async () => {
        await getDatabase().recalculateBalances();
        if (!cancelled) {
          setDbError(null); // clears a watchdog message if init finished late
          setReady(true);
        }
      })
      .catch((err: unknown) => {
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

  if (dbError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111', color: '#ccc', fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center', gap: 12 }}>
        <div style={{ fontSize: 40 }}>{'\u26A0\uFE0F'}</div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>Database Error</h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 400 }}>{dbError}</p>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, maxWidth: 420 }}>
          You can try restoring your latest auto-backup first. If that fails,
          &ldquo;Start Fresh&rdquo; resets the app; your previous file stays in storage for manual recovery.
        </p>
        <button
          onClick={async () => {
            try {
              const ok = await getDatabase().restoreNewestSnapshot();
              if (ok) window.location.reload();
              else setDbError('No valid auto-backup was found to restore.');
            } catch (e) {
              setDbError(e instanceof Error ? e.message : 'Restore failed');
            }
          }}
          style={{ marginTop: 8, padding: '10px 24px', border: 'none', borderRadius: 8, background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          Restore Latest Backup
        </button>
        <button
          onClick={() => { void getDatabase().resetStorage().then(() => window.location.reload()); }}
          style={{ padding: '10px 24px', border: 'none', borderRadius: 8, background: '#6c5ce7', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          Start Fresh
        </button>
      </div>
    );
  }

  if (showApp) {
    return <App />;
  }

  return <SplashScreen ready={ready} onFinish={handleFinish} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
