import styles from './TabBar.module.css';

interface TabBarTab {
  key: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: TabBarTab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeKey, onChange, className = '' }: TabBarProps) {
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
          {tab.count !== undefined && (
            <span className={styles.count}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
