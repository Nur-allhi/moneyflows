export function formatAmount(n: number, locale: string, currency: string): string {
  return `${Intl.NumberFormat(locale).format(n)} ${currency}`;
}

export function formatAmountParts(n: number, locale: string, currency: string): { amount: string; currency: string } {
  return { amount: Intl.NumberFormat(locale).format(n), currency };
}
