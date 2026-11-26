import { useEffect, useState } from 'react';
import { ANIMATION_DURATION, FOCUS_HIGHLIGHT_MS } from '../constants/config';

/**
 * T-177: when `focusTxId` arrives from "Open in Ledger", find the rendered row
 * (the ledger may need another render to expand its page), scroll the page down
 * to it and flash it briefly. The URL hand-off is consumed only after the row
 * is settled, so a second click on the same transaction starts a fresh reveal.
 */
export function useLedgerFocus(focusTxId: string | null, onConsumed: () => void): string | null {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusTxId) return;
    setHighlightedId(focusTxId);
    let frame = 0;
    let tries = 0;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;

    const findRow = () => Array.from(document.querySelectorAll<HTMLElement>('[data-tx-id]'))
      .find((el) => el.dataset.txId === focusTxId);

    // The desktop ledger animates its body height while the page grows. The
    // first scroll is clamped to the old height, so re-center once it settles.
    const scrollNow = () => {
      const row = findRow();
      if (!row) return;
      const main = document.getElementById('app-main');
      if (!main) {
        row.scrollIntoView({ block: 'center', inline: 'nearest' });
        return;
      }
      const mainRect = main.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      main.scrollTop = main.scrollTop + rowRect.top - mainRect.top - (mainRect.height - rowRect.height) / 2;
    };

    const reveal = () => {
      if (!findRow()) {
        if (tries++ < 30) frame = requestAnimationFrame(reveal);
        return;
      }
      scrollNow();
      doneTimer = setTimeout(() => {
        scrollNow();
        onConsumed();
      }, ANIMATION_DURATION);
    };

    frame = requestAnimationFrame(reveal);
    return () => {
      cancelAnimationFrame(frame);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [focusTxId, onConsumed]);

  // Separate from the scroll effect: consuming the URL param re-renders the
  // parent, and that must not cancel the highlight's own timer.
  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(null), FOCUS_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  return highlightedId;
}
