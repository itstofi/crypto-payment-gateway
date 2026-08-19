import { describe, expect, it } from 'vitest'
import { createMockOrder } from './mockGateway'

describe('createMockOrder', () => {
  it('encodes mock checkout query values instead of allowing query injection', () => {
    const order = createMockOrder({ amount: 10, currency: 'USDT&next=https://evil.example' })
    const url = new URL(order.checkoutUrl, 'http://local.invalid')

    expect(url.pathname).toBe('/mock-checkout')
    expect(url.searchParams.get('currency')).toBe('USDT&next=https://evil.example')
    expect(url.searchParams.has('next')).toBe(false)
  })
})
