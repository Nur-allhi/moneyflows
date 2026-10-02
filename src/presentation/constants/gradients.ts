/**
 * Shared gradient helpers — single source for avatar/ledger gradients.
 * Previously copy-pasted in OtherLedgersIndex, LoanCard, LoansScreen, SetupWizard.
 */
export function ledgerGradient(name: string): string {
  const hues = [290, 170, 30, 85, 220, 330, 50, 190];
  let idx = 0;
  for (let i = 0; i < name.length; i++) idx = (idx * 31 + name.charCodeAt(i)) % hues.length;
  const h = hues[idx]!;
  return `linear-gradient(135deg, oklch(62% 0.22 ${h}), oklch(50% 0.2 ${h}))`;
}

export function seedGradient(name: string): string {
  return ledgerGradient(name);
}
