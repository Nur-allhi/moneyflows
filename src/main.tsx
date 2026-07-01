import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initDatabase } from './infrastructure/database/getDatabase';
import './presentation/styles/tailwind.css';
import './presentation/styles/reset.css';
import './presentation/styles/tokens.css';
import './presentation/styles/typography.css';
import './presentation/styles/glassmorphism.css';

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => {
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <div className="loading-screen">Loading\u2026</div>;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
