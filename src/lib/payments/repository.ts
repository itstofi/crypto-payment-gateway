import type { Payment, PaymentStatus } from '@/types/payment'
import { InMemoryPaymentRepository } from './inMemoryRepository'
import { SupabasePaymentRepository } from './supabaseRepository'
import { isDemoMode } from '@/lib/config'

export interface CreatePaymentInput {
  amount: number
  currency: string
  payment_provider: string
  transaction_reference: string
}

export interface PaymentRepository {
  create(input: CreatePaymentInput): Promise<Payment>
  findById(id: string): Promise<Payment | null>
  list(status?: PaymentStatus): Promise<Payment[]>
  updateReference(id: string, reference: string): Promise<void>
  updateStatus(id: string, status: PaymentStatus): Promise<Payment | null>
}

const demoRepository = new InMemoryPaymentRepository()

export function getPaymentRepository(): PaymentRepository {
  return isDemoMode()
    ? demoRepository
    : new SupabasePaymentRepository()
}
