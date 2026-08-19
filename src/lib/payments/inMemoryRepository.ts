import crypto from 'crypto'
import type { Payment, PaymentStatus } from '@/types/payment'
import type { CreatePaymentInput, PaymentRepository } from './repository'

const globalPaymentStore = globalThis as typeof globalThis & {
  __cryptoGatewayDemoPayments?: Map<string, Payment>
}
const demoPayments = globalPaymentStore.__cryptoGatewayDemoPayments ??= new Map<string, Payment>()

export class InMemoryPaymentRepository implements PaymentRepository {
  constructor(
    private readonly maxEntries = 1_000,
    private readonly payments: Map<string, Payment> = demoPayments,
  ) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) {
      throw new Error('Demo repository maxEntries must be a positive integer')
    }
  }

  get entryCount(): number {
    return this.payments.size
  }

  async create(input: CreatePaymentInput): Promise<Payment> {
    while (this.payments.size >= this.maxEntries) {
      const oldestId = this.payments.keys().next().value as string | undefined
      if (oldestId === undefined) break
      this.payments.delete(oldestId)
    }

    const timestamp = new Date().toISOString()
    const payment: Payment = {
      id: crypto.randomUUID(),
      ...input,
      status: 'pending',
      created_at: timestamp,
      updated_at: timestamp,
    }
    this.payments.set(payment.id, payment)
    return { ...payment }
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = this.payments.get(id)
    return payment ? { ...payment } : null
  }

  async list(status?: PaymentStatus): Promise<Payment[]> {
    return [...this.payments.values()]
      .filter((payment) => !status || payment.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((payment) => ({ ...payment }))
  }

  async updateReference(id: string, reference: string): Promise<void> {
    const payment = this.payments.get(id)
    if (payment) {
      this.payments.set(id, {
        ...payment,
        transaction_reference: reference,
        updated_at: new Date().toISOString(),
      })
    }
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment | null> {
    const payment = this.payments.get(id)
    if (!payment) return null
    const updated = { ...payment, status, updated_at: new Date().toISOString() }
    this.payments.set(id, updated)
    return { ...updated }
  }
}
