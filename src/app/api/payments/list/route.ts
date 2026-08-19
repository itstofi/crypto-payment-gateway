import { NextRequest, NextResponse } from 'next/server'
import { getPaymentRepository } from '@/lib/payments/repository'
import { hasAdminAccess } from '@/lib/security/adminAuth'
import { consumeRateLimit } from '@/lib/security/rateLimit'
import type { PaymentStatus } from '@/types/payment'

const VALID_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed']
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...headers },
  })
}

export async function GET(req: NextRequest) {
  try {
    const rateLimit = consumeRateLimit(req, 'payment-admin-list', 10)
    if (!rateLimit.allowed) {
      return json(
        { error: 'Too many requests' },
        429,
        { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      )
    }

    if (!hasAdminAccess(req)) return json({ error: 'Unauthorized' }, 401)

    const statusParam = req.nextUrl.searchParams.get('status') as PaymentStatus | null
    const status = statusParam && VALID_STATUSES.includes(statusParam) ? statusParam : undefined
    const payments = await getPaymentRepository().list(status)
    return json(payments)
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return json({ error: 'Failed to fetch payments' }, 500)
  }
}
