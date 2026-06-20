export function formatCurrency(amount: number, currency = 'USDT'): string {
  return `${amount.toFixed(2)} ${currency}`
}
