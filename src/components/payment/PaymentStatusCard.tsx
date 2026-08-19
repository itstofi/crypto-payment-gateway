'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CustomerPaymentStatus } from '@/types/payment'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import { getPaymentStatusPresentation, LatestRequestCoordinator } from '@/lib/payments/paymentStatus'

interface PaymentStatusCardProps {
  paymentId: string
}

export function PaymentStatusCard({ paymentId }: PaymentStatusCardProps) {
  const [payment, setPayment] = useState<CustomerPaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const requests = useRef(new LatestRequestCoordinator())

  const fetchStatus = useCallback(async (showRefreshing = false) => {
    const request = requests.current.begin()
    if (showRefreshing) setRefreshing(true)

    try {
      const res = await fetch(`/api/payments/status?paymentId=${encodeURIComponent(paymentId)}`, {
        signal: request.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Payment not found')
      const data: CustomerPaymentStatus = await res.json()
      if (!requests.current.isCurrent(request.id)) return
      setPayment(data)
      setError('')
    } catch {
      if (!request.signal.aborted && requests.current.isCurrent(request.id)) {
        setError('Could not load payment status.')
      }
    } finally {
      if (requests.current.isCurrent(request.id)) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [paymentId])

  useEffect(() => {
    const coordinator = requests.current
    const initialFetch = window.setTimeout(() => void fetchStatus(), 0)
    return () => {
      window.clearTimeout(initialFetch)
      coordinator.cancel()
    }
  }, [fetchStatus])

  useEffect(() => {
    if (payment?.status !== 'pending') return
    const interval = window.setInterval(() => void fetchStatus(), 5000)
    return () => window.clearInterval(interval)
  }, [fetchStatus, payment?.status])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 text-gray-400 py-12">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading payment...
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Payment not found.'}</p>
        <Link href="/" className="text-yellow-400 hover:underline text-sm">
          Back to payment page
        </Link>
      </div>
    )
  }

  const config = getPaymentStatusPresentation(payment.status, payment.provider)

  return (
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border text-2xl mb-5 ${config.bg}`}>
        {config.icon}
      </div>

      <h2 className={`text-xl font-semibold mb-2 ${config.color}`}>{config.label}</h2>
      <p className="text-gray-400 text-sm mb-6">{config.description}</p>

      <div className="space-y-0 text-sm text-left mb-6">
        <DetailRow label="Amount" value={formatCurrency(payment.amount, payment.currency)} />
        <DetailRow label="Provider" value={config.providerLabel} />
        <DetailRow label="Created" value={formatDate(payment.createdAt)} />
        <DetailRow label="Payment ID" value={payment.id} mono truncate />
      </div>

      <div className="flex gap-3">
        {payment.status === 'pending' && (
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:border-yellow-400/50 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>
        )}
        <Link
          href="/"
          className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-gray-900 font-medium text-sm hover:bg-yellow-300 transition-colors text-center"
        >
          New Payment
        </Link>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
  truncate = false,
}: {
  label: string
  value: string
  mono?: boolean
  truncate?: boolean
}) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-gray-200 text-right ${mono ? 'font-mono text-xs' : ''} ${truncate ? 'truncate max-w-[180px]' : ''}`}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
