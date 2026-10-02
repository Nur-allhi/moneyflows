import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ACCENTS, DEFAULT_ACCENT_ID, isAccentId } from '../accents';
import { AppSettings } from '../../../core/domain/AppSettings';

const tokensCss = readFileSync(
  fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)),
  'utf8',
);

describe('accent palette', () => {
  it('ships 6 unique accent ids with violet as default', () => {
    const ids = ACCENTS.map((a) => a.id);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    expect(DEFAULT_ACCENT_ID).toBe('violet');
    expect(ids).toContain('violet');
  });

  it('validates accent ids', () => {
    expect(isAccentId('teal')).toBe(true);
    expect(isAccentId('nope')).toBe(false);
    expect(isAccentId(undefined)).toBe(false);
  });

  it('mirrors every accent id in tokens.css with a matching primary', () => {
    for (const a of ACCENTS) {
      expect(tokensCss).toContain(`:root[data-accent="${a.id}"]`);
      expect(tokensCss).toContain(`--color-primary: ${a.swatch}`);
    }
  });

  it('defines the light theme block and the gradient-tail token', () => {
    expect(tokensCss).toContain(':root[data-theme="light"]');
    expect(tokensCss).toContain('--color-primary-deep');
    expect(tokensCss).toContain('--color-wash');
  });
});

describe('AppSettings appearance defaults', () => {
  it('defaults to dark theme with violet accent (current look preserved)', () => {
    const s = new AppSettings();
    expect(s.theme).toBe('dark');
    expect(s.accentId).toBe('violet');
  });
});
