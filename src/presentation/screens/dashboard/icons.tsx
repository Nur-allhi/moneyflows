export function ArrowUp() {
  return <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6.5v-5M1.5 4L4 1.5 6.5 4" /></svg>;
}
export function ArrowDown() {
  return <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 1.5v5M1.5 4L4 6.5 6.5 4" /></svg>;
}
export function BankIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 14h14M2 10l6-8 6 8M4 10v3M8 10v3M12 10v3" /></svg>; }
export function WalletIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="12" height="8" rx="1.5" /><path d="M2 7h12M10 8.5h3" /></svg>; }
export function CashIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="12" height="7" rx="1" /><circle cx="8" cy="8.5" r="2" /><path d="M2 8h2M12 8h2" /></svg>; }
export function SavingsIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l6 4-6 4-6-4zM2 6v4l6 4 6-4V6" /></svg>; }
export function BusinessIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="10" height="10" rx="1" /><path d="M3 7h10M7 7v6M10 10h3" /></svg>; }
export function PersonIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="2.5" /><path d="M3 13a5 5 0 0 1 10 0" /></svg>; }
export const TYPE_ICON_MAP = {
  bank: <BankIcon />,
  mobile_wallet: <WalletIcon />,
  cash: <CashIcon />,
  savings: <SavingsIcon />,
  business: <BusinessIcon />,
  counterparty: <PersonIcon />,
} as const;
