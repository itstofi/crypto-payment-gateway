import { NextRequest, NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase/server'
import type { PaymentStatus } from '@/types/payment'

const VALID_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed']

// GET /api/payments/list?status=<pending|paid|failed>
// Returns all payments, ordered newest first. Used by the admin dashboard.
export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get('status') as PaymentStatus | null

  let query = serverSupabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusParam && VALID_STATUSES.includes(statusParam)) {
    query = query.eq('status', statusParam)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
