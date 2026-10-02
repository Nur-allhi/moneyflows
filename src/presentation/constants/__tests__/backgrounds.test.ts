import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  BG_DARK,
  BG_LIGHT,
  DEFAULT_BG_DARK,
  DEFAULT_BG_LIGHT,
  isBgDarkId,
  isBgLightId,
} from '../backgrounds';
import { AppSettings } from '../../../core/domain/AppSettings';

const tokensCss = readFileSync(
  fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)),
  'utf8',
);

describe('background presets', () => {
  it('ships 4 unique ids per mode with obsidian/paper defaults', () => {
    expect(BG_DARK.map((b) => b.id)).toHaveLength(4);
    expect(new Set(BG_DARK.map((b) => b.id)).size).toBe(4);
    expect(BG_LIGHT.map((b) => b.id)).toHaveLength(4);
    expect(new Set(BG_LIGHT.map((b) => b.id)).size).toBe(4);
    expect(DEFAULT_BG_DARK).toBe('obsidian');
    expect(DEFAULT_BG_LIGHT).toBe('paper');
  });

  it('validates background ids per mode', () => {
    expect(isBgDarkId('forest')).toBe(true);
    expect(isBgDarkId('sky')).toBe(false);
    expect(isBgLightId('sand')).toBe(true);
    expect(isBgLightId('plum')).toBe(false);
  });

  it('mirrors every non-default id in tokens.css with a matching bg', () => {
    for (const b of [...BG_DARK, ...BG_LIGHT]) {
      if (b.id === DEFAULT_BG_DARK || b.id === DEFAULT_BG_LIGHT) continue;
      const modeScope = BG_DARK.some((d) => d.id === b.id)
        ? `:root[data-bg="${b.id}"]`
        : `:root[data-theme="light"][data-bg="${b.id}"]`;
      expect(tokensCss).toContain(modeScope);
      expect(tokensCss).toContain(`--color-bg: ${b.swatch}`);
    }
  });

  it('defaults AppSettings backgrounds (current look preserved)', () => {
    const s = new AppSettings();
    expect(s.bgDark).toBe('obsidian');
    expect(s.bgLight).toBe('paper');
  });
});
