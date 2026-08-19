import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { repository, createPaymentOrder } = vi.hoisted(() => ({
  repository: {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    updateReference: vi.fn(),
    updateStatus: vi.fn(),
  },
  createPaymentOrder: vi.fn(),
}))

vi.mock('@/lib/payments/repository', () => ({
  getPaymentRepository: () => repository,
}))
vi.mock('@/lib/payments/cryptoPayment', () => ({ createPaymentOrder }))

import { POST } from './route'

const originalEnv = { ...process.env }
let clientSequence = 0

beforeEach(() => {
  process.env.DEMO_MODE = 'true'
  process.env.TRUST_PROXY = 'true'
  clientSequence += 1
  repository.create.mockResolvedValue({ id: `payment-${clientSequence}` })
  repository.updateReference.mockResolvedValue(undefined)
  repository.updateStatus.mockResolvedValue(null)
  createPaymentOrder.mockResolvedValue({
    checkoutUrl: '/mock-checkout?prepayId=MOCK-ORDER',
    prepayId: 'MOCK-ORDER',
  })
})

afterEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv }
})

function request(body: unknown, client = `203.0.113.${clientSequence}`) {
  return new NextRequest('http://localhost/api/payments/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': client },
    body: JSON.stringify(body),
  })
}

describe('POST /api/payments/create', () => {
  it('creates a demo payment and does not expose the provider prepay ID', async () => {
    const response = await POST(request({ amount: 25, currency: 'USDT' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(body).toEqual({
      checkoutUrl: '/mock-checkout?prepayId=MOCK-ORDER',
      paymentId: `payment-${clientSequence}`,
    })
  })

  it.each([true, false, null, '10', 'NaN', Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -1, 0.001, 0.009])(
    'rejects invalid, non-numeric, or sub-cent amount %s',
    async (amount) => {
      const response = await POST(request({ amount, currency: 'USDT' }))
      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: 'Invalid amount' })
      expect(repository.create).not.toHaveBeenCalled()
    },
  )

  it('rejects amounts over the maximum', async () => {
    const response = await POST(request({ amount: 100000.01, currency: 'USDT' }))
    expect(response.status).toBe(400)
  })

  it('rejects unsupported currencies', async () => {
    const response = await POST(request({ amount: 10, currency: 'NOT_A_CURRENCY' }))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Unsupported currency' })
  })

  it('fails closed at request time when DEMO_MODE is unset', async () => {
    delete process.env.DEMO_MODE
    const response = await POST(request({ amount: 10, currency: 'USDT' }))
    expect(response.status).toBe(500)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('marks an inserted payment failed when provider creation fails', async () => {
    createPaymentOrder.mockRejectedValueOnce(new Error('provider unavailable'))
    const response = await POST(request({ amount: 10, currency: 'USDT' }))

    expect(response.status).toBe(500)
    expect(repository.updateStatus).toHaveBeenCalledWith(`payment-${clientSequence}`, 'failed')
  })

  it('marks an inserted payment failed when reference persistence fails', async () => {
    repository.updateReference.mockRejectedValueOnce(new Error('write failed'))
    const response = await POST(request({ amount: 10, currency: 'USDT' }))

    expect(response.status).toBe(500)
    expect(repository.updateStatus).toHaveBeenCalledWith(`payment-${clientSequence}`, 'failed')
  })

  it('still returns the original failure when best-effort failed-state persistence also fails', async () => {
    createPaymentOrder.mockRejectedValueOnce(new Error('provider unavailable'))
    repository.updateStatus.mockRejectedValueOnce(new Error('status write failed'))

    const response = await POST(request({ amount: 10, currency: 'USDT' }))
    expect(response.status).toBe(500)
  })
})
