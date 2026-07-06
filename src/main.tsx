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
    initDatabase()
      .then(() => {
        getDatabase().recalculateBalances();
        setReady(true);
      })
      .catch((err: unknown) => {
        setDbError(err instanceof Error ? err.message : 'Unknown database error');
      });
  }, []);

  if (dbError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111', color: '#ccc', fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center', gap: 12 }}>
        <div style={{ fontSize: 40 }}>{'\u26A0\uFE0F'}</div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>Database Error</h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 400, margin: 0 }}>{dbError}</p>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>You can try restoring from a backup or contact support for help recovering your corrupt file.</p>
        <button onClick={() => { localStorage.removeItem('moneyflows_db'); window.location.reload(); }} style={{ marginTop: 8, padding: '10px 24px', border: 'none', borderRadius: 8, background: '#6c5ce7', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
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
