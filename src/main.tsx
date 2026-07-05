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

  const handleFinish = useCallback(() => setShowApp(true), []);

  React.useEffect(() => {
    initDatabase().then(() => {
      getDatabase().recalculateBalances();
      setReady(true);
    });
  }, []);

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
