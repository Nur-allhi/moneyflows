import { useSettingsStore } from '../../../stores/useSettingsStore';
import { SettingsDisclosure } from '../SettingsDisclosure';
import type { Cx } from './cx';

interface ToggleDef {
  label: string;
  on: boolean;
  onToggle: () => void;
}

/** Dashboard visibility + calculation card — all instant-apply switches. */
export function DashboardCard({ cx }: { cx: Cx }) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const sections: ToggleDef[] = [
    { label: 'Where Your Money is', on: settings.showWhereMoneyIs ?? true, onToggle: () => updateSettings({ showWhereMoneyIs: !(settings.showWhereMoneyIs ?? true) }) },
    { label: 'Recent Transactions', on: settings.showRecentTransactions ?? true, onToggle: () => updateSettings({ showRecentTransactions: !(settings.showRecentTransactions ?? true) }) },
    { label: 'Active Loans', on: settings.showActiveLoans ?? true, onToggle: () => updateSettings({ showActiveLoans: !(settings.showActiveLoans ?? true) }) },
    { label: 'Metric Cards', on: settings.showMetricCards ?? true, onToggle: () => updateSettings({ showMetricCards: !(settings.showMetricCards ?? true) }) },
    { label: 'Month Summary', on: settings.showMonthSummary ?? true, onToggle: () => updateSettings({ showMonthSummary: !(settings.showMonthSummary ?? true) }) },
    { label: 'Quick Actions', on: settings.showQuickActions ?? true, onToggle: () => updateSettings({ showQuickActions: !(settings.showQuickActions ?? true) }) },
  ];
  const onCount = sections.filter((t) => t.on).length;

  const renderToggle = (t: ToggleDef) => (
    <label key={t.label} className={cx.toggleRow}>
      <span>{t.label}</span>
      <button
        role="switch"
        aria-checked={t.on}
        className={`${cx.switch} ${t.on ? cx.switchOn : ''}`}
        onClick={t.onToggle}
      >
        <span className={cx.knob} />
      </button>
    </label>
  );

  return (
    <SettingsDisclosure
      title="Dashboard"
      subtitle="Show or hide sections"
      badge={`${onCount} of ${sections.length} on`}
      defaultOpen={false}
    >
      <div className={cx.sectionTitle}>Sections</div>
      {sections.map(renderToggle)}
      <div className={cx.sectionTitle}>Calculation</div>
      {renderToggle({
        label: 'Total Assets includes Active Loans',
        on: settings.totalAssetsIncludeLoans ?? false,
        onToggle: () => updateSettings({ totalAssetsIncludeLoans: !(settings.totalAssetsIncludeLoans ?? false) }),
      })}
    </SettingsDisclosure>
  );
}
