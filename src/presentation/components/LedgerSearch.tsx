import { useReplay } from '../hooks/useReplay';
import styles from './LedgerSearch.module.css';

interface LedgerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function LedgerSearch({ value, onChange }: LedgerSearchProps) {
  const [clearKey, replayClear] = useReplay();
  return (
    <div className={`${styles.wrap} ${value ? styles.hasValue : ''}`}>
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        className={styles.input}
        type="text"
        placeholder="Search ledger…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className={`${styles.clear} ${clearKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayClear(); onChange(''); }} title="Clear search">
          <svg key={clearKey} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
