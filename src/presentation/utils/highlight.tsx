import styles from './highlight.module.css';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Highlights all case-insensitive occurrences of `query` inside `text`
 * by wrapping them in <mark>. Regex is escaped so "." does not wildcard.
 * No dangerouslySetInnerHTML — pure React nodes, XSS-safe.
 */
export function Highlight({ text, query, className = '' }: HighlightProps) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const esc = escapeRegExp(q);
  if (!esc) return <>{text}</>;
  let parts: string[];
  try {
    parts = text.split(new RegExp(`(${esc})`, 'gi'));
  } catch {
    return <>{text}</>;
  }
  const lower = q.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lower ? (
          <mark key={i} className={`${styles.mark} ${className}`.trim()}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
