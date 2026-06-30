import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './presentation/styles/reset.css';
import './presentation/styles/tokens.css';
import './presentation/styles/typography.css';
import './presentation/styles/glassmorphism.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
