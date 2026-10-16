import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import {
  PreferencesCard,
  AppearanceCard,
  DashboardCard,
  BackupCard,
  AboutCard,
} from '../components/settings/sections';
import styles from './SettingsPage.module.css';

/**
 * Settings — five collapsed category cards. Open a card to change it.
 * Deep link ?tab=backup (&open=google-drive-sync) expands Backup for the
 * header sync button; remount via key so the initial-open prop applies.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const open = searchParams.get('open');
  const backupRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    if (tab === 'backup') backupRef.current?.scrollIntoView({ block: 'start' });
  }, [tab, open]);

  const handleReplayWizard = () => {
    updateSettings({ setupComplete: false });
    navigate('/setup');
  };

  const cx = styles;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Settings</div>
        <div className={styles.subtitle}>Everything in one place — open a card to change it.</div>
      </div>
      <PreferencesCard cx={cx} />
      <AppearanceCard />
      <DashboardCard cx={cx} />
      <div ref={backupRef}>
        <BackupCard
          key={`backup-${tab}-${open}`}
          cx={cx}
          defaultOpen={tab === 'backup'}
          forceOpenSync={open === 'google-drive-sync'}
        />
      </div>
      <AboutCard cx={cx} onReplayWizard={handleReplayWizard} />
    </div>
  );
}
