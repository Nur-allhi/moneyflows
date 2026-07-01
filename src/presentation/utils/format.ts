export function formatAmount(n: number, locale: string, currency: string): string {
  return `${Intl.NumberFormat(locale).format(n)} ${currency}`;
}
