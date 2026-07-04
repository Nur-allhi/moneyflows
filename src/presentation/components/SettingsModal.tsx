import { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { isFsaSupported, folderSync } from '../../infrastructure/database/FolderSync';
import type { SnapshotInfo } from '../../core/ports/IDatabaseService';
import {
  DESCRIPTION_MAX_LENGTH_MIN,
  DESCRIPTION_MAX_LENGTH_MAX,
  NUMPAD_MAX_DIGITS_MIN,
  NUMPAD_MAX_DIGITS_MAX,
  DASHBOARD_TX_LIMIT_MIN,
  DASHBOARD_TX_LIMIT_MAX,
} from '../constants/config';
import fieldStyles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettingsStore();
  const { members, fetchMembers } = useMemberStore();

  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [primaryMemberId, setPrimaryMemberId] = useState(settings.primaryMemberId ?? '');
  const [descriptionMaxLength, setDescriptionMaxLength] = useState(settings.descriptionMaxLength);
  const [numpadMaxDigits, setNumpadMaxDigits] = useState(settings.numpadMaxDigits);
  const [dashboardTxLimit, setDashboardTxLimit] = useState(settings.dashboardTxLimit);
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [fsPermission, setFsPermission] = useState<boolean | null>(null);
  const [restoringFromDrive, setRestoringFromDrive] = useState(false);

  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen, fetchMembers]);

  useEffect(() => {
    setCurrency(settings.currency);
    setLocale(settings.locale);
    setPrimaryMemberId(settings.primaryMemberId ?? '');
    setDescriptionMaxLength(settings.descriptionMaxLength);
    setNumpadMaxDigits(settings.numpadMaxDigits);
    setDashboardTxLimit(settings.dashboardTxLimit);
  }, [settings, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getDatabase().getSnapshots());
      setRestoreError(null);
      (async () => {
        const handle = await folderSync.getFolderHandle();
        if (handle) {
          setFolderName(handle.name);
          setFsPermission(await folderSync.hasPermission());
        } else {
          setFolderName(null);
          setFsPermission(null);
        }
      })();
    }
  }, [isOpen]);

  const handleRestore = useCallback(async (index: number, time: string) => {
    const ok = window.confirm(`Replace all current data with the snapshot from ${time}?`);
    if (!ok) return;
    setRestoring(true);
    setRestoreError(null);
    try {
      await getDatabase().restoreSnapshot(index);
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
      setRestoring(false);
    }
  }, []);

  const formatSnapshotTime = useCallback((iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString(settings.locale, { hour: '2-digit', minute: '2-digit' } as const);
    if (isToday) return `Today ${time}`;
    const date = d.toLocaleDateString(settings.locale, { month: 'short', day: 'numeric' } as const);
    return `${date} ${time}`;
  }, [settings.locale]);

  const handlePickFolder = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker();
      await folderSync.setFolder(handle);
      setFolderName(handle.name);
      setFsPermission(true);
    } catch { /* user cancelled */ }
  }, []);

  const handleReauthorize = useCallback(async () => {
    const ok = await folderSync.requestPermission();
    setFsPermission(ok);
  }, []);

  const handleStopBackup = useCallback(async () => {
    await folderSync.clearHandle();
    setFolderName(null);
    setFsPermission(null);
  }, []);

  const handleRestoreFromDrive = useCallback(async () => {
    const ok = window.confirm('Replace all current data with the backup from your synced folder?');
    if (!ok) return;
    setRestoringFromDrive(true);
    setRestoreError(null);
    try {
      const data = await folderSync.load();
      if (!data) throw new Error('No backup file found in synced folder');
      const db = getDatabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SQL = (db as any).SQL;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).db = new SQL.Database(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).save();
      window.location.reload();
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
      setRestoringFromDrive(false);
    }
  }, []);

  const handleSave = () => {
    updateSettings({
      currency,
      locale,
      primaryMemberId: primaryMemberId || null,
      descriptionMaxLength,
      numpadMaxDigits,
      dashboardTxLimit,
    });
    onClose();
  };

  const internalMembers = members.filter((m) => !m.isExternal);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" onSave={handleSave}>
      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Currency</label>
        <input
          className={fieldStyles.inputField}
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          placeholder="e.g. BDT, USD"
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Locale</label>
        <input
          className={fieldStyles.inputField}
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          placeholder="e.g. en-IN, en-US, bn-BD"
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Primary Member</label>
        <select
          className={fieldStyles.selectField}
          value={primaryMemberId}
          onChange={(e) => setPrimaryMemberId(e.target.value)}
        >
          <option value="">-- Auto-detect --</option>
          {internalMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Description Max Length</label>
        <input
          className={fieldStyles.inputField}
          type="number"
          min={DESCRIPTION_MAX_LENGTH_MIN}
          max={DESCRIPTION_MAX_LENGTH_MAX}
          value={descriptionMaxLength}
          onChange={(e) => setDescriptionMaxLength(Number(e.target.value))}
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Numpad Max Digits</label>
        <input
          className={fieldStyles.inputField}
          type="number"
          min={NUMPAD_MAX_DIGITS_MIN}
          max={NUMPAD_MAX_DIGITS_MAX}
          value={numpadMaxDigits}
          onChange={(e) => setNumpadMaxDigits(Number(e.target.value))}
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Dashboard Transaction Limit</label>
        <input
          className={fieldStyles.inputField}
          type="number"
          min={DASHBOARD_TX_LIMIT_MIN}
          max={DASHBOARD_TX_LIMIT_MAX}
          value={dashboardTxLimit}
          onChange={(e) => setDashboardTxLimit(Number(e.target.value))}
        />
      </div>

      <div className={fieldStyles.separator} />

      <div className={fieldStyles.sectionTitle}>Restore Points</div>
      {restoreError && <div className={fieldStyles.errorMsg}>{restoreError}</div>}
      {snapshots.length === 0 ? (
        <div className={fieldStyles.emptyState}>No backup snapshots found</div>
      ) : (
        <div className={fieldStyles.snapshotList}>
          {snapshots.map((snap, i) => (
            <div key={i} className={fieldStyles.snapshotRow}>
              <span className={fieldStyles.snapshotDot} />
              <span className={fieldStyles.snapshotTime}>{formatSnapshotTime(snap.time)}</span>
              <span className={fieldStyles.snapshotLabel}>— Auto-backup</span>
              <button
                className={fieldStyles.restoreBtn}
                onClick={() => handleRestore(i, formatSnapshotTime(snap.time))}
                disabled={restoring}
              >
                {restoring ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={fieldStyles.separator} />

      <div className={fieldStyles.sectionTitle}>Cloud Backup</div>
      {!isFsaSupported ? (
        <div className={fieldStyles.emptyState}>Cloud backup requires Chrome or Edge</div>
      ) : fsPermission === null ? (
        <div className={fieldStyles.emptyState}>
          <button className={fieldStyles.actionBtn} onClick={handlePickFolder}>
            Choose backup folder
          </button>
        </div>
      ) : fsPermission ? (
        <div className={fieldStyles.statusRow}>
          <span className={fieldStyles.statusDot} />
          <span className={fieldStyles.statusText}>Backing up to {folderName}</span>
          <button className={fieldStyles.restoreBtn} onClick={handleStopBackup}>Stop backup</button>
          <button className={fieldStyles.restoreBtn} onClick={handlePickFolder}>Change folder</button>
        </div>
      ) : (
        <div className={fieldStyles.statusRow}>
          <span className={fieldStyles.statusWarnDot} />
          <span className={fieldStyles.statusText}>Permission needed — click to re-authorize</span>
          <button className={fieldStyles.restoreBtn} onClick={handleReauthorize}>Re-authorize</button>
        </div>
      )}
      {fsPermission && (
        <button
          className={fieldStyles.actionBtn}
          onClick={handleRestoreFromDrive}
          disabled={restoringFromDrive}
          style={{ marginTop: 8, width: '100%' }}
        >
          {restoringFromDrive ? 'Restoring…' : 'Restore from Drive'}
        </button>
      )}

      <div className={fieldStyles.separator} />

      <div className={fieldStyles.actionsRow}>
        <button className={fieldStyles.actionBtn} onClick={() => getDatabase().exportToFile()}>
          ↓ Export Database
        </button>
        <button className={fieldStyles.actionBtn} onClick={() => getDatabase().importFromFile()}>
          ↑ Import Database
        </button>
      </div>
    </Modal>
  );
}
