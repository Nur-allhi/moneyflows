import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { SettingsDisclosure } from '../SettingsDisclosure';
import { MoneyRegionFields } from './MoneyRegionFields';
import { LimitsFields } from './LimitsFields';
import type { Cx } from './cx';

interface PreferencesCardProps {
  cx: Cx;
  /** Modal hosts persist via their footer — hide the inline save there (S-3). */
  saveMode?: 'inline' | 'none';
}

/** Currency/locale/primary-member + limits draft card with its own Save. */
export function PreferencesCard({ cx, saveMode = 'inline' }: PreferencesCardProps) {
  const { settings, updateSettings } = useSettingsStore();
  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [primaryMemberId, setPrimaryMemberId] = useState(settings.primaryMemberId ?? '');
  const [descriptionMaxLength, setDescriptionMaxLength] = useState(settings.descriptionMaxLength);
  const [numpadMaxDigits, setNumpadMaxDigits] = useState(settings.numpadMaxDigits);
  const [dashboardTxLimit, setDashboardTxLimit] = useState(settings.dashboardTxLimit);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCurrency(settings.currency);
    setLocale(settings.locale);
    setPrimaryMemberId(settings.primaryMemberId ?? '');
    setDescriptionMaxLength(settings.descriptionMaxLength);
    setNumpadMaxDigits(settings.numpadMaxDigits);
    setDashboardTxLimit(settings.dashboardTxLimit);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      currency,
      locale,
      primaryMemberId: primaryMemberId || null,
      descriptionMaxLength,
      numpadMaxDigits,
      dashboardTxLimit,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <SettingsDisclosure
      title="Preferences"
      subtitle="Currency, locale, primary member, limits"
      badge={currency || undefined}
      defaultOpen={false}
    >
      <MoneyRegionFields
        cx={cx}
        currency={currency}
        onCurrency={setCurrency}
        locale={locale}
        onLocale={setLocale}
        primaryMemberId={primaryMemberId}
        onPrimaryMemberId={setPrimaryMemberId}
      />
      <LimitsFields
        cx={cx}
        descriptionMaxLength={descriptionMaxLength}
        onDescriptionMaxLength={setDescriptionMaxLength}
        numpadMaxDigits={numpadMaxDigits}
        onNumpadMaxDigits={setNumpadMaxDigits}
        dashboardTxLimit={dashboardTxLimit}
        onDashboardTxLimit={setDashboardTxLimit}
      />
      {saveMode === 'inline' && (
        <button className={cx.saveBtn} onClick={handleSave}>{saved ? 'Saved ✓' : 'Save changes'}</button>
      )}
    </SettingsDisclosure>
  );
}
