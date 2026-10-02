import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_ACCENT_ID, isAccentId } from '../constants/accents';

function resolveSystem(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Effective light/dark mode after resolving 'system' via the OS scheme. Live-updates. */
export function useEffectiveTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.settings.theme ?? 'dark');
  const [effective, setEffective] = useState<'light' | 'dark'>(() =>
    theme === 'light' || theme === 'dark' ? theme : resolveSystem(),
  );

  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      setEffective(theme);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    setEffective(mq.matches ? 'light' : 'dark');
    const onChange = (e: MediaQueryListEvent) => setEffective(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return effective;
}

/**
 * Applies the appearance settings to `<html>`:
 * `data-theme="light|dark"` + `data-accent="<id>"` + `color-scheme`.
 * Call once in AppLayout. Pre-paint defaults come from index.html.
 */
export function useTheme(): void {
  const accentId = useSettingsStore((s) => s.settings.accentId ?? DEFAULT_ACCENT_ID);
  const effective = useEffectiveTheme();

  useEffect(() => {
    const root = document.documentElement;
    const accent = isAccentId(accentId) ? accentId : DEFAULT_ACCENT_ID;
    root.dataset.theme = effective;
    root.dataset.accent = accent;
    root.style.colorScheme = effective;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', effective === 'light' ? '#efedf4' : '#0d0d0d');
  }, [effective, accentId]);
}
