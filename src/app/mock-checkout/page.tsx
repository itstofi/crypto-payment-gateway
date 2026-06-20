'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// The actual content is in a child component because useSearchParams()
// requires a Suspense boundary — Next.js enforces this at build time.
function MockCheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()

  const prepayId = params.get('prepayId') ?? ''
  const amount = params.get('amount') ?? '0'
  const currency = params.get('currency') ?? 'USDT'
  const paymentId = params.get('paymentId') ?? ''

  const [processing, setProcessing] = useState(false)

  async function resolve(outcome: 'paid' | 'failed') {
    setProcessing(true)
    try {
      await fetch('/api/payments/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status: outcome }),
      })
    } catch {
      // Navigate to status page regardless — user will see pending and can refresh
    }
    router.push(`/payment/${paymentId}`)
  }

  return (
    <main className="min-h-screen bg-[#1E2026] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold text-lg px-4 py-2 rounded-xl mb-3">
            Binance Pay
          </div>
          <p className="text-gray-400 text-sm">Simulated checkout — no real transaction</p>
        </div>

        <div className="bg-[#2B2F36] rounded-2xl p-6 border border-[#363C45]">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">You are paying</p>
            <p className="text-3xl font-bold text-white">
              {parseFloat(amount).toFixed(2)}{' '}
              <span className="text-yellow-400 text-xl">{currency}</span>
            </p>
          </div>

          <div className="space-y-2 text-xs text-gray-500 mb-6 bg-[#1E2026] rounded-xl p-4">
            <div className="flex justify-between">
              <span>Order ID</span>
              <span className="font-mono text-gray-400">{prepayId}</span>
            </div>
            <div className="flex justify-between">
              <span>Network</span>
              <span className="text-gray-400">BEP-20</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => resolve('failed')}
              disabled={processing}
              className="py-3 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => resolve('paid')}
              disabled={processing}
              className="py-3 rounded-xl bg-yellow-400 text-gray-900 text-sm font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Confirm Pay'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          Mock mode · Binance Pay credentials not configured
        </p>
      </div>
    </main>
  )
}

export default function MockCheckoutPage() {
  return (
    <Suspense>
      <MockCheckoutContent />
    </Suspense>
  )
}
