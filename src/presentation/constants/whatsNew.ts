/** User-facing "What's New" notes, newest first. Plain, simple English. */

export interface WhatsNewEntry {
  version: string;
  items: string[];
}

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '1.1.0',
    items: [
      'You can now edit any account — rename it or change its type from the pencil button on the account card.',
      'You can also delete accounts. Deleted accounts go to the Recycle Bin and can be restored for 30 days.',
      'Old transactions of a deleted account stay safe in every ledger, marked as a deleted account.',
      'Fixed: new account balance now shows up right away after saving.',
    ],
  },
  {
    version: '1.0.0',
    items: [
      'Your data now lives in a safer place inside your browser — saving is faster and more reliable.',
      'Backups got smarter: restore points clean themselves up when storage gets tight.',
      'If the app ever has trouble starting, you will see clear buttons to restore or start fresh.',
      'Times now show in a friendly AM/PM format.',
      'You can see the app version and these update notes anytime from Settings.',
    ],
  },
];

/** Notes to show for the given app version; falls back to the latest entry. */
export function whatsNewFor(currentVersion: string): WhatsNewEntry | null {
  return WHATS_NEW.find((e) => e.version === currentVersion) ?? WHATS_NEW[0] ?? null;
}
