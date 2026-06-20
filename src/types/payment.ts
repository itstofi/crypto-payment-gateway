export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface Payment {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  payment_provider: string
  transaction_reference: string | null
  created_at: string
  updated_at: string
}

export interface PaymentStats {
  total: number
  pending: number
  paid: number
  failed: number
  totalAmount: number
}
