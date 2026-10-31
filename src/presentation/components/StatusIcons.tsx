import { AlertTriangle } from 'lucide-react';

/**
 * M-03: shared status glyphs used by empty/error states and header pills.
 * lucide-react is the app-wide icon system (same stroke style as BottomNav);
 * these wrapper components pin the `size`/`strokeWidth` variants each context
 * needs so JSX usage sites stay terse.
 */

/** Error-state bar icon (fits `.error-state-icon`, ~32px render box). */
export function AlertIcon() {
  return <AlertTriangle size={32} strokeWidth={1.8} aria-hidden="true" />;
}

/** Trash glyph for icon-only delete buttons (sized by its CSS class). */
const trashSvg = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
  </svg>
);
export function TrashIcon() {
  return trashSvg;
}

/** Notification bell for the header pip. */
const bellSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
export function BellIcon() {
  return bellSvg;
}
