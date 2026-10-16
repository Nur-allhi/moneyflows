import { Link } from 'react-router-dom';
import styles from './LegalDoc.module.css';

/** Contact for privacy/verification questions. TODO(user): replace with a real monitored inbox before Google verification. */
export const SUPPORT_EMAIL = 'support@example.com';

const LAST_UPDATED = '16 October 2026';

interface Section {
  heading: string;
  body: string[];
}

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: 'Overview',
    body: [
      'MoneyFlows is a personal finance tracker that works offline first. This policy explains what data the app touches, where it lives, and what never leaves your device.',
    ],
  },
  {
    heading: 'Data stays on your device',
    body: [
      'Everything you enter — members, accounts, transactions, loans, ledgers and tags — is stored locally in your browser (private file storage with a browser-storage fallback). Nothing is sent anywhere unless you turn on Google Drive sync.',
    ],
  },
  {
    heading: 'Optional Google Drive backup',
    body: [
      'If you sign in with Google, the app uploads a single database file into your own hidden Drive app folder, and downloads it on your other devices. It uses the minimum permissions for this: drive.appdata (its own folder only — it cannot see or touch any other Drive files), plus basic profile info (name, email, photo) to show your account.',
      'The sign-in token lives only in your browser, is refreshed silently while you use the app, and is revoked when you disconnect. You can stop syncing anytime from Settings; disconnecting keeps all local data intact.',
    ],
  },
  {
    heading: 'What is never collected',
    body: [
      'No analytics, no advertising identifiers, no tracking, no crash reporting to third parties. Fonts are bundled with the app — nothing is fetched from font servers. The only network calls the app makes are to Google APIs when Drive sync is signed in.',
    ],
  },
  {
    heading: 'Your control and deletion',
    body: [
      'Deleted items sit in the Recycle Bin for 30 days before permanent purge. You can export your database from Settings at any time, restore from automatic restore points, or wipe everything with Start Fresh. Removing Drive access in your Google account stops future syncs; previously uploaded files can be deleted from Drive.',
    ],
  },
  {
    heading: 'Security limits',
    body: [
      'Local data is protected by your device lock — anyone with your unlocked device can open the app. There are no passwords or server accounts; treat device access as app access.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'MoneyFlows is a general family finance tool and is not directed at children under 13. It collects no data from anyone by itself.',
    ],
  },
  {
    heading: 'Changes and contact',
    body: [
      'This policy may change as the app evolves; material changes will be noted in the app. Questions:',
      `Contact: ${SUPPORT_EMAIL}`,
    ],
  },
];

const TERMS_SECTIONS: Section[] = [
  {
    heading: 'The service',
    body: [
      'MoneyFlows is a free personal finance tracker for recording family transactions, loans, ledgers and related data. It runs in your browser and works offline.',
    ],
  },
  {
    heading: 'Your data, your responsibility',
    body: [
      'You own the data you enter. Keep your own backups (Settings can export the database). You are responsible for the accuracy of what you record and for keeping your device and Google account secure.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: [
      'Use the app only for lawful personal purposes. Do not attempt to disrupt the app, misrepresent synced data to others, or use another person’s account or credentials.',
    ],
  },
  {
    heading: 'Availability and warranty',
    body: [
      'The app is provided as-is, without warranties of any kind. Sync depends on your connection and third-party services (Google Drive) that may change or go down. Automatic restore points and exports exist precisely so a failure never means total loss — use them.',
    ],
  },
  {
    heading: 'Limitation of liability',
    body: [
      'To the maximum extent permitted by law, the developer is not liable for any loss of data, money decisions made using the app, or indirect damages. Your use of the app is at your own risk.',
    ],
  },
  {
    heading: 'Ending use',
    body: [
      'Stop using the app anytime: disconnect Google sync, delete synced files from Drive, and wipe local data with Start Fresh. No account deletion flow is needed because there are no server accounts.',
    ],
  },
  {
    heading: 'Changes and contact',
    body: [
      'These terms may change; continued use after changes means acceptance. Questions:',
      `Contact: ${SUPPORT_EMAIL}`,
    ],
  },
];

/** Standalone legal page (no app shell, reachable pre-setup for reviewers). */
export function LegalDoc({ kind }: { kind: 'privacy' | 'terms' }) {
  const isPrivacy = kind === 'privacy';
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link to="/" className={styles.back}>
          ← MoneyFlows
        </Link>
        <div className={styles.panel}>
          <h1 className={styles.title}>{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
          <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>
          {sections.map((s) => (
            <section key={s.heading} className={styles.section}>
              <h2 className={styles.h2}>{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className={styles.p}>{p}</p>
              ))}
            </section>
          ))}
          <div className={styles.switchRow}>
            <Link to={isPrivacy ? '/terms' : '/privacy'} className={styles.switchLink}>
              {isPrivacy ? 'Terms of Service →' : '← Privacy Policy'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
