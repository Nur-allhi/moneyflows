import { useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_ACCENT_ID, isAccentId } from '../constants/accents';

/**
 * Applies the appearance settings to `<html>`:
 * `data-theme="light|dark"` + `data-accent="<id>"` + `color-scheme`.
 * `theme: 'system'` follows the OS scheme live via matchMedia.
 * Call once in AppLayout. Pre-paint defaults come from index.html.
 */
export function useTheme(): void {
  const theme = useSettingsStore((s) => s.settings.theme ?? 'dark');
  const accentId = useSettingsStore((s) => s.settings.accentId ?? DEFAULT_ACCENT_ID);

  useEffect(() => {
    const root = document.documentElement;
    const accent = isAccentId(accentId) ? accentId : DEFAULT_ACCENT_ID;
    const meta = document.querySelector('meta[name="theme-color"]');

    const apply = (mode: 'light' | 'dark') => {
      root.dataset.theme = mode;
      root.dataset.accent = accent;
      root.style.colorScheme = mode;
      meta?.setAttribute('content', mode === 'light' ? '#efedf4' : '#0d0d0d');
    };

    if (theme === 'light' || theme === 'dark') {
      apply(theme);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    apply(mq.matches ? 'light' : 'dark');
    const onChange = (e: MediaQueryListEvent) => apply(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme, accentId]);
}
