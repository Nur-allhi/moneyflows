import { MemberPicker } from './MemberPicker';
import type { Cx } from './cx';

interface MoneyRegionFieldsProps {
  cx: Cx;
  currency: string;
  onCurrency: (v: string) => void;
  locale: string;
  onLocale: (v: string) => void;
  primaryMemberId: string;
  onPrimaryMemberId: (v: string) => void;
}

/** Currency / locale / primary-member fields — controlled, host owns the draft. */
export function MoneyRegionFields({
  cx,
  currency,
  onCurrency,
  locale,
  onLocale,
  primaryMemberId,
  onPrimaryMemberId,
}: MoneyRegionFieldsProps) {
  return (
    <>
      <div className={cx.fieldGroup}>
        <label className={cx.fieldLabel}>Currency</label>
        <input
          className={cx.inputField}
          value={currency}
          onChange={(e) => onCurrency(e.target.value.toUpperCase())}
          placeholder="e.g. BDT, USD"
        />
      </div>
      <div className={cx.fieldGroup}>
        <label className={cx.fieldLabel}>Locale</label>
        <input
          className={cx.inputField}
          value={locale}
          onChange={(e) => onLocale(e.target.value)}
          placeholder="e.g. en-IN, en-US, bn-BD"
        />
        <span className={cx.hint}>Formats numbers & dates — bn-BD renders Bengali digits.</span>
      </div>
      <div className={cx.fieldGroup}>
        <label className={cx.fieldLabel}>Primary Member</label>
        <MemberPicker value={primaryMemberId} onChange={onPrimaryMemberId} />
        <span className={cx.hint}>New transactions belong to this member.</span>
      </div>
    </>
  );
}
