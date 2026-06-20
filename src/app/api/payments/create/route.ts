import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { serverSupabase } from '@/lib/supabase/server'
import { createPaymentOrder } from '@/lib/payments/cryptoPayment'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'USDT' } = await req.json()

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (Number(amount) > 100000) {
      return NextResponse.json({ error: 'Amount exceeds maximum limit' }, { status: 400 })
    }

    const parsedAmount = parseFloat(Number(amount).toFixed(2))
    const referenceId = crypto.randomBytes(12).toString('hex').toUpperCase()

    // Insert the DB record before calling the payment provider.
    // This way we always have a record to reference if the provider call fails.
    const { data: payment, error: insertError } = await serverSupabase
      .from('payments')
      .insert({
        amount: parsedAmount,
        currency,
        status: 'pending',
        payment_provider: 'binance_pay',
        transaction_reference: referenceId,
      })
      .select()
      .single()

    if (insertError || !payment) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
    }

    const order = await createPaymentOrder({ amount: parsedAmount, currency, referenceId })

    // Replace the temp referenceId with the actual prepayId from Binance
    await serverSupabase
      .from('payments')
      .update({ transaction_reference: order.prepayId })
      .eq('id', payment.id)

    return NextResponse.json({
      paymentId: payment.id,
      checkoutUrl: order.checkoutUrl,
      prepayId: order.prepayId,
    })
  } catch (err) {
    console.error('Payment creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
