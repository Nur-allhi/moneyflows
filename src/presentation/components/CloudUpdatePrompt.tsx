import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { CLOUD_SYNC_COOLDOWN_MS } from '../constants/config';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import type { ConflictPreview, SideSummary } from '../../core/ports/IDatabaseService';
import { Modal } from './Modal';
import styles from './CloudUpdatePrompt.module.css';

/**
 * Open-tab remote check (Phase 19, T-149) + conflict choice (T-150): while the
 * tab is visible, polls the remote hash on the sync cooldown. A newer remote
 * prompts for refresh; a both-sides-moved state offers keep-mine / use-theirs
 * (the remote side is already stashed as a restore point either way).
 */
function SideCard({ title, sub, side, locale, currency }: {
  title: string;
  sub: string;
  side: SideSummary;
  locale: string;
  currency: string;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardSub}>{sub}</div>
      <div className={styles.counts}>
        {side.transactions} transactions · {side.accounts} accounts · {side.members} members
      </div>
      {side.latest.length > 0 ? (
        <ul className={styles.latestList}>
          {side.latest.map((t, i) => (
            <li key={i} className={styles.latestItem}>
              <span className={styles.latestDesc}>{t.description || '—'}</span>
              <span className={`${styles.latestAmount} ${t.amount < 0 ? styles.latestAmountNeg : ''}`}>
                {formatAmount(t.amount, locale, currency)}
              </span>
              <span className={styles.latestDate}>{t.date}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.latestEmpty}>No transactions yet</div>
      )}
      {side.lastChange && <div className={styles.cardSub}>Last change {side.lastChange}</div>}
    </div>
  );
}

export function CloudUpdatePrompt() {
  const locale = useSettingsStore((s) => s.settings.locale);
  const currency = useSettingsStore((s) => s.settings.currency);
  const [available, setAvailable] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState<ConflictPreview | null>(null);
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
      else if (result === 'conflict') {
        setConflict(true);
        // Comparison cards (T-169); plain dialog fallback when unavailable.
        getDatabase().getConflictPreview().then(setPreview).catch(() => {});
      }
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
        setPreview(null);
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
        saveLabel={applying ? 'Saving…' : 'Keep this device'}
        onCancel={() => { void handleResolve('theirs'); }}
        onSave={() => { void handleResolve('mine'); }}
      >
        {preview ? (
          <div className={styles.cards}>
            <SideCard
              title="This device"
              sub="What's on this phone or computer right now"
              side={preview.local}
              locale={locale}
              currency={currency}
            />
            <SideCard
              title="Cloud"
              sub={preview.remoteSavedAt ? `Saved ${preview.remoteSavedAt}` : 'Saved on your Google Drive'}
              side={preview.remote}
              locale={locale}
              currency={currency}
            />
            <p className={styles.note}>The side you don&apos;t pick is kept as a restore point — nothing is lost.</p>
          </div>
        ) : (
          <>
            <p>This device and another device both changed data since the last sync.</p>
            <p>The other version is kept as a restore point either way — nothing is lost.</p>
          </>
        )}
        {applyError && <p>That did not work — check your connection and try again.</p>}
      </Modal>
    </>
  );
}
