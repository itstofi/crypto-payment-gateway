import { NextRequest, NextResponse } from 'next/server'
import { getPaymentRepository } from '@/lib/payments/repository'
import { consumeRateLimit } from '@/lib/security/rateLimit'
import type { PaymentStatus } from '@/types/payment'
import { isDemoMode } from '@/lib/config'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  })
}

export async function GET(req: NextRequest) {
  try {
    const rateLimit = consumeRateLimit(req, 'payment-status-read', 60)
    if (!rateLimit.allowed) {
      return json(
        { error: 'Too many requests' },
        429,
        { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      )
    }

    const paymentId = req.nextUrl.searchParams.get('paymentId')
    if (!paymentId) return json({ error: 'paymentId is required' }, 400)

    const payment = await getPaymentRepository().findById(paymentId)
    if (!payment) return json({ error: 'Payment not found' }, 404)

    return json({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.payment_provider === 'demo' ? 'demo' : 'binance_pay',
      createdAt: payment.created_at,
    })
  } catch (error) {
    console.error('Payment lookup error:', error)
    return json({ error: 'Failed to fetch payment' }, 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const rateLimit = consumeRateLimit(req, 'payment-status-update', 20)
    if (!rateLimit.allowed) {
      return json(
        { error: 'Too many requests' },
        429,
        { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      )
    }

    if (!isDemoMode()) {
      return json({ error: 'Mock status updates are disabled' }, 403)
    }

    const { paymentId, status } = await req.json() as {
      paymentId?: string
      status?: PaymentStatus
    }
    if (!paymentId || !status || !['paid', 'failed'].includes(status)) {
      return json({ error: 'Invalid request' }, 400)
    }

    const payment = await getPaymentRepository().updateStatus(paymentId, status)
    if (!payment) return json({ error: 'Payment not found' }, 404)
    return json({ id: payment.id, status: payment.status })
  } catch (error) {
    console.error('Payment update error:', error)
    return json({ error: 'Internal server error' }, 500)
  }
}
