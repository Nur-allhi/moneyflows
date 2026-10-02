import { useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_ACCENT_ID, isAccentId } from '../constants/accents';
import { DEFAULT_FONT_SIZE_ID, isFontSizeId } from '../constants/fontSizes';
import {
  BG_DARK,
  BG_LIGHT,
  DEFAULT_BG_DARK,
  DEFAULT_BG_LIGHT,
  isBgDarkId,
  isBgLightId,
} from '../constants/backgrounds';

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

function bgSwatch(mode: 'light' | 'dark', bg: string): string {
  const list = mode === 'light' ? BG_LIGHT : BG_DARK;
  return (
    list.find((b) => b.id === bg)?.swatch ??
    (mode === 'light' ? 'oklch(94% 0.01 260)' : 'oklch(14% 0.015 260)')
  );
}

/**
 * Applies the appearance settings to `<html>`:
 * `data-theme="light|dark"` + `data-accent="<id>"` + `data-bg="<id>"` +
 * `data-font="small|medium|large"` + `color-scheme`. `data-bg` always holds
 * the CURRENT mode's id, so dark/light `[data-bg]` blocks never collide.
 * Call once in AppLayout. Pre-paint defaults come from index.html.
 */
export function useTheme(): void {
  const accentId = useSettingsStore((s) => s.settings.accentId ?? DEFAULT_ACCENT_ID);
  const fontSize = useSettingsStore((s) => s.settings.fontSize ?? DEFAULT_FONT_SIZE_ID);
  const bgDark = useSettingsStore((s) => s.settings.bgDark ?? DEFAULT_BG_DARK);
  const bgLight = useSettingsStore((s) => s.settings.bgLight ?? DEFAULT_BG_LIGHT);
  const effective = useEffectiveTheme();

  useEffect(() => {
    const root = document.documentElement;
    const accent = isAccentId(accentId) ? accentId : DEFAULT_ACCENT_ID;
    const bg =
      effective === 'light'
        ? isBgLightId(bgLight)
          ? bgLight
          : DEFAULT_BG_LIGHT
        : isBgDarkId(bgDark)
          ? bgDark
          : DEFAULT_BG_DARK;
    root.dataset.theme = effective;
    root.dataset.accent = accent;
    root.dataset.bg = bg;
    root.dataset.font = isFontSizeId(fontSize) ? fontSize : DEFAULT_FONT_SIZE_ID;
    root.style.colorScheme = effective;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', bgSwatch(effective, bg));
  }, [effective, accentId, bgDark, bgLight, fontSize]);
}
