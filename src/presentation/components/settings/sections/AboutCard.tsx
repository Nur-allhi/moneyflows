import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { logger } from '../../../../core/logging';
import type { LogEntry } from '../../../../core/logging';
import { APP_VERSION } from '../../../constants/appVersion';
import { SettingsDisclosure } from '../SettingsDisclosure';
import disclosureStyles from '../SettingsDisclosure.module.css';
import { AboutApp } from './AboutApp';
import type { Cx } from './cx';

interface AboutCardProps {
  cx: Cx;
  onReplayWizard: () => void;
}

const PAGE_SIZE = 10;

/** Version/about + recent activity + diagnostics card. */
export function AboutCard({ cx, onReplayWizard }: AboutCardProps) {
  const locale = useSettingsStore((s) => s.settings.locale);
  const [verbose, setVerbose] = useState(() => {
    try { return localStorage.getItem('moneyflows_logs_verbose') === '1'; } catch { return false; }
  });
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const [appLogs, setAppLogs] = useState<LogEntry[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [appPage, setAppPage] = useState(1);

  useEffect(() => {
    setActivityLogs(logger.getEntries({ cat: 'activity', limit: 1000 }));
    setAppLogs(logger.getEntries({ limit: 1000 }));
  }, []);

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

  const renderLogList = (
    logs: LogEntry[],
    page: number,
    setPage: (p: number) => void,
    emptyText: string,
    timeCell: (e: LogEntry) => ReactNode,
    labelCell: (e: LogEntry) => ReactNode,
  ) => {
    if (logs.length === 0) return <div className={cx.emptyState}>{emptyText}</div>;
    const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const slice = logs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return (
      <>
        <div className={cx.logContainer}>
          {slice.map((e) => (
            <div key={e.id} className={cx.snapshotRow}>
              {timeCell(e)}
              {labelCell(e)}
            </div>
          ))}
        </div>
        <div className={cx.pagination}>
          <button className={cx.pageBtn} disabled={safePage <= 1} onClick={() => setPage(Math.max(1, safePage - 1))}>‹ Prev</button>
          <span className={cx.pageInfo}>Page {safePage} of {totalPages} — {logs.length} total</span>
          <button className={cx.pageBtn} disabled={safePage >= totalPages} onClick={() => setPage(Math.min(totalPages, safePage + 1))}>Next ›</button>
        </div>
      </>
    );
  };

  return (
    <SettingsDisclosure
      title="About"
      subtitle="Version, activity and diagnostics"
      badge={`v${APP_VERSION}`}
      defaultOpen={false}
    >
      <AboutApp cx={cx} onReplayWizard={onReplayWizard} />
      <div className={cx.sectionTitle}>Recent activity</div>
        {renderLogList(
          activityLogs,
          activityPage,
          setActivityPage,
          'No activity yet — add a transaction to see it here.',
          (e) => (
            <span className={cx.snapshotTime}>
              {new Date(e.ts).toLocaleString(locale, { hour: 'numeric', minute: '2-digit', hour12: true } as const)} — {new Date(e.ts).toLocaleDateString(locale, { month: 'short', day: 'numeric' } as const)}
            </span>
          ),
          (e) => <span className={cx.snapshotLabel}>{e.msg}</span>,
        )}
        <button
          className={disclosureStyles.showAllBtn}
          onClick={() => {
            setActivityLogs(logger.getEntries({ cat: 'activity', limit: 1000 }));
            setAppLogs(logger.getEntries({ limit: 1000 }));
            setActivityPage(1);
          }}
        >
          Refresh
        </button>
        <div className={cx.sectionTitle}>Diagnostics</div>
        <label className={cx.toggleRow}>
          <span>Detailed logs</span>
          <button role="switch" aria-checked={verbose} className={`${cx.switch} ${verbose ? cx.switchOn : ''}`} onClick={toggleVerbose} title="When on, extra details are saved to help find bugs">
            <span className={cx.knob} />
          </button>
        </label>
        <div className={cx.actionsRow}>
          <button className={cx.actionBtn} onClick={handleExportLogs}>↓ Export Logs</button>
          <button className={cx.actionBtn} onClick={handleClearLogs}>Clear Logs</button>
        </div>
        {renderLogList(
          appLogs,
          appPage,
          setAppPage,
          'No logs yet — logs appear as you use the app.',
          (e) => (
            <>
              <span className={e.level === 'error' ? cx.statusWarnDot : cx.statusDot} />
              <span className={cx.snapshotTime}>{e.level}/{e.cat}</span>
            </>
          ),
          (e) => <span className={cx.snapshotLabel}>{e.msg}</span>,
        )}
    </SettingsDisclosure>
  );
}
