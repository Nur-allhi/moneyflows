import { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { isFsaSupported, folderSync } from '../../infrastructure/database/FolderSync';
import type { SnapshotInfo, StorageHealth } from '../../core/ports/IDatabaseService';
import { WhatsNewModal } from './WhatsNewModal';
import { AppearanceSection } from './AppearanceSection';
import { whatsNewFor } from '../constants/whatsNew';
import { APP_VERSION } from '../constants/appVersion';
import {
  DESCRIPTION_MAX_LENGTH_MIN,
  DESCRIPTION_MAX_LENGTH_MAX,
  NUMPAD_MAX_DIGITS_MIN,
  NUMPAD_MAX_DIGITS_MAX,
  DASHBOARD_TX_LIMIT_MIN,
  DASHBOARD_TX_LIMIT_MAX,
} from '../constants/config';
import fieldStyles from './SettingsModal.module.css';
import { SettingsDisclosure } from './settings/SettingsDisclosure';
import disclosureStyles from './settings/SettingsDisclosure.module.css';

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
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [fsPermission, setFsPermission] = useState<boolean | null>(null);
  const [backupFiles, setBackupFiles] = useState<{ name: string; lastModified: number }[]>([]);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      const p = (window as unknown as Record<string, unknown>).__installPrompt;
      if (p instanceof Event) setInstallPrompt(p);
    }
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
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
      (async () => {
        setSnapshots(await getDatabase().getSnapshots());
        setStorageHealth(getDatabase().getStorageHealth());
      })();
      setRestoreError(null);
      (async () => {
        const handle = await folderSync.getFolderHandle();
        if (handle) {
          setFolderName(handle.name);
          const ok = await folderSync.hasPermission();
          setFsPermission(ok);
          if (ok) {
            setBackupFiles(await folderSync.listFiles());
          }
        } else {
          setFolderName(null);
          setFsPermission(null);
          setBackupFiles([]);
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
      window.location.reload();
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
      setRestoring(false);
    }
  }, []);

  const formatSnapshotTime = useCallback((iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString(settings.locale, { hour: 'numeric', minute: '2-digit', hour12: true } as const);
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
      setBackupFiles(await folderSync.listFiles());
    } catch { /* user cancelled */ }
  }, []);

  const handleReauthorize = useCallback(async () => {
    const ok = await folderSync.requestPermission();
    setFsPermission(ok);
    if (ok) setBackupFiles(await folderSync.listFiles());
  }, []);

  const handleStopBackup = useCallback(async () => {
    await folderSync.clearHandle();
    setFolderName(null);
    setFsPermission(null);
  }, []);

  const handleRestoreFile = useCallback(async (name: string) => {
    const ts = name.replace('moneyflows-', '').replace('.db', '');
    const y = ts.slice(0, 4), M = ts.slice(4, 6), d = ts.slice(6, 8);
    const h = ts.slice(9, 11), m = ts.slice(11, 13), s = ts.slice(13, 15);
    const label = `${y}-${M}-${d} ${h}:${m}:${s}`;
    const ok = window.confirm(`Replace all current data with the backup from ${label}?`);
    if (!ok) return;
    setRestoringFile(name);
    setRestoreError(null);
    try {
      const data = await folderSync.loadFile(name);
      if (!data) throw new Error('Failed to read backup file');
      const db = getDatabase();
      await db.importFromBytes(data);
      window.location.reload();
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
      setRestoringFile(null);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" onSave={handleSave} className={fieldStyles.modalWrap}>
      <SettingsDisclosure title="Money & Region" subtitle="Currency, locale, primary member" defaultOpen badge={currency || undefined}>
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
      </SettingsDisclosure>

      <SettingsDisclosure title="Appearance" subtitle="Theme, accent, background, text size" defaultOpen>
        <AppearanceSection />
      </SettingsDisclosure>

      <SettingsDisclosure title="Limits" subtitle="Description, numpad, dashboard count">
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
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Restore Points"
        subtitle={snapshots.length === 0 ? 'No snapshots yet' : `Latest: ${formatSnapshotTime(snapshots[0]!.time)}`}
        badge={snapshots.length > 0 ? `${snapshots.length}` : undefined}
        defaultOpen
      >
        {restoreError && <div className={fieldStyles.errorMsg}>{restoreError}</div>}
        {snapshots.length === 0 ? (
          <div className={fieldStyles.emptyState}>No backup snapshots found</div>
        ) : (
          <>
            <div className={fieldStyles.snapshotRow}>
              <span className={fieldStyles.snapshotDot} />
              <span className={fieldStyles.snapshotTime}>{formatSnapshotTime(snapshots[0]!.time)}</span>
              <span className={fieldStyles.snapshotLabel}>— Latest auto-backup</span>
              <button
                className={fieldStyles.restoreBtn}
                onClick={() => handleRestore(0, formatSnapshotTime(snapshots[0]!.time))}
                disabled={restoring}
              >
                {restoring ? 'Restoring…' : 'Restore'}
              </button>
            </div>
            {snapshots.length > 1 && (
              <>
                <button className={disclosureStyles.showAllBtn} onClick={() => setShowAllSnapshots((s) => !s)}>
                  {showAllSnapshots ? 'Hide history' : `Show all ${snapshots.length} snapshots ▾`}
                </button>
                {showAllSnapshots && (
                  <div className={fieldStyles.snapshotList}>
                    {snapshots.slice(1).map((snap, idx) => (
                      <div key={idx + 1} className={fieldStyles.snapshotRow}>
                        <span className={fieldStyles.snapshotDot} />
                        <span className={fieldStyles.snapshotTime}>{formatSnapshotTime(snap.time)}</span>
                        <span className={fieldStyles.snapshotLabel}>— Auto-backup</span>
                        <button
                          className={fieldStyles.restoreBtn}
                          onClick={() => handleRestore(idx + 1, formatSnapshotTime(snap.time))}
                          disabled={restoring}
                        >
                          {restoring ? 'Restoring…' : 'Restore'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Cloud Backup"
        subtitle={!isFsaSupported ? 'Chrome/Edge only' : folderName ? `Backing up to ${folderName}` : 'Not connected'}
        badge={backupFiles.length > 0 ? `${backupFiles.length}` : undefined}
      >
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
          <>
            {backupFiles.length === 0 ? (
              <div className={fieldStyles.emptyState}>No backup files found in folder</div>
            ) : (
              <>
                {(() => {
                  const f = backupFiles[0]!;
                  const ts = f.name.replace('moneyflows-', '').replace('.db', '');
                  const label = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(9, 11)}:${ts.slice(11, 13)}`;
                  return (
                    <div className={fieldStyles.snapshotRow}>
                      <span className={fieldStyles.statusDot} />
                      <span className={fieldStyles.snapshotTime}>{label}</span>
                      <span className={fieldStyles.snapshotLabel}>— Latest file</span>
                      <button
                        className={fieldStyles.restoreBtn}
                        onClick={() => handleRestoreFile(f.name)}
                        disabled={restoringFile === f.name}
                      >
                        {restoringFile === f.name ? 'Restoring…' : 'Restore'}
                      </button>
                    </div>
                  );
                })()}
                {backupFiles.length > 1 && (
                  <>
                    <button className={disclosureStyles.showAllBtn} onClick={() => setShowAllFiles((s) => !s)}>
                      {showAllFiles ? 'Hide files' : `Show all ${backupFiles.length} files ▾`}
                    </button>
                    {showAllFiles && (
                      <div className={fieldStyles.snapshotList}>
                        {backupFiles.slice(1, 10).map((f) => {
                          const ts = f.name.replace('moneyflows-', '').replace('.db', '');
                          const label = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(9, 11)}:${ts.slice(11, 13)}`;
                          return (
                            <div key={f.name} className={fieldStyles.snapshotRow}>
                              <span className={fieldStyles.statusDot} />
                              <span className={fieldStyles.snapshotTime}>{label}</span>
                              <button
                                className={fieldStyles.restoreBtn}
                                onClick={() => handleRestoreFile(f.name)}
                                disabled={restoringFile === f.name}
                              >
                                {restoringFile === f.name ? 'Restoring…' : 'Restore'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Storage"
        subtitle={storageHealth ? (storageHealth.backend === 'opfs' ? 'OPFS fast local file' : 'Browser storage') : 'Engine status'}
        defaultOpen
      >
        {storageHealth && (
          <div className={fieldStyles.statusRow}>
            <span className={storageHealth.lastFlushFailed ? fieldStyles.statusWarnDot : fieldStyles.statusDot} />
            <span className={fieldStyles.statusText}>
              {storageHealth.backend === 'opfs' ? 'OPFS (fast local file)' : 'Browser storage'}
              {' — '}
              {storageHealth.lastFlushFailed
                ? 'last save failed; check disk space'
                : storageHealth.lastFlushAt
                  ? `saved ${new Date(storageHealth.lastFlushAt).toLocaleTimeString(settings.locale, { hour: 'numeric', minute: '2-digit', hour12: true })}`
                  : 'ready'}
            </span>
          </div>
        )}
        <div className={fieldStyles.actionsRow}>
          <button className={fieldStyles.actionBtn} onClick={() => getDatabase().exportToFile()}>
            ↓ Export Database
          </button>
          <button className={fieldStyles.actionBtn} onClick={() => getDatabase().importFromFile()}>
            ↑ Import Database
          </button>
        </div>
      </SettingsDisclosure>

      <SettingsDisclosure title="App" subtitle={`MoneyFlows v${APP_VERSION}`} defaultOpen>
        {installPrompt && (
          <div className={fieldStyles.statusRow}>
            <span className={fieldStyles.statusDot} />
            <span className={fieldStyles.statusText}>Install MoneyFlows on your device</span>
            <button className={fieldStyles.restoreBtn} onClick={async () => {
              (installPrompt as unknown as { prompt: () => Promise<void> }).prompt();
              const result = await (installPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
              if (result.outcome === 'accepted') setInstallPrompt(null);
            }}>
              Install
            </button>
          </div>
        )}

        <div className={fieldStyles.statusRow}>
          <span className={fieldStyles.statusDot} />
          <span className={fieldStyles.statusText}>See what&apos;s new in v{APP_VERSION}</span>
          <button className={fieldStyles.restoreBtn} onClick={() => setWhatsNewOpen(true)}>View</button>
        </div>

        <div className={fieldStyles.versionLine}>MoneyFlows v{APP_VERSION}</div>
      </SettingsDisclosure>

      <WhatsNewModal
        isOpen={whatsNewOpen}
        version={APP_VERSION}
        items={whatsNewFor(APP_VERSION)?.items ?? []}
        onClose={() => setWhatsNewOpen(false)}
      />
    </Modal>
  );
}
