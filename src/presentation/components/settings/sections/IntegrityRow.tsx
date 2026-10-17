import { useState } from 'react';
import type { IntegrityReport } from '../../../../core/domain/transactionIntegrity';
import disclosureStyles from '../SettingsDisclosure.module.css';
import type { Cx } from './cx';

interface IntegrityRowProps {
  cx: Cx;
  /** null while the scan is still running (or when it could not run). */
  report: IntegrityReport | null;
}

/** Rows listed at once before "Show all"; a poisoned database could hold thousands. */
const MAX_SHOWN = 20;

/**
 * BUG-41: what the read-only integrity scan found in the stored transactions.
 * Reports only — nothing here changes a record.
 */
export function IntegrityRow({ cx, report }: IntegrityRowProps) {
  const [expanded, setExpanded] = useState(false);

  if (!report) return null;

  const found = report.issues.length;
  const shown = expanded ? report.issues : report.issues.slice(0, MAX_SHOWN);

  return (
    <>
      <div className={cx.statusRow}>
        <span className={found > 0 ? cx.statusWarnDot : cx.statusDot} />
        <span className={cx.statusText}>
          {found > 0
            ? `${found} of ${report.scanned} records need attention`
            : `All ${report.scanned} records check out`}
        </span>
        {found > MAX_SHOWN && (
          <button className={disclosureStyles.showAllBtn} onClick={() => setExpanded((s) => !s)}>
            {expanded ? 'Show less' : `Show all ${found}`}
          </button>
        )}
      </div>
      {found > 0 && (
        <div className={cx.snapshotList}>
          {shown.map((issue) => (
            <div key={issue.id} className={cx.snapshotRow}>
              <span className={cx.statusWarnDot} />
              <span className={cx.snapshotTime}>{issue.date}</span>
              <span className={cx.snapshotLabel}>
                {issue.description || 'No description'} — {issue.reasons.join('; ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
