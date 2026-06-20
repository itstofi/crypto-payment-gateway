'use client'

import { useState } from 'react'
import type { Payment, PaymentStatus } from '@/types/payment'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'

type FilterTab = 'all' | PaymentStatus

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Failed', value: 'failed' },
]

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  paid: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
}

interface PaymentsTableProps {
  payments: Payment[]
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const filtered = activeFilter === 'all'
    ? payments
    : payments.filter((p) => p.status === activeFilter)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeFilter === tab.value
                ? 'bg-yellow-400 text-gray-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {payments.filter((p) => p.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Payment ID</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Amount</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Currency</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Provider</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className={`border-b border-gray-800/50 last:border-0 ${
                      index % 2 === 0 ? '' : 'bg-gray-800/20'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      <span title={payment.id}>{payment.id.slice(0, 8)}...</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{payment.currency}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">
                      {payment.payment_provider.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[payment.status]}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDate(payment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
