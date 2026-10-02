import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { isFsaSupported, folderSync } from '../../infrastructure/database/FolderSync';
import type { SnapshotInfo, StorageHealth } from '../../core/ports/IDatabaseService';
import { WhatsNewModal } from '../components/WhatsNewModal';
import { AppearanceSection } from '../components/AppearanceSection';
import { whatsNewFor } from '../constants/whatsNew';
import { APP_VERSION } from '../constants/appVersion';
import { logger } from '../../core/logging';
import type { LogEntry } from '../../core/logging';
import { ProgressBar } from '../components/ProgressBar';
import { SettingsDisclosure } from '../components/settings/SettingsDisclosure';
import disclosureStyles from '../components/settings/SettingsDisclosure.module.css';
import {
  DESCRIPTION_MAX_LENGTH_MIN,
  DESCRIPTION_MAX_LENGTH_MAX,
  NUMPAD_MAX_DIGITS_MIN,
  NUMPAD_MAX_DIGITS_MAX,
  DASHBOARD_TX_LIMIT_MIN,
  DASHBOARD_TX_LIMIT_MAX,
} from '../constants/config';
import styles from './SettingsPage.module.css';

type Tab = 'general' | 'dashboard' | 'activity' | 'backup' | 'about';

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'activity', label: 'Activity' },
  { key: 'backup', label: 'Backup & Storage' },
  { key: 'about', label: 'About' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettingsStore();
  const { members, fetchMembers } = useMemberStore();

  const [activeTab, setActiveTab] = useState<Tab>('general');

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
  const [saved, setSaved] = useState(false);
  const [verbose, setVerbose] = useState(() => {
    try { return localStorage.getItem('moneyflows_logs_verbose') === '1'; } catch { return false; }
  });
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const [appLogs, setAppLogs] = useState<LogEntry[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const PAGE_SIZE = 10;
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    const p = (window as unknown as Record<string, unknown>).__installPrompt;
    if (p instanceof Event) setInstallPrompt(p);
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  useEffect(() => {
    setCurrency(settings.currency);
    setLocale(settings.locale);
    setPrimaryMemberId(settings.primaryMemberId ?? '');
    setDescriptionMaxLength(settings.descriptionMaxLength);
    setNumpadMaxDigits(settings.numpadMaxDigits);
    setDashboardTxLimit(settings.dashboardTxLimit);
  }, [settings]);

  const refreshSnapshots = useCallback(async () => {
    setSnapshots(await getDatabase().getSnapshots());
    setStorageHealth(getDatabase().getStorageHealth());
    const handle = await folderSync.getFolderHandle();
    if (handle) {
      setFolderName(handle.name);
      const ok = await folderSync.hasPermission();
      setFsPermission(ok);
      if (ok) setBackupFiles(await folderSync.listFiles());
    } else {
      setFolderName(null);
      setFsPermission(null);
      setBackupFiles([]);
    }
  }, []);

  useEffect(() => { void refreshSnapshots(); }, [refreshSnapshots]);

  const handleRestore = useCallback(async (index: number, time: string) => {
    if (!window.confirm(`Replace all current data with the snapshot from ${time}?`)) return;
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
    if (!window.confirm(`Replace all current data with the backup from ${label}?`)) return;
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
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  useEffect(() => {
    if (activeTab === 'activity') {
      setActivityLogs(logger.getEntries({ cat: 'activity', limit: 1000 }));
      setActivityPage(1);
    }
    if (activeTab === 'about') {
      setAppLogs(logger.getEntries({ limit: 1000 }));
      setAppPage(1);
    }
  }, [activeTab]);

  const handleExportLogs = () => {
    const ndjson = logger.export();
    const blob = new Blob([ndjson], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyflows-logs-${new Date().toISOString().slice(0, 10)}.ndjson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (!window.confirm('Clear all logs?')) return;
    logger.clear();
    setActivityLogs([]);
    setAppLogs([]);
    setActivityPage(1);
    setAppPage(1);
  };

  const toggleVerbose = () => {
    const next = !verbose;
    logger.setVerbose(next);
    setVerbose(next);
  };

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(10);
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.db';
      const file = await new Promise<File | null>((resolve) => {
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.addEventListener('cancel', () => resolve(null), { once: true });
        input.click();
        // Fallback for browsers without cancel event — check after focus returns
        const onFocus = () => {
          setTimeout(() => {
            if (!input.files?.length) resolve(null);
          }, 300);
          window.removeEventListener('focus', onFocus);
        };
        window.addEventListener('focus', onFocus, { once: true });
      });
      if (!file) {
        setImporting(false);
        setImportProgress(0);
        return;
      }
      setImportProgress(30);
      const buffer = await file.arrayBuffer();
      setImportProgress(60);
      await getDatabase().importFromBytes(new Uint8Array(buffer));
      setImportProgress(100);
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 400);
    } catch {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const internalMembers = members.filter((m) => !m.isExternal);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <nav className={styles.subNav} aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.navItem} ${activeTab === t.key ? styles.navActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'general' && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>General</h2>
                <span>Currency, appearance and limits</span>
              </div>
              <SettingsDisclosure title="Money & Region" subtitle="Currency, locale, primary member" defaultOpen badge={`${currency || '—'}`}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Currency</label>
                  <input className={styles.inputField} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="e.g. BDT, USD" />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Locale</label>
                  <input className={styles.inputField} value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="e.g. en-IN, en-US, bn-BD" />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Primary Member</label>
                  <select className={styles.selectField} value={primaryMemberId} onChange={(e) => setPrimaryMemberId(e.target.value)}>
                    <option value="">-- Auto-detect --</option>
                    {internalMembers.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                  </select>
                </div>
              </SettingsDisclosure>
              <SettingsDisclosure title="Appearance" subtitle="Theme, accent, background, text size" defaultOpen>
                <AppearanceSection />
              </SettingsDisclosure>
              <SettingsDisclosure title="Limits" subtitle="Description, numpad, dashboard count">
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Description Max Length</label>
                  <input className={styles.inputField} type="number" min={DESCRIPTION_MAX_LENGTH_MIN} max={DESCRIPTION_MAX_LENGTH_MAX} value={descriptionMaxLength} onChange={(e) => setDescriptionMaxLength(Number(e.target.value))} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Numpad Max Digits</label>
                  <input className={styles.inputField} type="number" min={NUMPAD_MAX_DIGITS_MIN} max={NUMPAD_MAX_DIGITS_MAX} value={numpadMaxDigits} onChange={(e) => setNumpadMaxDigits(Number(e.target.value))} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Dashboard Transaction Limit</label>
                  <input className={styles.inputField} type="number" min={DASHBOARD_TX_LIMIT_MIN} max={DASHBOARD_TX_LIMIT_MAX} value={dashboardTxLimit} onChange={(e) => setDashboardTxLimit(Number(e.target.value))} />
                </div>
              </SettingsDisclosure>
              <button className={styles.saveBtn} onClick={handleSave}>{saved ? 'Saved ✓' : 'Save changes'}</button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Dashboard</h2>
                <span>Show or hide sections</span>
              </div>
              <SettingsDisclosure title="Sections" subtitle="Which cards appear on dashboard" defaultOpen>
                <label className={styles.toggleRow}>
                  <span>Where Your Money is</span>
                  <button
                    role="switch"
                    aria-checked={settings.showWhereMoneyIs ?? true}
                    className={`${styles.switch} ${(settings.showWhereMoneyIs ?? true) ? styles.switchOn : ''}`}
                    onClick={() => updateSettings({ showWhereMoneyIs: !(settings.showWhereMoneyIs ?? true) })}
                  >
                    <span className={styles.knob} />
                  </button>
                </label>
                <label className={styles.toggleRow}>
                  <span>Recent Transactions</span>
                  <button
                    role="switch"
                    aria-checked={settings.showRecentTransactions ?? true}
                    className={`${styles.switch} ${(settings.showRecentTransactions ?? true) ? styles.switchOn : ''}`}
                    onClick={() => updateSettings({ showRecentTransactions: !(settings.showRecentTransactions ?? true) })}
                  >
                    <span className={styles.knob} />
                  </button>
                </label>
                <label className={styles.toggleRow}>
                  <span>Active Loans</span>
                  <button
                    role="switch"
                    aria-checked={settings.showActiveLoans ?? true}
                    className={`${styles.switch} ${(settings.showActiveLoans ?? true) ? styles.switchOn : ''}`}
                    onClick={() => updateSettings({ showActiveLoans: !(settings.showActiveLoans ?? true) })}
                  >
                    <span className={styles.knob} />
                  </button>
                </label>
              </SettingsDisclosure>
              <SettingsDisclosure title="Calculation" subtitle="What counts toward totals">
                <label className={styles.toggleRow}>
                  <span>Total Assets includes Active Loans</span>
                  <button
                    role="switch"
                    aria-checked={settings.totalAssetsIncludeLoans ?? false}
                    className={`${styles.switch} ${(settings.totalAssetsIncludeLoans ?? false) ? styles.switchOn : ''}`}
                    onClick={() => updateSettings({ totalAssetsIncludeLoans: !(settings.totalAssetsIncludeLoans ?? false) })}
                  >
                    <span className={styles.knob} />
                  </button>
                </label>
              </SettingsDisclosure>
            </div>
          )}

          {activeTab === 'activity' && (() => {
            const totalPages = Math.max(1, Math.ceil(activityLogs.length / PAGE_SIZE));
            const page = Math.min(activityPage, totalPages);
            const slice = activityLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            return (
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h2>Activity</h2>
                  <span>Your recent actions — last 1000, 10 per page</span>
                </div>
                <SettingsDisclosure
                  title="Recent activity"
                  subtitle={activityLogs.length === 0 ? 'Nothing yet' : `${activityLogs.length} entries`}
                  badge={activityLogs.length > 0 ? `${activityLogs.length}` : undefined}
                  defaultOpen
                >
                  {activityLogs.length === 0 ? (
                    <div className={styles.emptyState}>No activity yet — add a transaction to see it here.</div>
                  ) : (
                    <>
                      <div className={styles.logContainer}>
                        {slice.map((e) => (
                          <div key={e.id} className={styles.snapshotRow}>
                            <span className={styles.snapshotTime}>{new Date(e.ts).toLocaleString(settings.locale, { hour: 'numeric', minute: '2-digit', hour12: true } as const)} — {new Date(e.ts).toLocaleDateString(settings.locale, { month: 'short', day: 'numeric' } as const)}</span>
                            <span className={styles.snapshotLabel}>{e.msg}</span>
                          </div>
                        ))}
                      </div>
                      <div className={styles.pagination}>
                        <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setActivityPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
                        <span className={styles.pageInfo}>Page {page} of {totalPages} — {activityLogs.length} total</span>
                        <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setActivityPage((p) => Math.min(totalPages, p + 1))}>Next ›</button>
                      </div>
                    </>
                  )}
                  <button className={disclosureStyles.showAllBtn} onClick={() => { const logs = logger.getEntries({ cat: 'activity', limit: 1000 }); setActivityLogs(logs); setActivityPage(1); }}>Refresh</button>
                </SettingsDisclosure>
              </div>
            );
          })()}

          {activeTab === 'backup' && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Backup & Storage</h2>
                <span>Restore points, cloud folder, engine and import/export</span>
              </div>
              {restoreError && <div className={styles.errorMsg}>{restoreError}</div>}
              <SettingsDisclosure
                title="Restore Points"
                subtitle={snapshots.length === 0 ? 'No snapshots yet' : `Latest: ${formatSnapshotTime(snapshots[0]!.time)}`}
                badge={snapshots.length > 0 ? `${snapshots.length}` : undefined}
                defaultOpen
              >
                {snapshots.length === 0 ? (
                  <div className={styles.emptyState}>No backup snapshots found</div>
                ) : (
                  <>
                    <div className={styles.snapshotRow}>
                      <span className={styles.snapshotDot} />
                      <span className={styles.snapshotTime}>{formatSnapshotTime(snapshots[0]!.time)}</span>
                      <span className={styles.snapshotLabel}>— Latest auto-backup</span>
                      <button className={styles.restoreBtn} onClick={() => handleRestore(0, formatSnapshotTime(snapshots[0]!.time))} disabled={restoring}>{restoring ? 'Restoring…' : 'Restore'}</button>
                    </div>
                    {snapshots.length > 1 && (
                      <>
                        <button className={disclosureStyles.showAllBtn} onClick={() => setShowAllSnapshots((s) => !s)}>
                          {showAllSnapshots ? `Hide history` : `Show all ${snapshots.length} snapshots ▾`}
                        </button>
                        {showAllSnapshots && (
                          <div className={styles.snapshotList}>
                            {snapshots.slice(1).map((snap, idx) => (
                              <div key={idx + 1} className={styles.snapshotRow}>
                                <span className={styles.snapshotDot} />
                                <span className={styles.snapshotTime}>{formatSnapshotTime(snap.time)}</span>
                                <span className={styles.snapshotLabel}>— Auto-backup</span>
                                <button className={styles.restoreBtn} onClick={() => handleRestore(idx + 1, formatSnapshotTime(snap.time))} disabled={restoring}>{restoring ? 'Restoring…' : 'Restore'}</button>
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
                defaultOpen={false}
              >
                {!isFsaSupported ? (
                  <div className={styles.emptyState}>Cloud backup requires Chrome or Edge</div>
                ) : fsPermission === null ? (
                  <div className={styles.emptyState}><button className={styles.actionBtn} onClick={handlePickFolder}>Choose backup folder</button></div>
                ) : fsPermission ? (
                  <div className={styles.statusRow}>
                    <span className={styles.statusDot} />
                    <span className={styles.statusText}>Backing up to {folderName}</span>
                    <button className={styles.restoreBtn} onClick={handleStopBackup}>Stop backup</button>
                    <button className={styles.restoreBtn} onClick={handlePickFolder}>Change folder</button>
                  </div>
                ) : (
                  <div className={styles.statusRow}>
                    <span className={styles.statusWarnDot} />
                    <span className={styles.statusText}>Permission needed — click to re-authorize</span>
                    <button className={styles.restoreBtn} onClick={handleReauthorize}>Re-authorize</button>
                  </div>
                )}
                {fsPermission && (
                  <>
                    {backupFiles.length === 0 ? (
                      <div className={styles.emptyState}>No backup files found in folder</div>
                    ) : (
                      <>
                        {(() => {
                          const f = backupFiles[0]!;
                          const ts = f.name.replace('moneyflows-', '').replace('.db', '');
                          const label = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(9, 11)}:${ts.slice(11, 13)}`;
                          return (
                            <div className={styles.snapshotRow}>
                              <span className={styles.statusDot} />
                              <span className={styles.snapshotTime}>{label}</span>
                              <span className={styles.snapshotLabel}>— Latest file</span>
                              <button className={styles.restoreBtn} onClick={() => handleRestoreFile(f.name)} disabled={restoringFile === f.name}>{restoringFile === f.name ? 'Restoring…' : 'Restore'}</button>
                            </div>
                          );
                        })()}
                        {backupFiles.length > 1 && (
                          <>
                            <button className={disclosureStyles.showAllBtn} onClick={() => setShowAllFiles((s) => !s)}>
                              {showAllFiles ? 'Hide files' : `Show all ${backupFiles.length} files ▾`}
                            </button>
                            {showAllFiles && (
                              <div className={styles.snapshotList}>
                                {backupFiles.slice(1, 10).map((f) => {
                                  const ts = f.name.replace('moneyflows-', '').replace('.db', '');
                                  const label = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(9, 11)}:${ts.slice(11, 13)}`;
                                  return (
                                    <div key={f.name} className={styles.snapshotRow}>
                                      <span className={styles.statusDot} />
                                      <span className={styles.snapshotTime}>{label}</span>
                                      <button className={styles.restoreBtn} onClick={() => handleRestoreFile(f.name)} disabled={restoringFile === f.name}>{restoringFile === f.name ? 'Restoring…' : 'Restore'}</button>
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
                title="Engine Health"
                subtitle={storageHealth ? (storageHealth.backend === 'opfs' ? 'OPFS fast local file' : 'Browser storage') : 'Checking…'}
                defaultOpen={false}
              >
                {storageHealth && (
                  <div className={styles.statusRow}>
                    <span className={storageHealth.lastFlushFailed ? styles.statusWarnDot : styles.statusDot} />
                    <span className={styles.statusText}>
                      {storageHealth.backend === 'opfs' ? 'OPFS (fast local file)' : 'Browser storage'}{' — '}
                      {storageHealth.lastFlushFailed ? 'last save failed; check disk space' : storageHealth.lastFlushAt ? `saved ${new Date(storageHealth.lastFlushAt).toLocaleTimeString(settings.locale, { hour: 'numeric', minute: '2-digit', hour12: true } as const)}` : 'ready'}
                    </span>
                  </div>
                )}
              </SettingsDisclosure>
              <SettingsDisclosure title="Import / Export" subtitle="Move your database file" defaultOpen={false}>
                <div className={styles.actionsRow}>
                  <button className={styles.actionBtn} onClick={() => getDatabase().exportToFile()}>↓ Export Database</button>
                  <button className={styles.actionBtn} onClick={handleImport} disabled={importing}>↑ Import Database</button>
                </div>
              </SettingsDisclosure>
            </div>
          )}

          {activeTab === 'about' && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>About</h2>
                <span>Version and updates</span>
              </div>
              <SettingsDisclosure title="App" subtitle={`MoneyFlows v${APP_VERSION}`} defaultOpen>
                {installPrompt && (
                  <div className={styles.statusRow}>
                    <span className={styles.statusDot} />
                    <span className={styles.statusText}>Install MoneyFlows on your device</span>
                    <button className={styles.restoreBtn} onClick={async () => {
                      (installPrompt as unknown as { prompt: () => Promise<void> }).prompt();
                      const result = await (installPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
                      if (result.outcome === 'accepted') setInstallPrompt(null);
                    }}>Install</button>
                  </div>
                )}
                <div className={styles.statusRow}>
                  <span className={styles.statusDot} />
                  <span className={styles.statusText}>See what&apos;s new in v{APP_VERSION}</span>
                  <button className={styles.restoreBtn} onClick={() => setWhatsNewOpen(true)}>View</button>
                </div>
                <div className={styles.versionLine}>MoneyFlows v{APP_VERSION}</div>
                <button className={disclosureStyles.showAllBtn} onClick={() => { updateSettings({ setupComplete: false }); navigate('/setup'); }}>Replay setup wizard</button>
              </SettingsDisclosure>
              <SettingsDisclosure
                title="Diagnostics"
                subtitle="Dev logs — hidden unless needed"
                badge={appLogs.length > 0 ? `${appLogs.length}` : undefined}
                defaultOpen={false}
              >
                <label className={styles.toggleRow}>
                  <span>Detailed logs</span>
                  <button role="switch" aria-checked={verbose} className={`${styles.switch} ${verbose ? styles.switchOn : ''}`} onClick={toggleVerbose} title="When on, extra details are saved to help find bugs">
                    <span className={styles.knob} />
                  </button>
                </label>
                <div className={styles.actionsRow}>
                  <button className={styles.actionBtn} onClick={handleExportLogs}>↓ Export Logs</button>
                  <button className={styles.actionBtn} onClick={handleClearLogs}>Clear Logs</button>
                </div>
                {appLogs.length === 0 ? (
                  <div className={styles.emptyState}>No logs yet — logs appear as you use the app.</div>
                ) : (() => {
                  const totalPages = Math.max(1, Math.ceil(appLogs.length / PAGE_SIZE));
                  const page = Math.min(appPage, totalPages);
                  const slice = appLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
                  return (
                    <>
                      <div className={styles.logContainer}>
                        {slice.map((e) => (
                          <div key={e.id} className={styles.snapshotRow}>
                            <span className={e.level === 'error' ? styles.statusWarnDot : styles.statusDot} />
                            <span className={styles.snapshotTime}>{e.level}/{e.cat}</span>
                            <span className={styles.snapshotLabel}>{e.msg}</span>
                          </div>
                        ))}
                      </div>
                      <div className={styles.pagination}>
                        <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setAppPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
                        <span className={styles.pageInfo}>Page {page} of {totalPages} — {appLogs.length} total</span>
                        <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setAppPage((p) => Math.min(totalPages, p + 1))}>Next ›</button>
                      </div>
                    </>
                  );
                })()}
              </SettingsDisclosure>
              <WhatsNewModal isOpen={whatsNewOpen} version={APP_VERSION} items={whatsNewFor(APP_VERSION)?.items ?? []} onClose={() => setWhatsNewOpen(false)} />
            </div>
          )}
        </div>
      </div>
      {importing && (
        <div className={styles.importOverlay}>
          <div className={styles.importModal}>
            <div className={styles.importTitle}>Importing database…</div>
            <ProgressBar percent={importProgress} />
            <div className={styles.importSub}>Please wait — refreshing to dashboard</div>
          </div>
        </div>
      )}
    </div>
  );
}
