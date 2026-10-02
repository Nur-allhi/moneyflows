import type { CSSProperties } from 'react';
import { ACCENTS, DEFAULT_ACCENT_ID } from '../constants/accents';
import type { ThemeMode } from '../../core/domain/AppSettings';
import { useSettingsStore } from '../stores/useSettingsStore';
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
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const activeAccent = ACCENTS.some((a) => a.id === accentId) ? accentId : DEFAULT_ACCENT_ID;

  return (
    <div className={styles.appearance}>
      <div className={styles.row} role="group" aria-label="Theme">
        <span className={styles.rowLabel}>Theme</span>
        <div className={styles.segWrap}>
          {THEME_OPTIONS.map((o) => (
            <button
              key={o.id}
              className={`${styles.segBtn} ${theme === o.id ? styles.segActive : ''}`}
              aria-pressed={theme === o.id}
              onClick={() => updateSettings({ theme: o.id })}
            >
              {o.label}
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
              className={`${styles.swatch} ${activeAccent === a.id ? styles.swatchActive : ''}`}
              style={{ '--swatch-color': a.swatch } as CSSProperties}
              aria-pressed={activeAccent === a.id}
              aria-label={`${a.label} accent`}
              title={a.label}
              onClick={() => updateSettings({ accentId: a.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
