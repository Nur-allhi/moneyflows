import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { isFsaSupported } from '../../infrastructure/database/FolderSync';
import { AppearanceSection } from '../components/AppearanceSection';
import { APP_VERSION } from '../constants/appVersion';
import { logger } from '../../core/logging';
import type { LogEntry } from '../../core/logging';
import { ProgressBar } from '../components/ProgressBar';
import { SettingsDisclosure } from '../components/settings/SettingsDisclosure';
import { CloudSyncSection } from '../components/settings/CloudSyncSection';
import disclosureStyles from '../components/settings/SettingsDisclosure.module.css';
import {
  useBackupState,
  MoneyRegionFields,
  LimitsFields,
  RestorePoints,
  FolderBackup,
  EngineHealth,
  ImportExportRow,
  AboutApp,
} from '../components/settings/sections';
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
  const { fetchMembers } = useMemberStore();

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [searchParams] = useSearchParams();
  // Deep link (T-157 follow-up): /settings?tab=backup&open=google-drive-sync
  // lands on Backup with the Google section already open (header sync button).
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'general' || tab === 'dashboard' || tab === 'activity' || tab === 'backup' || tab === 'about') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [primaryMemberId, setPrimaryMemberId] = useState(settings.primaryMemberId ?? '');
  const [descriptionMaxLength, setDescriptionMaxLength] = useState(settings.descriptionMaxLength);
  const [numpadMaxDigits, setNumpadMaxDigits] = useState(settings.numpadMaxDigits);
  const [dashboardTxLimit, setDashboardTxLimit] = useState(settings.dashboardTxLimit);

  const backup = useBackupState();
  const refreshBackup = backup.refresh;
  const [saved, setSaved] = useState(false);
  const [verbose, setVerbose] = useState(() => {
    try { return localStorage.getItem('moneyflows_logs_verbose') === '1'; } catch { return false; }
  });
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const [appLogs, setAppLogs] = useState<LogEntry[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const PAGE_SIZE = 10;
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => { void refreshBackup(); }, [refreshBackup]);

  useEffect(() => {
    setCurrency(settings.currency);
    setLocale(settings.locale);
    setPrimaryMemberId(settings.primaryMemberId ?? '');
    setDescriptionMaxLength(settings.descriptionMaxLength);
    setNumpadMaxDigits(settings.numpadMaxDigits);
    setDashboardTxLimit(settings.dashboardTxLimit);
  }, [settings]);

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

  const cx = styles;

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
                <MoneyRegionFields
                  cx={cx}
                  currency={currency}
                  onCurrency={setCurrency}
                  locale={locale}
                  onLocale={setLocale}
                  primaryMemberId={primaryMemberId}
                  onPrimaryMemberId={setPrimaryMemberId}
                />
              </SettingsDisclosure>
              <SettingsDisclosure title="Appearance" subtitle="Theme, accent, background, text size" defaultOpen>
                <AppearanceSection />
              </SettingsDisclosure>
              <SettingsDisclosure title="Limits" subtitle="Description, numpad, dashboard count">
                <LimitsFields
                  cx={cx}
                  descriptionMaxLength={descriptionMaxLength}
                  onDescriptionMaxLength={setDescriptionMaxLength}
                  numpadMaxDigits={numpadMaxDigits}
                  onNumpadMaxDigits={setNumpadMaxDigits}
                  dashboardTxLimit={dashboardTxLimit}
                  onDashboardTxLimit={setDashboardTxLimit}
                />
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
                <label className={styles.toggleRow}>
                  <span>Metric Cards</span>
                  <button
                    role="switch"
                    aria-checked={settings.showMetricCards ?? true}
                    className={`${styles.switch} ${(settings.showMetricCards ?? true) ? styles.switchOn : ''}`}
                    onClick={() => updateSettings({ showMetricCards: !(settings.showMetricCards ?? true) })}
                  >
                    <span className={styles.knob} />
                  </button>
                </label>
                <label className={styles.toggleRow}>
                  <span>Month Summary</span>
                  <button
                    role="switch"
                    aria-checked={settings.showMonthSummary ?? true}
                    className={`${styles.switch} ${(settings.showMonthSummary ?? true) ? styles.switchOn : ''}`}
                    onClick={() => updateSettings({ showMonthSummary: !(settings.showMonthSummary ?? true) })}
                  >
                    <span className={styles.knob} />
                  </button>
                </label>
                <label className={styles.toggleRow}>
                  <span>Quick Actions</span>
                  <button
                    role="switch"
                    aria-checked={settings.showQuickActions ?? true}
                    className={`${styles.switch} ${(settings.showQuickActions ?? true) ? styles.switchOn : ''}`}
                    onClick={() => updateSettings({ showQuickActions: !(settings.showQuickActions ?? true) })}
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
              {backup.restoreError && <div className={styles.errorMsg}>{backup.restoreError}</div>}
              <SettingsDisclosure
                title="Restore Points"
                subtitle={backup.snapshots.length === 0 ? 'No snapshots yet' : `Latest: ${backup.formatSnapshotTime(backup.snapshots[0]!.time)}`}
                badge={backup.snapshots.length > 0 ? `${backup.snapshots.length}` : undefined}
                defaultOpen
              >
                <RestorePoints
                  cx={cx}
                  snapshots={backup.snapshots}
                  restoring={backup.restoring}
                  onRestore={backup.handleRestore}
                  formatTime={backup.formatSnapshotTime}
                />
              </SettingsDisclosure>
              <SettingsDisclosure
                title="Cloud Backup"
                subtitle={!isFsaSupported ? 'Chrome/Edge only' : backup.folderName ? `Backing up to ${backup.folderName}` : 'Not connected'}
                badge={backup.backupFiles.length > 0 ? `${backup.backupFiles.length}` : undefined}
                defaultOpen={false}
              >
                <FolderBackup
                  cx={cx}
                  folderName={backup.folderName}
                  fsPermission={backup.fsPermission}
                  backupFiles={backup.backupFiles}
                  restoringFile={backup.restoringFile}
                  onPickFolder={backup.handlePickFolder}
                  onReauthorize={backup.handleReauthorize}
                  onStopBackup={backup.handleStopBackup}
                  onRestoreFile={backup.handleRestoreFile}
                />
              </SettingsDisclosure>
              <CloudSyncSection forceOpen={searchParams.get('open') === 'google-drive-sync'} />
              <SettingsDisclosure
                title="Engine Health"
                subtitle={backup.storageHealth ? (backup.storageHealth.backend === 'opfs' ? 'OPFS fast local file' : 'Browser storage') : 'Checking…'}
                defaultOpen={false}
              >
                <EngineHealth cx={cx} storageHealth={backup.storageHealth} />
              </SettingsDisclosure>
              <SettingsDisclosure title="Import / Export" subtitle="Move your database file" defaultOpen={false}>
                <ImportExportRow cx={cx} onExport={backup.handleExportDb} onImport={handleImport} importDisabled={importing} />
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
                <AboutApp cx={cx} onReplayWizard={() => { updateSettings({ setupComplete: false }); navigate('/setup'); }} />
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
