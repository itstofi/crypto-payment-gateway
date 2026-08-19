import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPaymentOrder } from './cryptoPayment'

const originalEnv = { ...process.env }

beforeEach(() => {
  process.env.DEMO_MODE = 'false'
  process.env.BINANCE_PAY_API_KEY = 'api-key'
  process.env.BINANCE_PAY_API_SECRET = 'api-secret'
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const order = { amount: 10, currency: 'USDT', referenceId: 'REF-1' }

function binanceResponse(data: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(data),
  }))
}

describe('createPaymentOrder mode boundary', () => {
  it('uses only the local relative mock checkout in explicit demo mode', async () => {
    process.env.DEMO_MODE = 'true'
    delete process.env.BINANCE_PAY_API_KEY
    delete process.env.BINANCE_PAY_API_SECRET

    await expect(createPaymentOrder(order)).resolves.toMatchObject({
      checkoutUrl: expect.stringMatching(/^\/mock-checkout\?/),
      prepayId: expect.stringMatching(/^MOCK-/),
    })
  })

  it('fails closed when DEMO_MODE is unset or malformed', async () => {
    delete process.env.DEMO_MODE
    await expect(createPaymentOrder(order)).rejects.toThrow('DEMO_MODE must be explicitly set')
    process.env.DEMO_MODE = 'yes'
    await expect(createPaymentOrder(order)).rejects.toThrow('DEMO_MODE must be explicitly set')
  })

  it('requires Binance credentials in explicit production mode', async () => {
    delete process.env.BINANCE_PAY_API_KEY
    delete process.env.BINANCE_PAY_API_SECRET
    await expect(createPaymentOrder(order)).rejects.toThrow('Binance Pay credentials are required')
  })
})

describe('Binance response validation', () => {
  it('accepts a non-empty prepay ID and expected HTTPS Binance checkout origin', async () => {
    binanceResponse({
      status: 'SUCCESS', code: '000000',
      data: { prepayId: '12345', checkoutUrl: 'https://pay.binance.com/en/checkout/12345' },
    })
    await expect(createPaymentOrder(order)).resolves.toEqual({
      prepayId: '12345', checkoutUrl: 'https://pay.binance.com/en/checkout/12345',
    })
  })

  it.each([
    [{ checkoutUrl: 'https://pay.binance.com/en/checkout/12345' }, 'missing prepayId'],
    [{ prepayId: '12345' }, 'missing checkoutUrl'],
    [{ prepayId: '', checkoutUrl: 'https://pay.binance.com/en/checkout/12345' }, 'empty prepayId'],
    [{ prepayId: '12345', checkoutUrl: 'javascript:alert(1)' }, 'script URL'],
    [{ prepayId: '12345', checkoutUrl: 'http://pay.binance.com/checkout/12345' }, 'non-HTTPS URL'],
    [{ prepayId: '12345', checkoutUrl: 'https://pay.binance.com.evil.example/checkout' }, 'lookalike host'],
    [{ prepayId: '12345', checkoutUrl: '/mock-checkout?prepayId=12345' }, 'relative production URL'],
  ])('rejects malformed Binance data: %s (%s)', async (data: Record<string, string | undefined>, label: string) => {
    expect(label).toEqual(expect.any(String))
    binanceResponse({ status: 'SUCCESS', code: '000000', data })
    await expect(createPaymentOrder(order)).rejects.toThrow('invalid response')
  })

  it('rejects unsuccessful HTTP responses even if the body claims success', async () => {
    binanceResponse({
      status: 'SUCCESS', code: '000000',
      data: { prepayId: '12345', checkoutUrl: 'https://pay.binance.com/checkout/12345' },
    }, false)
    await expect(createPaymentOrder(order)).rejects.toThrow('Binance Pay order creation failed')
  })

  it('aborts a Binance request after the fetch timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))

    const expectation = expect(createPaymentOrder(order)).rejects.toThrow('Binance Pay request timed out')
    await vi.advanceTimersByTimeAsync(10_000)
    await expectation
  })
})
