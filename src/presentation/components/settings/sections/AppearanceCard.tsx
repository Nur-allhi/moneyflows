import { AppearanceSection } from '../../AppearanceSection';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { ACCENTS, DEFAULT_ACCENT_ID } from '../../../constants/accents';
import { SettingsDisclosure } from '../SettingsDisclosure';

/** Theme/accent/background/text-size card — applies instantly, no save step. */
export function AppearanceCard() {
  const theme = useSettingsStore((s) => s.settings.theme ?? 'dark');
  const accentId = useSettingsStore((s) => s.settings.accentId ?? DEFAULT_ACCENT_ID);
  const accentLabel = ACCENTS.find((a) => a.id === accentId)?.label ?? DEFAULT_ACCENT_ID;
  const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1);

  return (
    <SettingsDisclosure
      title="Appearance"
      subtitle="Theme, accent, background, text size"
      badge={`${themeLabel} · ${accentLabel}`}
      defaultOpen={false}
    >
      <AppearanceSection />
    </SettingsDisclosure>
  );
}
