import { SettingsModal } from '../components/SettingsModal';

interface SettingsModalWrapperProps {
  onClose: () => void;
}

export function SettingsModalWrapper({ onClose }: SettingsModalWrapperProps) {
  return <SettingsModal isOpen={true} onClose={onClose} />;
}
