import { useCallback, useEffect, useState } from 'react';
import { isUpdateTakeover } from '../utils/appUpdate';
import styles from './AppUpdateBanner.module.css';

/**
 * Service-worker update banner (2026-11-03): when a freshly-installed app
 * version takes control of the running page, offer a one-tap reload. The new
 * service worker activates immediately (sw.js skipWaiting + clients.claim),
 * so the takeover IS the signal — no polling, no ignored `waiting` worker.
 * "Not now" hides it for the session; the next real update re-offers.
 */
export function AppUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const startedWithController = !!navigator.serviceWorker.controller;
    let changes = 0;
    const onControllerChange = () => {
      changes += 1;
      if (isUpdateTakeover({ startedWithController, controllerChanges: changes })) setVisible(true);
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  const refresh = useCallback(() => {
    setBusy(true);
    window.location.reload();
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.banner} role="status">
      <div className={styles.copy}>
        <span className={styles.title}>MoneyFlows was updated</span>
        <span className={styles.sub}>A new version is ready on this device.</span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.later} onClick={() => setVisible(false)}>
          Not now
        </button>
        <button type="button" className={styles.refreshBtn} onClick={refresh} disabled={busy}>
          Refresh
        </button>
      </div>
    </div>
  );
}
