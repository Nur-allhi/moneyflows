import { useSettingsStore } from '../stores/useSettingsStore';

export function useFormatNumber() {
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const format = (n: number) => Intl.NumberFormat(locale).format(n);
  return { format, locale, currency };
}
