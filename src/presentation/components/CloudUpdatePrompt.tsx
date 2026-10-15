import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { CLOUD_SYNC_COOLDOWN_MS } from '../constants/config';
import { Modal } from './Modal';

/**
 * Open-tab remote check (Phase 19, T-149): while the tab is visible, polls the
 * remote hash on the sync cooldown and prompts when another device uploaded
 * newer data. Refresh imports the verified remote and reloads (same flow as
 * snapshot restore). Conflict resolution belongs to T-150 — here it only
 * surfaces through the Settings status row.
 */
export function CloudUpdatePrompt() {
  const [available, setAvailable] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(false);
  const snoozedUntil = useRef(0);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    checking.current = true;
    try {
      const result = await getDatabase().checkRemoteUpdate().catch(() => null);
      if (result === 'available' && Date.now() >= snoozedUntil.current) setAvailable(true);
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => { void check(); }, CLOUD_SYNC_COOLDOWN_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') setTimeout(() => { void check(); }, 500);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  const handleLater = useCallback(() => {
    snoozedUntil.current = Date.now() + CLOUD_SYNC_COOLDOWN_MS;
    setAvailable(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setApplying(true);
    setApplyError(false);
    try {
      const ok = await getDatabase().applyRemoteUpdate();
      if (ok) {
        window.location.reload();
        return;
      }
      setApplyError(true);
    } catch {
      setApplyError(true);
    } finally {
      setApplying(false);
    }
  }, []);

  return (
    <Modal
      isOpen={available}
      onClose={handleLater}
      title="New data available"
      cancelLabel="Later"
      saveLabel={applying ? 'Loading…' : 'Refresh'}
      onCancel={handleLater}
      onSave={() => { void handleRefresh(); }}
    >
      <p>Another device synced newer data to your Google Drive. Refresh to load it.</p>
      {applyError && <p>Could not load the update — will retry on the next check.</p>}
    </Modal>
  );
}
