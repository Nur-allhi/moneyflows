import { useState } from 'react';
import { DatePicker } from '../../../components/ui/date-picker';
import { useReplay } from '../../../presentation/hooks/useReplay';
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
  const [presetKey, replayPreset] = useReplay();
  const [pickedPreset, setPickedPreset] = useState<ReportPreset | null>(null);
  const [acctKey, replayAcct] = useReplay();
  const [pickedAcct, setPickedAcct] = useState<string | null>(null);
  const [loansKey, replayLoans] = useReplay();
  const [ledgersKey, replayLedgers] = useReplay();
  const [resetKey, replayReset] = useReplay();
  const [applyKey, replayApply] = useReplay();
  return (
    <div className={styles.sheet}>
      <h3 className={styles.groupLabel}>Period</h3>
      <div className={styles.chipRow}>
        {(['all', 'month', 'last3', 'custom'] as ReportPreset[]).map((p) => (
          <button
            key={p}
            className={`${styles.chip} ${preset === p ? styles.chipActive : ''} ${pickedPreset === p && presetKey > 0 ? 'anim-pop' : ''}`}
            onClick={() => { replayPreset(); setPickedPreset(p); setPreset(p); }}
          >
            <span className="anim-target" key={`${p}-${pickedPreset === p ? presetKey : 0}`}>{p === 'all' ? 'All time' : p === 'month' ? 'This month' : p === 'last3' ? 'Last 3 months' : 'Custom'}</span>
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className={styles.dateRow}>
          <label className={styles.dateField}>From
            <DatePicker value={customStart} onChange={setCustomStart} />
          </label>
          <label className={styles.dateField}>To
            <DatePicker value={customEnd} onChange={setCustomEnd} />
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
                className={`${styles.chip} ${excluded.includes(a.id) ? '' : styles.chipActive} ${pickedAcct === a.id && acctKey > 0 ? 'anim-pop' : ''}`}
                onClick={() => { replayAcct(); setPickedAcct(a.id); toggleExcluded(a.id); }}
                title={excluded.includes(a.id) ? 'Include in report' : 'Exclude from report'}
              >
                <span className="anim-target" key={`${a.id}-${pickedAcct === a.id ? acctKey : 0}`}>{a.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className={styles.groupLabel}>Sections</h3>
      <div className={styles.chipRow}>
        <button
          className={`${styles.chip} ${includeLoans ? styles.chipActive : ''} ${loansKey > 0 ? 'anim-pop' : ''}`}
          onClick={() => { replayLoans(); setIncludeLoans(!includeLoans); }}
        >
          <span className="anim-target" key={loansKey}>Loans</span>
        </button>
        <button
          className={`${styles.chip} ${includeOtherLedgers ? styles.chipActive : ''} ${ledgersKey > 0 ? 'anim-pop' : ''}`}
          onClick={() => { replayLedgers(); setIncludeOtherLedgers(!includeOtherLedgers); }}
        >
          <span className="anim-target" key={ledgersKey}>Other ledgers</span>
        </button>
      </div>

      <div className={styles.footer}>
        <button className={`${styles.resetBtn} ${resetKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayReset(); onReset(); }}><span className="anim-target" key={resetKey}>Reset</span></button>
        <button className={`${styles.applyBtn} ${applyKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayApply(); onApply(); }}><span className="anim-target" key={applyKey}>Apply</span></button>
      </div>
    </div>
  );
}
