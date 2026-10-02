/** User-facing "What's New" notes, newest first. Plain, simple English. */

export interface WhatsNewEntry {
  version: string;
  items: string[];
}

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '1.10.0',
    items: [
      'The loading screen now shows the app version at the bottom.',
    ],
  },
  {
    version: '1.9.0',
    items: [
      'Light mode is here — tap the sun/moon button in the header, or pick System, Light or Dark in Settings → Appearance.',
      'Make it yours: 6 accent colors and 8 backgrounds (4 dark, 4 light) in Settings → Appearance.',
      'Fresh new look for text — clearer headings and easier-to-read amounts, now working fully offline.',
    ],
  },
  {
    version: '1.8.0',
    items: [
      'New Report button on member profiles — full member report with a summary cover plus one table per account.',
      'Includes loan ledgers grouped by person and owned Other Ledgers, with period presets and an account picker.',
      'Export the report to PDF, CSV or Print — balances stay correct even when filtered.',
    ],
  },
  {
    version: '1.7.0',
    items: [
      'The top search bar now searches everything — transactions, accounts, members, loans, groups, tags and other ledgers — from any page.',
      'Start typing to see grouped results, then tap one to jump straight to it.',
      'Each ledger still has its own search that looks only inside that ledger.',
    ],
  },
  {
    version: '1.6.0',
    items: [
      'Loan ledgers now break down what you owe per lender — tap Owed to to see each bank or person separately.',
      'Repaying? Choose which lender you are paying off, and separately pick where the money goes.',
      'Loan headers show the account’s available balance, and the pencil button renames the ledger.',
    ],
  },
  {
    version: '1.5.0',
    items: [
      'New setup wizard for first-time users — 5 friendly steps to add your family, your accounts, and see how Dashboard, Ledger, Loans, Groups, Other Ledgers and Tags work.',
      'You can start empty or load a sample family to explore — and replay the tour anytime from Settings → About.',
      'Other Ledgers now has proper delete — ledgers and entries use the same confirmation modal as the rest of the app and go to Recycle Bin.',
      'Ledger groups now look cleaner with better spacing and a thin line separating each owner’s section.',
    ],
  },
  {
    version: '1.4.0',
    items: [
      'New Other Ledgers section — create your own ledgers by name, starting date, and owner (family member or other person).',
      'Each ledger shows Date, Description, Debit, Credit and running Balance — add rows from the global + picker or the per-ledger + button, search, and export to PDF.',
      'Ledgers are grouped by owner so you can see at a glance who owns what and the total per owner.',
      'Ledger pages now match your account ledger — same header with search, PDF and filters, and the same mobile view.',
      'Loan page now uses the same avatar colors and is grouped into Internal and External sections you can sort Alphabetically, by Last transaction, or Last repayment.',
    ],
  },
  {
    version: '1.3.0',
    items: [
      'Settings is now a full page with sub-navigation — General, Dashboard, Activity, Backup, Storage and About.',
      'Dashboard sections can be shown or hidden from Settings → Dashboard — hidden panels free space for the rest.',
      'New Activity log in Settings shows your last actions, 10 per page.',
      'New Logs backdoor in Settings → About — Detailed logs toggle, Export and Clear, paginated 10 per page.',
      'Dashboard now shows only its two main actions — New Transaction and Quick Loan — header gear goes to Settings.',
    ],
  },
  {
    version: '1.2.0',
    items: [
      'Search got smarter: the dashboard now finds across all your transactions — description, amount, account and tags — and highlights what you typed.',
      'Each ledger (member, group, loan, tag) has its own search that stays inside that ledger, also highlighted.',
      'Opening animation and the sidebar now share one MoneyFlows logo — same gradient, single identity.',
      'Recent Transactions no longer shows two dates — mobile badge stays, desktop shows one full date.',
      'Layout is more compact so every section gets more room on screen.',
    ],
  },
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
