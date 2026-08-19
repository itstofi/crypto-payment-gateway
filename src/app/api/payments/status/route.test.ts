import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { repository } = vi.hoisted(() => ({
  repository: {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    updateReference: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

vi.mock('@/lib/payments/repository', () => ({ getPaymentRepository: () => repository }))

import { GET, PATCH } from './route'

const originalEnv = { ...process.env }
let clientSequence = 40

beforeEach(() => {
  process.env.DEMO_MODE = 'true'
  process.env.TRUST_PROXY = 'true'
  clientSequence += 1
  repository.findById.mockResolvedValue({
    id: 'payment-1',
    amount: 25,
    currency: 'USDT',
    status: 'pending',
    payment_provider: 'demo',
    transaction_reference: 'SECRET-PREPAY-ID',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  })
  repository.updateStatus.mockResolvedValue({ id: 'payment-1', status: 'paid' })
})

afterEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv }
})

function getRequest(paymentId = 'payment-1', client = `203.0.113.${clientSequence}`) {
  return new NextRequest(`http://localhost/api/payments/status?paymentId=${paymentId}`, {
    headers: { 'x-forwarded-for': client },
  })
}

function patchRequest() {
  return new NextRequest('http://localhost/api/payments/status', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `203.0.113.${clientSequence}`,
    },
    body: JSON.stringify({ paymentId: 'payment-1', status: 'paid' }),
  })
}

describe('GET /api/payments/status', () => {
  it('returns a minimal customer DTO with a demo provider label and no internal reference', async () => {
    const response = await GET(getRequest())

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      id: 'payment-1',
      amount: 25,
      currency: 'USDT',
      status: 'pending',
      provider: 'demo',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('normalizes the production provider label without exposing internals', async () => {
    repository.findById.mockResolvedValueOnce({
      id: 'payment-2', amount: 10, currency: 'USDT', status: 'paid',
      payment_provider: 'binance_pay', transaction_reference: 'PREPAY',
      created_at: '2026-01-02T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z',
    })
    const response = await GET(getRequest('payment-2'))
    expect((await response.json()).provider).toBe('binance_pay')
  })

  it('sets no-store on not-found responses', async () => {
    repository.findById.mockResolvedValueOnce(null)
    const response = await GET(getRequest('missing'))
    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})

describe('PATCH /api/payments/status', () => {
  it('rejects mock status mutation outside demo mode with no-store', async () => {
    process.env.DEMO_MODE = 'false'
    const response = await PATCH(patchRequest())
    expect(response.status).toBe(403)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('fails closed when DEMO_MODE is malformed', async () => {
    process.env.DEMO_MODE = 'yes'
    const response = await PATCH(patchRequest())
    expect(response.status).toBe(500)
    expect(repository.updateStatus).not.toHaveBeenCalled()
  })
})
