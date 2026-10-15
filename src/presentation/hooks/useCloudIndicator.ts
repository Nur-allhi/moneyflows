import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { CLOUD_SYNC_COOLDOWN_MS } from '../constants/config';

export type SyncDot = 'synced' | 'never' | 'warn';

/**
 * Header sync indicator state (T-157): cheap status poll (IDB read — no
 * export/hash), refreshed on mount, route change, cooldown tick, and tab
 * refocus. Null when signed out (guests see nothing).
 */
export function useCloudIndicator(): { dot: SyncDot; title: string } | null {
  const [dot, setDot] = useState<SyncDot | null>(null);
  const [title, setTitle] = useState('');
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const s = await getDatabase().getCloudStatus();
        if (!alive) return;
        if (!s.signedIn) {
          setDot(null);
          return;
        }
        if (s.conflictPending || s.lastError) {
          setDot('warn');
          setTitle('Sync needs attention — open Settings to review');
        } else if (s.lastSyncAt > 0) {
          setDot('synced');
          setTitle(`Synced ${new Date(s.lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} — open Settings for details`);
        } else {
          setDot('never');
          setTitle('Signed in — not synced yet');
        }
      } catch { /* offline boot path */ }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, CLOUD_SYNC_COOLDOWN_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname]);

  if (!dot) return null;
  return { dot, title };
}
