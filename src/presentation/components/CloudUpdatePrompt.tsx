import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { CLOUD_SYNC_COOLDOWN_MS } from '../constants/config';
import { Modal } from './Modal';

/**
 * Open-tab remote check (Phase 19, T-149) + conflict choice (T-150): while the
 * tab is visible, polls the remote hash on the sync cooldown. A newer remote
 * prompts for refresh; a both-sides-moved state offers keep-mine / use-theirs
 * (the remote side is already stashed as a restore point either way).
 */
export function CloudUpdatePrompt() {
  const [available, setAvailable] = useState(false);
  const [conflict, setConflict] = useState(false);
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
      else if (result === 'conflict') setConflict(true);
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

  const handleResolve = useCallback(async (choice: 'mine' | 'theirs') => {
    setApplying(true);
    setApplyError(false);
    try {
      const ok = await getDatabase().resolveConflict(choice);
      if (ok) {
        if (choice === 'theirs') {
          window.location.reload();
          return;
        }
        setConflict(false);
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
    <>
      <Modal
        isOpen={available && !conflict}
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
      <Modal
        isOpen={conflict}
        onClose={() => { /* choice required — both options are safe */ }}
        title="Sync conflict"
        cancelLabel="Download cloud data"
        saveLabel={applying ? 'Saving…' : 'Override cloud'}
        onCancel={() => { void handleResolve('theirs'); }}
        onSave={() => { void handleResolve('mine'); }}
      >
        <p>This device and another device both changed data since the last sync.</p>
        <p>The other version is kept as a restore point either way — nothing is lost.</p>
        {applyError && <p>That did not work — check your connection and try again.</p>}
      </Modal>
    </>
  );
}
