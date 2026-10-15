import {
  DESCRIPTION_MAX_LENGTH_MIN,
  DESCRIPTION_MAX_LENGTH_MAX,
  NUMPAD_MAX_DIGITS_MIN,
  NUMPAD_MAX_DIGITS_MAX,
  DASHBOARD_TX_LIMIT_MIN,
  DASHBOARD_TX_LIMIT_MAX,
} from '../../../constants/config';
import type { Cx } from './cx';

interface LimitsFieldsProps {
  cx: Cx;
  descriptionMaxLength: number;
  onDescriptionMaxLength: (v: number) => void;
  numpadMaxDigits: number;
  onNumpadMaxDigits: (v: number) => void;
  dashboardTxLimit: number;
  onDashboardTxLimit: (v: number) => void;
}

/** Description / numpad / dashboard-count limit fields — controlled. */
export function LimitsFields({
  cx,
  descriptionMaxLength,
  onDescriptionMaxLength,
  numpadMaxDigits,
  onNumpadMaxDigits,
  dashboardTxLimit,
  onDashboardTxLimit,
}: LimitsFieldsProps) {
  return (
    <>
      <div className={cx.fieldGroup}>
        <label className={cx.fieldLabel}>Description Max Length</label>
        <input
          className={cx.inputField}
          type="number"
          min={DESCRIPTION_MAX_LENGTH_MIN}
          max={DESCRIPTION_MAX_LENGTH_MAX}
          value={descriptionMaxLength}
          onChange={(e) => onDescriptionMaxLength(Number(e.target.value))}
        />
      </div>
      <div className={cx.fieldGroup}>
        <label className={cx.fieldLabel}>Numpad Max Digits</label>
        <input
          className={cx.inputField}
          type="number"
          min={NUMPAD_MAX_DIGITS_MIN}
          max={NUMPAD_MAX_DIGITS_MAX}
          value={numpadMaxDigits}
          onChange={(e) => onNumpadMaxDigits(Number(e.target.value))}
        />
      </div>
      <div className={cx.fieldGroup}>
        <label className={cx.fieldLabel}>Dashboard Transaction Limit</label>
        <input
          className={cx.inputField}
          type="number"
          min={DASHBOARD_TX_LIMIT_MIN}
          max={DASHBOARD_TX_LIMIT_MAX}
          value={dashboardTxLimit}
          onChange={(e) => onDashboardTxLimit(Number(e.target.value))}
        />
      </div>
    </>
  );
}
