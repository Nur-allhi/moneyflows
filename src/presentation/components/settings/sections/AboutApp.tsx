import { useState, useEffect } from 'react';
import { WhatsNewModal } from '../../WhatsNewModal';
import { whatsNewFor } from '../../../constants/whatsNew';
import { APP_VERSION } from '../../../constants/appVersion';
import disclosureStyles from '../SettingsDisclosure.module.css';
import type { Cx } from './cx';

interface AboutAppProps {
  cx: Cx;
  /** Page passes a replay-wizard handler; the modal omits it (no replay entry). */
  onReplayWizard?: () => void;
}

/** Install prompt + whats-new + version. Owns its listeners and modal state. */
export function AboutApp({ cx, onReplayWizard }: AboutAppProps) {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  useEffect(() => {
    const p = (window as unknown as Record<string, unknown>).__installPrompt;
    if (p instanceof Event) setInstallPrompt(p);
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  return (
    <>
      {installPrompt && (
        <div className={cx.statusRow}>
          <span className={cx.statusDot} />
          <span className={cx.statusText}>Install MoneyFlows on your device</span>
          <button className={cx.restoreBtn} onClick={async () => {
            (installPrompt as unknown as { prompt: () => Promise<void> }).prompt();
            const result = await (installPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
            if (result.outcome === 'accepted') setInstallPrompt(null);
          }}>Install</button>
        </div>
      )}
      <div className={cx.statusRow}>
        <span className={cx.statusDot} />
        <span className={cx.statusText}>See what&apos;s new in v{APP_VERSION}</span>
        <button className={cx.restoreBtn} onClick={() => setWhatsNewOpen(true)}>View</button>
      </div>
      <div className={cx.versionLine}>MoneyFlows v{APP_VERSION}</div>
      {onReplayWizard && (
        <button className={disclosureStyles.showAllBtn} onClick={onReplayWizard}>Replay setup wizard</button>
      )}
      <WhatsNewModal
        isOpen={whatsNewOpen}
        version={APP_VERSION}
        items={whatsNewFor(APP_VERSION)?.items ?? []}
        onClose={() => setWhatsNewOpen(false)}
      />
    </>
  );
}
