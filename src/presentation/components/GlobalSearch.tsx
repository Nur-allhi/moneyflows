import { useState } from 'react';
import { Highlight } from '../utils/highlight';
import { useReplay } from '../hooks/useReplay';
import type { GlobalSearchItem, GlobalSearchSection } from './useGlobalSearch';
import styles from './GlobalSearch.module.css';

interface ResultsProps {
  sections: GlobalSearchSection[];
  flat: GlobalSearchItem[];
  activeIndex: number;
  query: string;
  onHover: (index: number) => void;
  onPick: (item: GlobalSearchItem) => void;
}

export function GlobalSearchResults({ sections, flat, activeIndex, query, onHover, onPick }: ResultsProps) {
  const [rowKey, replayRow] = useReplay();
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  if (sections.length === 0) {
    return (
      <div className={styles.dropdown} role="listbox" aria-label="Global search results">
        <div className="empty-state">
          <p className="empty-state-text">No matches for &ldquo;{query}&rdquo;</p>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.dropdown} role="listbox" aria-label="Global search results">
      {sections.map((sec) => (
        <div key={sec.label} className={styles.section}>
          <div className={styles.sectionLabel}>{sec.label}</div>
          {sec.items.map((item) => {
            const index = flat.indexOf(item);
            const active = index === activeIndex;
            return (
              <button
                key={item.key}
                type="button"
                role="option"
                aria-selected={active}
                className={`${styles.row} ${active ? styles.rowActive : ''} ${pickedKey === item.key && rowKey > 0 ? 'anim-pop' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => onHover(index)}
                onClick={() => { replayRow(); setPickedKey(item.key); onPick(item); }}
              >
                <span className="anim-target" key={`${item.key}-${pickedKey === item.key ? rowKey : 0}`}>
                <span className={styles.title}>
                  <Highlight text={item.title} query={query} />
                </span>
                {item.sub && <span className={styles.sub}>{item.sub}</span>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
