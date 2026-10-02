import type { CSSProperties } from 'react';
import { useState } from 'react';
import { ACCENTS, DEFAULT_ACCENT_ID } from '../constants/accents';
import { BG_DARK, BG_LIGHT, DEFAULT_BG_DARK, DEFAULT_BG_LIGHT } from '../constants/backgrounds';
import type { ThemeMode } from '../../core/domain/AppSettings';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useEffectiveTheme } from '../hooks/useTheme';
import { useReplay } from '../hooks/useReplay';
import styles from './AppearanceSection.module.css';

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/**
 * Theme (System/Light/Dark) + accent swatch picker.
 * Applies instantly via the settings store (no save step) — used by both
 * SettingsModal and SettingsPage so the user sees the result immediately.
 */
export function AppearanceSection() {
  const theme = useSettingsStore((s) => s.settings.theme ?? 'dark');
  const accentId = useSettingsStore((s) => s.settings.accentId ?? DEFAULT_ACCENT_ID);
  const bgDark = useSettingsStore((s) => s.settings.bgDark ?? DEFAULT_BG_DARK);
  const bgLight = useSettingsStore((s) => s.settings.bgLight ?? DEFAULT_BG_LIGHT);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const effective = useEffectiveTheme();
  const activeAccent = ACCENTS.some((a) => a.id === accentId) ? accentId : DEFAULT_ACCENT_ID;
  // Background presets follow the CURRENT mode — flipping theme swaps the row.
  const bgList = effective === 'light' ? BG_LIGHT : BG_DARK;
  const currentBg = effective === 'light' ? bgLight : bgDark;
  const activeBg = bgList.some((b) => b.id === currentBg)
    ? currentBg
    : (bgList[0]?.id ?? currentBg);
  const setBg = (id: string) =>
    updateSettings(effective === 'light' ? { bgLight: id } : { bgDark: id });
  const [themeKey, replayTheme] = useReplay();
  const [themePicked, setThemePicked] = useState<string | null>(null);
  const [accentKey, replayAccent] = useReplay();
  const [accentPicked, setAccentPicked] = useState<string | null>(null);
  const [bgKey, replayBg] = useReplay();
  const [bgPicked, setBgPicked] = useState<string | null>(null);

  return (
    <div className={styles.appearance}>
      <div className={styles.row} role="group" aria-label="Theme">
        <span className={styles.rowLabel}>Theme</span>
        <div className={styles.segWrap}>
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.id}
              className={`${styles.segBtn} ${theme === o.id ? styles.segActive : ''} ${themePicked === o.id && themeKey > 0 ? 'anim-pop' : ''}`}
              aria-pressed={theme === o.id}
              onClick={() => { replayTheme(); setThemePicked(o.id); updateSettings({ theme: o.id }); }}
            >
              <span className="anim-target" key={`${o.id}-${themePicked === o.id ? themeKey : 0}`}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.row} role="group" aria-label="Accent color">
        <span className={styles.rowLabel}>Accent</span>
        <div className={styles.swatchGrid}>
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              className={`${styles.swatch} ${activeAccent === a.id ? styles.swatchActive : ''} ${accentPicked === a.id && accentKey > 0 ? 'anim-pop' : ''}`}
              style={{ '--swatch-color': a.swatch } as CSSProperties}
              aria-pressed={activeAccent === a.id}
              aria-label={`${a.label} accent`}
              title={a.label}
              onClick={() => { replayAccent(); setAccentPicked(a.id); updateSettings({ accentId: a.id }); }}
            >
              <span className="anim-target" key={`${a.id}-${accentPicked === a.id ? accentKey : 0}`} />
            </button>
          ))}
        </div>
      </div>
      <div className={styles.row} role="group" aria-label={`Background for ${effective} mode`}>
        <span className={styles.rowLabel}>Background</span>
        <div className={styles.swatchGrid}>
          {bgList.map((b) => (
            <button
              key={b.id}
              className={`${styles.swatch} ${activeBg === b.id ? styles.swatchActive : ''} ${bgPicked === b.id && bgKey > 0 ? 'anim-pop' : ''}`}
              style={{ '--swatch-color': b.swatch } as CSSProperties}
              aria-pressed={activeBg === b.id}
              aria-label={`${b.label} background`}
              title={b.label}
              onClick={() => { replayBg(); setBgPicked(b.id); setBg(b.id); }}
            >
              <span className="anim-target" key={`${b.id}-${bgPicked === b.id ? bgKey : 0}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
