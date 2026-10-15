import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { isFsaSupported } from '../../infrastructure/database/FolderSync';
import { AppearanceSection } from './AppearanceSection';
import { APP_VERSION } from '../constants/appVersion';
import fieldStyles from './SettingsModal.module.css';
import { SettingsDisclosure } from './settings/SettingsDisclosure';
import {
  useBackupState,
  MoneyRegionFields,
  LimitsFields,
  RestorePoints,
  FolderBackup,
  EngineHealth,
  ImportExportRow,
  AboutApp,
} from './settings/sections';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettingsStore();
  const { fetchMembers } = useMemberStore();

  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [primaryMemberId, setPrimaryMemberId] = useState(settings.primaryMemberId ?? '');
  const [descriptionMaxLength, setDescriptionMaxLength] = useState(settings.descriptionMaxLength);
  const [numpadMaxDigits, setNumpadMaxDigits] = useState(settings.numpadMaxDigits);
  const [dashboardTxLimit, setDashboardTxLimit] = useState(settings.dashboardTxLimit);

  const backup = useBackupState();
  const refreshBackup = backup.refresh;
  const clearBackupError = backup.setRestoreError;

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

  useEffect(() => {
    if (isOpen) {
      void refreshBackup();
      clearBackupError(null);
    }
  }, [isOpen, refreshBackup, clearBackupError]);

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

  const cx = fieldStyles;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" onSave={handleSave} className={fieldStyles.modalWrap}>
      <SettingsDisclosure title="Money & Region" subtitle="Currency, locale, primary member" defaultOpen badge={currency || undefined}>
        <MoneyRegionFields
          cx={cx}
          currency={currency}
          onCurrency={setCurrency}
          locale={locale}
          onLocale={setLocale}
          primaryMemberId={primaryMemberId}
          onPrimaryMemberId={setPrimaryMemberId}
        />
      </SettingsDisclosure>

      <SettingsDisclosure title="Appearance" subtitle="Theme, accent, background, text size" defaultOpen>
        <AppearanceSection />
      </SettingsDisclosure>

      <SettingsDisclosure title="Limits" subtitle="Description, numpad, dashboard count">
        <LimitsFields
          cx={cx}
          descriptionMaxLength={descriptionMaxLength}
          onDescriptionMaxLength={setDescriptionMaxLength}
          numpadMaxDigits={numpadMaxDigits}
          onNumpadMaxDigits={setNumpadMaxDigits}
          dashboardTxLimit={dashboardTxLimit}
          onDashboardTxLimit={setDashboardTxLimit}
        />
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Restore Points"
        subtitle={backup.snapshots.length === 0 ? 'No snapshots yet' : `Latest: ${backup.formatSnapshotTime(backup.snapshots[0]!.time)}`}
        badge={backup.snapshots.length > 0 ? `${backup.snapshots.length}` : undefined}
        defaultOpen
      >
        <RestorePoints
          cx={cx}
          snapshots={backup.snapshots}
          restoring={backup.restoring}
          restoreError={backup.restoreError}
          onRestore={backup.handleRestore}
          formatTime={backup.formatSnapshotTime}
        />
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Cloud Backup"
        subtitle={!isFsaSupported ? 'Chrome/Edge only' : backup.folderName ? `Backing up to ${backup.folderName}` : 'Not connected'}
        badge={backup.backupFiles.length > 0 ? `${backup.backupFiles.length}` : undefined}
      >
        <FolderBackup
          cx={cx}
          folderName={backup.folderName}
          fsPermission={backup.fsPermission}
          backupFiles={backup.backupFiles}
          restoringFile={backup.restoringFile}
          onPickFolder={backup.handlePickFolder}
          onReauthorize={backup.handleReauthorize}
          onStopBackup={backup.handleStopBackup}
          onRestoreFile={backup.handleRestoreFile}
        />
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Storage"
        subtitle={backup.storageHealth ? (backup.storageHealth.backend === 'opfs' ? 'OPFS fast local file' : 'Browser storage') : 'Engine status'}
        defaultOpen
      >
        <EngineHealth cx={cx} storageHealth={backup.storageHealth} />
        <ImportExportRow
          cx={cx}
          onExport={backup.handleExportDb}
          onImport={() => getDatabase().importFromFile()}
        />
      </SettingsDisclosure>

      <SettingsDisclosure title="App" subtitle={`MoneyFlows v${APP_VERSION}`} defaultOpen>
        <AboutApp cx={cx} />
      </SettingsDisclosure>
    </Modal>
  );
}
