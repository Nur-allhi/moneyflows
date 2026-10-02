/**
 * Curated background bases, one set per mode.
 *
 * MUST stay in sync with the `[data-bg="<id>"]` blocks in
 * `src/presentation/styles/tokens.css` (same ids, same `--color-bg`).
 * Luminance stays in-lane (dark ≤14%, light ≥93%) so body text contrast
 * can't break. obsidian/paper are the defaults (no CSS block needed).
 * `swatch` is the dot color in the picker UI only.
 */
export interface BgOption {
  id: string;
  label: string;
  swatch: string;
}

export const BG_DARK: BgOption[] = [
  { id: 'obsidian', label: 'Obsidian', swatch: 'oklch(14% 0.015 260)' },
  { id: 'midnight', label: 'Midnight', swatch: 'oklch(12% 0.03 270)' },
  { id: 'forest', label: 'Forest', swatch: 'oklch(12.5% 0.03 165)' },
  { id: 'plum', label: 'Plum', swatch: 'oklch(13.5% 0.03 320)' },
];

export const BG_LIGHT: BgOption[] = [
  { id: 'paper', label: 'Paper', swatch: 'oklch(94% 0.01 260)' },
  { id: 'sky', label: 'Sky', swatch: 'oklch(93% 0.02 245)' },
  { id: 'sand', label: 'Sand', swatch: 'oklch(94% 0.025 95)' },
  { id: 'mint', label: 'Mint', swatch: 'oklch(93% 0.02 170)' },
];

export const DEFAULT_BG_DARK = 'obsidian';
export const DEFAULT_BG_LIGHT = 'paper';

export function isBgDarkId(value: unknown): value is string {
  return typeof value === 'string' && BG_DARK.some((b) => b.id === value);
}

export function isBgLightId(value: unknown): value is string {
  return typeof value === 'string' && BG_LIGHT.some((b) => b.id === value);
}
