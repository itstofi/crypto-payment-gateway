'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { AdminStatsCards } from '@/components/admin/AdminStatsCards'
import { PaymentsTable } from '@/components/admin/PaymentsTable'
import type { Payment, PaymentStats } from '@/types/payment'

function computeStats(payments: Payment[]): PaymentStats {
  return {
    total: payments.length,
    pending: payments.filter((p) => p.status === 'pending').length,
    paid: payments.filter((p) => p.status === 'paid').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    // Only sum completed payments for the volume figure
    totalAmount: payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
  }
}

export default function AdminPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchPayments() {
    try {
      const res = await fetch('/api/payments/list')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: Payment[] = await res.json()
      setPayments(data)
    } catch {
      setError('Could not load payments. Check your Supabase connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const stats = computeStats(payments)

  return (
    <PageContainer>
      <Header activePage="admin" />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Payment records from Supabase</p>
          </div>
          <button
            onClick={fetchPayments}
            className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg hover:border-yellow-400/50 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-12">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading...
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <>
            <AdminStatsCards stats={stats} />
            <div>
              <h2 className="text-sm font-medium text-gray-400 mb-3">All Payments</h2>
              <PaymentsTable payments={payments} />
            </div>
          </>
        )}
      </main>
    </PageContainer>
  )
}
