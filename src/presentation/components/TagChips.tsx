import { Link } from 'react-router-dom';
import styles from './TagChips.module.css';

interface TagChipsProps {
  tags: string[];
  /** Detail modal closes itself before following a chip. */
  onNavigate?: () => void;
}

/** Clickable tag pills for a transaction (or Other Ledger entry). Rows stay
 *  clickable: the chip swallows the click so it never opens transaction details. */
export function TagChips({ tags, onNavigate }: TagChipsProps) {
  if (tags.length === 0) return null;
  return (
    <span className={styles.group}>
      {tags.map((tag) => (
        <Link
          key={tag}
          className={styles.chip}
          to={`/tags/${encodeURIComponent(tag)}`}
          title={`View tag ${tag}`}
          aria-label={`View tag ${tag}`}
          onClick={(event) => { event.stopPropagation(); onNavigate?.(); }}
        >
          {`#${tag}`}
        </Link>
      ))}
    </span>
  );
}
