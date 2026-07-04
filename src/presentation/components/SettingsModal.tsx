import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import {
  DESCRIPTION_MAX_LENGTH_MIN,
  DESCRIPTION_MAX_LENGTH_MAX,
  NUMPAD_MAX_DIGITS_MIN,
  NUMPAD_MAX_DIGITS_MAX,
  DASHBOARD_TX_LIMIT_MIN,
  DASHBOARD_TX_LIMIT_MAX,
} from '../constants/config';
import fieldStyles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettingsStore();
  const { members, fetchMembers } = useMemberStore();

  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [primaryMemberId, setPrimaryMemberId] = useState(settings.primaryMemberId ?? '');
  const [descriptionMaxLength, setDescriptionMaxLength] = useState(settings.descriptionMaxLength);
  const [numpadMaxDigits, setNumpadMaxDigits] = useState(settings.numpadMaxDigits);
  const [dashboardTxLimit, setDashboardTxLimit] = useState(settings.dashboardTxLimit);

  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen, fetchMembers]);

  useEffect(() => {
    setCurrency(settings.currency);
    setLocale(settings.locale);
    setPrimaryMemberId(settings.primaryMemberId ?? '');
    setDescriptionMaxLength(settings.descriptionMaxLength);
    setNumpadMaxDigits(settings.numpadMaxDigits);
    setDashboardTxLimit(settings.dashboardTxLimit);
  }, [settings, isOpen]);

  const handleSave = () => {
    updateSettings({
      currency,
      locale,
      primaryMemberId: primaryMemberId || null,
      descriptionMaxLength,
      numpadMaxDigits,
      dashboardTxLimit,
    });
    onClose();
  };

  const internalMembers = members.filter((m) => !m.isExternal);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" onSave={handleSave}>
      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Currency</label>
        <input
          className={fieldStyles.inputField}
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          placeholder="e.g. BDT, USD"
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Locale</label>
        <input
          className={fieldStyles.inputField}
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          placeholder="e.g. en-IN, en-US, bn-BD"
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Primary Member</label>
        <select
          className={fieldStyles.selectField}
          value={primaryMemberId}
          onChange={(e) => setPrimaryMemberId(e.target.value)}
        >
          <option value="">-- Auto-detect --</option>
          {internalMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Description Max Length</label>
        <input
          className={fieldStyles.inputField}
          type="number"
          min={DESCRIPTION_MAX_LENGTH_MIN}
          max={DESCRIPTION_MAX_LENGTH_MAX}
          value={descriptionMaxLength}
          onChange={(e) => setDescriptionMaxLength(Number(e.target.value))}
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Numpad Max Digits</label>
        <input
          className={fieldStyles.inputField}
          type="number"
          min={NUMPAD_MAX_DIGITS_MIN}
          max={NUMPAD_MAX_DIGITS_MAX}
          value={numpadMaxDigits}
          onChange={(e) => setNumpadMaxDigits(Number(e.target.value))}
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <label className={fieldStyles.fieldLabel}>Dashboard Transaction Limit</label>
        <input
          className={fieldStyles.inputField}
          type="number"
          min={DASHBOARD_TX_LIMIT_MIN}
          max={DASHBOARD_TX_LIMIT_MAX}
          value={dashboardTxLimit}
          onChange={(e) => setDashboardTxLimit(Number(e.target.value))}
        />
      </div>

      <div className={fieldStyles.separator} />

      <div className={fieldStyles.actionsRow}>
        <button className={fieldStyles.actionBtn} onClick={() => getDatabase().exportToFile()}>
          ↓ Export Database
        </button>
        <button className={fieldStyles.actionBtn} onClick={() => getDatabase().importFromFile()}>
          ↑ Import Database
        </button>
      </div>
    </Modal>
  );
}
