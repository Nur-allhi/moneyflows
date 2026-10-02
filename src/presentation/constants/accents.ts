/**
 * Curated accent palette for the Settings appearance picker.
 *
 * MUST stay in sync with the `:root[data-accent="<id>"]` blocks in
 * `src/presentation/styles/tokens.css` (same ids, same `--color-primary`).
 * `swatch` is the dot color in the picker UI only.
 */
export interface AccentOption {
  id: string;
  label: string;
  swatch: string;
}

export const ACCENTS: AccentOption[] = [
  { id: 'violet', label: 'Violet', swatch: 'oklch(62% 0.22 290)' },
  { id: 'blue', label: 'Blue', swatch: 'oklch(60% 0.18 250)' },
  { id: 'teal', label: 'Teal', swatch: 'oklch(65% 0.15 180)' },
  { id: 'gold', label: 'Gold', swatch: 'oklch(70% 0.15 85)' },
  { id: 'coral', label: 'Coral', swatch: 'oklch(62% 0.18 30)' },
  { id: 'pink', label: 'Pink', swatch: 'oklch(65% 0.2 350)' },
];

export const DEFAULT_ACCENT_ID = 'violet';

export function isAccentId(value: unknown): value is string {
  return typeof value === 'string' && ACCENTS.some((a) => a.id === value);
}
