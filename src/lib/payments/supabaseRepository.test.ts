import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerSupabase, chain } = vi.hoisted(() => {
  const query = {
    from: vi.fn(), insert: vi.fn(), select: vi.fn(), single: vi.fn(),
  }
  query.from.mockReturnValue(query)
  query.insert.mockReturnValue(query)
  query.select.mockReturnValue(query)
  return { createServerSupabase: vi.fn(() => query), chain: query }
})

vi.mock('@/lib/supabase/server', () => ({ createServerSupabase }))

import { SupabasePaymentRepository } from './supabaseRepository'

describe('SupabasePaymentRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates and normalizes a payment through the server Supabase client', async () => {
    chain.from.mockReturnValue(chain)
    chain.insert.mockReturnValue(chain)
    chain.select.mockReturnValue(chain)
    chain.single.mockResolvedValue({
      data: {
        id: 'payment-1', amount: '12.34', currency: 'USDT', status: 'pending',
        payment_provider: 'binance_pay', transaction_reference: 'REF-1',
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    const payment = await new SupabasePaymentRepository().create({
      amount: 12.34,
      currency: 'USDT',
      payment_provider: 'binance_pay',
      transaction_reference: 'REF-1',
    })

    expect(createServerSupabase).toHaveBeenCalledOnce()
    expect(chain.from).toHaveBeenCalledWith('payments')
    expect(payment.amount).toBe(12.34)
  })
})
