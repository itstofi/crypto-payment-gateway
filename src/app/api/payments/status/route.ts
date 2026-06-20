import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase/server'

// GET /api/payments/status?paymentId=<uuid>
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('paymentId')

  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
  }

  const { data: payment, error } = await serverSupabase
    .from('payments')
    .select('id, amount, currency, status, payment_provider, transaction_reference, created_at')
    .eq('id', paymentId)
    .single()

  if (error || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  return NextResponse.json(payment)
}

// PATCH /api/payments/status
// Used by the mock checkout page to simulate payment resolution.
// In a real integration this would be replaced by a signed Binance Pay webhook.
export async function PATCH(req: NextRequest) {
  try {
    const { paymentId, status } = await req.json()

    if (!paymentId || !['paid', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { data, error } = await serverSupabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId)
      .select('id, status')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
