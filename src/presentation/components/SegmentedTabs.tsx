import { useState } from 'react';
import { useReplay } from '../hooks/useReplay';
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
  const [listKey, replayList] = useReplay();
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  return (
    <div className={`${styles.container} ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={tab.key === activeKey}
          className={`${styles.tab} ${tab.key === activeKey ? styles.active : ''} ${pickedKey === tab.key && listKey > 0 ? 'anim-pop' : ''}`}
          onClick={() => { replayList(); setPickedKey(tab.key); onChange(tab.key); }}
        >
          <span className="anim-target" key={`${tab.key}-${pickedKey === tab.key ? listKey : 0}`}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
