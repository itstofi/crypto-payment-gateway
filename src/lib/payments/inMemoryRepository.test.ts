import { describe, expect, it } from 'vitest'
import type { Payment } from '@/types/payment'
import { InMemoryPaymentRepository } from './inMemoryRepository'

function input(reference: string) {
  return {
    amount: 10,
    currency: 'USDT',
    payment_provider: 'demo',
    transaction_reference: reference,
  }
}

describe('InMemoryPaymentRepository', () => {
  it('bounds demo records and evicts the oldest record', async () => {
    const repository = new InMemoryPaymentRepository(2, new Map<string, Payment>())
    const first = await repository.create(input('first'))
    await repository.create(input('second'))
    await repository.create(input('third'))

    expect(repository.entryCount).toBe(2)
    await expect(repository.findById(first.id)).resolves.toBeNull()
    await expect(repository.list()).resolves.toHaveLength(2)
  })
})
