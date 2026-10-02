import styles from './ReportFilterSheet.module.css';

export type ReportPreset = 'all' | 'month' | 'last3' | 'custom';

interface FilterSheetProps {
  preset: ReportPreset;
  setPreset: (p: ReportPreset) => void;
  customStart: string;
  customEnd: string;
  setCustomStart: (v: string) => void;
  setCustomEnd: (v: string) => void;
  memberAccounts: { id: string; name: string }[];
  excluded: string[];
  toggleExcluded: (id: string) => void;
  includeLoans: boolean;
  setIncludeLoans: (v: boolean) => void;
  includeOtherLedgers: boolean;
  setIncludeOtherLedgers: (v: boolean) => void;
  onReset: () => void;
  onApply: () => void;
}

export function ReportFilterSheet(props: FilterSheetProps) {
  const {
    preset, setPreset, customStart, customEnd, setCustomStart, setCustomEnd,
    memberAccounts, excluded, toggleExcluded,
    includeLoans, setIncludeLoans, includeOtherLedgers, setIncludeOtherLedgers,
    onReset, onApply,
  } = props;
  return (
    <div className={styles.sheet}>
      <h3 className={styles.groupLabel}>Period</h3>
      <div className={styles.chipRow}>
        {(['all', 'month', 'last3', 'custom'] as ReportPreset[]).map((p) => (
          <button
            key={p}
            className={`${styles.chip} ${preset === p ? styles.chipActive : ''}`}
            onClick={() => setPreset(p)}
          >
            {p === 'all' ? 'All time' : p === 'month' ? 'This month' : p === 'last3' ? 'Last 3 months' : 'Custom'}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className={styles.dateRow}>
          <label className={styles.dateField}>From
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </label>
          <label className={styles.dateField}>To
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </label>
        </div>
      )}

      {memberAccounts.length > 0 && (
        <>
          <h3 className={styles.groupLabel}>Accounts</h3>
          <div className={styles.chipRow}>
            {memberAccounts.map((a) => (
              <button
                key={a.id}
                className={`${styles.chip} ${excluded.includes(a.id) ? '' : styles.chipActive}`}
                onClick={() => toggleExcluded(a.id)}
                title={excluded.includes(a.id) ? 'Include in report' : 'Exclude from report'}
              >
                {a.name}
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className={styles.groupLabel}>Sections</h3>
      <div className={styles.chipRow}>
        <button
          className={`${styles.chip} ${includeLoans ? styles.chipActive : ''}`}
          onClick={() => setIncludeLoans(!includeLoans)}
        >
          Loans
        </button>
        <button
          className={`${styles.chip} ${includeOtherLedgers ? styles.chipActive : ''}`}
          onClick={() => setIncludeOtherLedgers(!includeOtherLedgers)}
        >
          Other ledgers
        </button>
      </div>

      <div className={styles.footer}>
        <button className={styles.resetBtn} onClick={onReset}>Reset</button>
        <button className={styles.applyBtn} onClick={onApply}>Apply</button>
      </div>
    </div>
  );
}
