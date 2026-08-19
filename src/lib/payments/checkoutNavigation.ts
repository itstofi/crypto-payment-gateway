const BINANCE_CHECKOUT_ORIGINS = new Set([
  'https://pay.binance.com',
  'https://www.binance.com',
])

type Push = (href: string) => void
type OpenedWindow = { opener: Window | null }
type OpenExternal = (url: string, target: string, features: string) => OpenedWindow | null

export function navigateToTrustedCheckout(
  checkoutUrl: string,
  paymentId: string,
  push: Push,
  openExternal: OpenExternal,
): void {
  if (checkoutUrl.startsWith('/')) {
    const url = new URL(checkoutUrl, 'http://local.invalid')
    if (url.origin !== 'http://local.invalid' || url.pathname !== '/mock-checkout') {
      throw new Error('Untrusted checkout URL')
    }
    url.searchParams.set('paymentId', paymentId)
    push(`${url.pathname}${url.search}${url.hash}`)
    return
  }

  let url: URL
  try {
    url = new URL(checkoutUrl)
  } catch {
    throw new Error('Untrusted checkout URL')
  }
  if (url.protocol !== 'https:' || !BINANCE_CHECKOUT_ORIGINS.has(url.origin)) {
    throw new Error('Untrusted checkout URL')
  }

  const openedWindow = openExternal(url.toString(), '_blank', 'noopener,noreferrer')
  if (openedWindow) openedWindow.opener = null
  push(`/payment/${encodeURIComponent(paymentId)}`)
}
