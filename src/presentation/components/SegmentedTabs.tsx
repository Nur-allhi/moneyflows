import styles from './SegmentedTabs.module.css';

interface SegmentedTab {
  key: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function SegmentedTabs({ tabs, activeKey, onChange, className = '' }: SegmentedTabsProps) {
  return (
    <div className={`${styles.container} ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={tab.key === activeKey}
          className={`${styles.tab} ${tab.key === activeKey ? styles.active : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
