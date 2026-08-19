import type { Payment, PaymentStatus } from '@/types/payment'
import { createServerSupabase } from '@/lib/supabase/server'
import type { CreatePaymentInput, PaymentRepository } from './repository'

export class SupabasePaymentRepository implements PaymentRepository {
  private get client() {
    return createServerSupabase()
  }

  async create(input: CreatePaymentInput): Promise<Payment> {
    const { data, error } = await this.client
      .from('payments')
      .insert({ ...input, status: 'pending' })
      .select()
      .single()
    if (error || !data) throw new Error('Failed to create payment record')
    return normalizePayment(data as Payment)
  }

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error('Failed to fetch payment')
    return data ? normalizePayment(data as Payment) : null
  }

  async list(status?: PaymentStatus): Promise<Payment[]> {
    let query = this.client.from('payments').select('*').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw new Error('Failed to fetch payments')
    return (data ?? []).map((payment) => normalizePayment(payment as Payment))
  }

  async updateReference(id: string, reference: string): Promise<void> {
    const { error } = await this.client
      .from('payments')
      .update({ transaction_reference: reference })
      .eq('id', id)
    if (error) throw new Error('Failed to update payment reference')
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment | null> {
    const { data, error } = await this.client
      .from('payments')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw new Error('Failed to update payment')
    return data ? normalizePayment(data as Payment) : null
  }
}

function normalizePayment(payment: Payment): Payment {
  return { ...payment, amount: Number(payment.amount) }
}
