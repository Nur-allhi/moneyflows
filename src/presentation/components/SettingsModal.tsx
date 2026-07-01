import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import styles from './Modal.module.css';

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
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Currency</label>
        <input
          className={styles.fieldInput}
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          placeholder="e.g. BDT, USD"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Locale</label>
        <input
          className={styles.fieldInput}
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          placeholder="e.g. en-IN, en-US, bn-BD"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Primary Member</label>
        <select
          className={styles.fieldInput}
          value={primaryMemberId}
          onChange={(e) => setPrimaryMemberId(e.target.value)}
        >
          <option value="">-- Auto-detect --</option>
          {internalMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Description Max Length</label>
        <input
          className={styles.fieldInput}
          type="number"
          min={50}
          max={500}
          value={descriptionMaxLength}
          onChange={(e) => setDescriptionMaxLength(Number(e.target.value))}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Numpad Max Digits</label>
        <input
          className={styles.fieldInput}
          type="number"
          min={5}
          max={15}
          value={numpadMaxDigits}
          onChange={(e) => setNumpadMaxDigits(Number(e.target.value))}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Dashboard Transaction Limit</label>
        <input
          className={styles.fieldInput}
          type="number"
          min={5}
          max={50}
          value={dashboardTxLimit}
          onChange={(e) => setDashboardTxLimit(Number(e.target.value))}
        />
      </div>
    </Modal>
  );
}
