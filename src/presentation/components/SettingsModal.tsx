import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import fieldStyles from './SettingsModal.module.css';
import {
  PreferencesCard,
  AppearanceCard,
  DashboardCard,
  BackupCard,
  AboutCard,
} from './settings/sections';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Thin mirror of SettingsPage — same five collapsed cards, Done footer. */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const navigate = useNavigate();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);

  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen, fetchMembers]);

  const handleReplayWizard = () => {
    updateSettings({ setupComplete: false });
    onClose();
    navigate('/setup');
  };

  const cx = fieldStyles;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      className={fieldStyles.modalWrap}
      footer={
        <div className={fieldStyles.actionsRow}>
          <button className={fieldStyles.actionBtn} onClick={onClose}>Done</button>
        </div>
      }
    >
      <PreferencesCard cx={cx} />
      <AppearanceCard />
      <DashboardCard cx={cx} />
      <BackupCard cx={cx} />
      <AboutCard cx={cx} onReplayWizard={handleReplayWizard} />
    </Modal>
  );
}
