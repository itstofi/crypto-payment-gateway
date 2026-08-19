import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createPaymentOrder } from '@/lib/payments/cryptoPayment'
import { getPaymentRepository, type PaymentRepository } from '@/lib/payments/repository'
import { consumeRateLimit } from '@/lib/security/rateLimit'
import { isDemoMode } from '@/lib/config'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  })
}

function isValidAmount(amount: unknown): amount is number {
  return typeof amount === 'number'
    && Number.isFinite(amount)
    && amount >= 0.01
    && Number(amount.toFixed(2)) === amount
}

export async function POST(req: NextRequest) {
  let repository: PaymentRepository | undefined
  let insertedPaymentId: string | undefined

  try {
    const rateLimit = consumeRateLimit(req, 'payment-create', 20)
    if (!rateLimit.allowed) {
      return json(
        { error: 'Too many requests' },
        429,
        { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      )
    }

    const demoMode = isDemoMode()
    const { amount, currency = 'USDT' } = await req.json()

    if (!isValidAmount(amount)) {
      return json({ error: 'Invalid amount' }, 400)
    }

    if (amount > 100000) {
      return json({ error: 'Amount exceeds maximum limit' }, 400)
    }

    if (currency !== 'USDT') {
      return json({ error: 'Unsupported currency' }, 400)
    }

    const referenceId = crypto.randomBytes(12).toString('hex').toUpperCase()
    repository = getPaymentRepository()
    const payment = await repository.create({
      amount,
      currency,
      payment_provider: demoMode ? 'demo' : 'binance_pay',
      transaction_reference: referenceId,
    })
    insertedPaymentId = payment.id

    const order = await createPaymentOrder({ amount, currency, referenceId })
    await repository.updateReference(payment.id, order.prepayId)

    return json({
      paymentId: payment.id,
      checkoutUrl: order.checkoutUrl,
    })
  } catch (error) {
    if (repository && insertedPaymentId) {
      try {
        await repository.updateStatus(insertedPaymentId, 'failed')
      } catch (cleanupError) {
        console.error('Failed to mark incomplete payment as failed:', cleanupError)
      }
    }
    console.error('Payment creation error:', error)
    return json({ error: 'Internal server error' }, 500)
  }
}
