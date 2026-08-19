import { describe, expect, it, vi } from 'vitest'
import { navigateToTrustedCheckout } from './checkoutNavigation'

describe('navigateToTrustedCheckout', () => {
  it('routes local mock checkout URLs without opening a window', () => {
    const push = vi.fn()
    const openExternal = vi.fn()

    navigateToTrustedCheckout('/mock-checkout?prepayId=MOCK-1', 'payment 1', push, openExternal)

    expect(push).toHaveBeenCalledWith('/mock-checkout?prepayId=MOCK-1&paymentId=payment+1')
    expect(openExternal).not.toHaveBeenCalled()
  })

  it('opens an expected Binance HTTPS URL with noopener and noreferrer', () => {
    const push = vi.fn()
    const windowHandle = { opener: {} as Window | null }
    const openExternal = vi.fn(() => windowHandle)

    navigateToTrustedCheckout('https://pay.binance.com/en/checkout/123', 'payment-1', push, openExternal)

    expect(openExternal).toHaveBeenCalledWith(
      'https://pay.binance.com/en/checkout/123',
      '_blank',
      'noopener,noreferrer',
    )
    expect(windowHandle.opener).toBeNull()
    expect(push).toHaveBeenCalledWith('/payment/payment-1')
  })

  it.each([
    'javascript:alert(1)',
    'http://pay.binance.com/checkout/123',
    'https://pay.binance.com.evil.example/checkout/123',
    '//evil.example/mock-checkout',
    '/admin',
  ])('rejects untrusted checkout URL %s', (checkoutUrl) => {
    const push = vi.fn()
    const openExternal = vi.fn()

    expect(() => navigateToTrustedCheckout(checkoutUrl, 'payment-1', push, openExternal))
      .toThrow('Untrusted checkout URL')
    expect(push).not.toHaveBeenCalled()
    expect(openExternal).not.toHaveBeenCalled()
  })
})
