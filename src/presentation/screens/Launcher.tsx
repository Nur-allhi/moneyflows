import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import styles from './Launcher.module.css';

const cards = [
  {
    icon: '\u{1F4CA}',
    title: 'Main Dashboard',
    desc: 'Family overview with total assets, cash, loans, combined balances, and recent transactions',
    badge: 'Desktop \u2022 16:9',
    badgeClass: styles.badgeDesktop,
    to: '/',
  },
  {
    icon: '\u{1F464}',
    title: 'Member Profile',
    desc: "Efty's profile with account cards carousel (bKash, Brac Bank, Business Cash) and account ledger",
    badge: 'Mobile \u2022 9:16',
    badgeClass: styles.badgeMobile,
    to: '/member/1',
  },
  {
    icon: '\u{1F4B3}',
    title: 'Loan Receivables',
    desc: "BTC's loan stacks by funding source with progress bar, amounts, and repayment status",
    badge: 'Desktop \u2022 16:9',
    badgeClass: styles.badgeDesktop,
    to: '/loans',
  },
  {
    icon: '\u{1F4B8}',
    title: 'Transaction Wizard',
    desc: 'Bottom-sheet modal with segmented tabs, account pickers, and numeric keypad for transfers',
    badge: 'Mobile overlay \u2022 9:16',
    badgeClass: styles.badgeOverlay,
    to: '',
  },
  {
    icon: '\uD83D\uDDD1\uFE0F',
    title: 'Recycle Bin',
    desc: 'Soft-deleted items with restore and permanent delete, tabbed by type',
    badge: 'Desktop \u2022 16:9',
    badgeClass: styles.badgeDesktop,
    to: '/recycle',
  },
  {
    icon: '\u{1F3E0}',
    title: 'brand-spec.md',
    desc: 'Design tokens and glassmorphism system reference for MoneyFlows',
    badge: 'Token spec',
    badgeClass: styles.badgeDesktop,
    to: '',
  },
];

export function Launcher() {
  const currency = useSettingsStore((s) => s.settings.currency);
  return (
    <div className={styles.launcher}>
      <div className={styles.hero}>
        <div className={styles.logo}>
          MoneyFlows<span className={styles.logoSuffix}>.app</span>
        </div>
        <p className={styles.subtitle}>Family personal finance — dark glassmorphism, {currency}</p>
      </div>

      <div className={styles.grid}>
        {cards.map((card) => (
          card.to ? (
            <Link key={card.title} to={card.to} className={styles.card}>
              <div className={styles.cardIcon}>{card.icon}</div>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardDesc}>{card.desc}</div>
              <span className={`${styles.badge} ${card.badgeClass}`}>{card.badge}</span>
            </Link>
          ) : (
            <div key={card.title} className={`${styles.card} ${styles.cardDisabled}`}>
              <div className={styles.cardIcon}>{card.icon}</div>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardDesc}>{card.desc}</div>
              <span className={`${styles.badge} ${card.badgeClass}`}>{card.badge}</span>
            </div>
          )
        ))}
      </div>

      <div className={styles.footer}>
        MoneyFlows &middot; Family Finance &middot; {currency} &middot; Dark Glassmorphism
      </div>
    </div>
  );
}
