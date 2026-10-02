/**
 * App-wide text size for the Settings appearance picker.
 *
 * MUST stay in sync with the `:root[data-font="<id>"]` blocks in
 * `src/presentation/styles/tokens.css` (same ids). `medium` is the
 * default and has no CSS block (base token values). Applied via
 * `useTheme()` + the index.html pre-paint script.
 */
export interface FontSizeOption {
  id: string;
  label: string;
}

export const FONT_SIZES: FontSizeOption[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

export const DEFAULT_FONT_SIZE_ID = 'medium';

export function isFontSizeId(value: unknown): value is string {
  return typeof value === 'string' && FONT_SIZES.some((f) => f.id === value);
}
