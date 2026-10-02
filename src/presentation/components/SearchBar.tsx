import { useRef, useState } from 'react';
import { useSearchStore } from '../stores/useSearchStore';
import { GlobalSearchResults } from './GlobalSearch';
import { useGlobalSearch, type GlobalSearchItem } from './useGlobalSearch';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const gs = useGlobalSearch();
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeDrop = () => {
    setDropOpen(false);
    inputRef.current?.blur();
  };

  const handlePick = (item: GlobalSearchItem) => {
    item.run();
    closeDrop();
  };

  return (
    <div className={styles.wrap}>
      <div
        className={styles.inputWrap}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropOpen(false);
        }}
      >
        <svg className={styles.icon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="5.5" />
          <path d="M11 11l3.5 3.5" />
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search anything..."
          value={query}
          onFocus={() => setDropOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              gs.move(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              gs.move(-1);
            } else if (e.key === 'Enter') {
              if (gs.selectActive()) closeDrop();
            } else if (e.key === 'Escape') {
              closeDrop();
            }
          }}
        />
        {query && (
          <button
            className={styles.clear}
            onClick={() => {
              setQuery('');
              closeDrop();
            }}
            aria-label="Clear search"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        )}
        {dropOpen && gs.debounced && (
          <GlobalSearchResults
            sections={gs.sections}
            flat={gs.flat}
            activeIndex={gs.activeIndex}
            query={gs.debounced}
            onHover={gs.setActiveIndex}
            onPick={handlePick}
          />
        )}
      </div>
    </div>
  );
}
