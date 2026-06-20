import type { PaymentStats } from '@/types/payment'
import { formatCurrency } from '@/lib/utils/formatCurrency'

interface AdminStatsCardsProps {
  stats: PaymentStats
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      label: 'Total Payments',
      value: stats.total.toString(),
      color: 'text-white',
      border: 'border-gray-700',
    },
    {
      label: 'Pending',
      value: stats.pending.toString(),
      color: 'text-yellow-400',
      border: 'border-yellow-400/20',
    },
    {
      label: 'Successful',
      value: stats.paid.toString(),
      color: 'text-green-400',
      border: 'border-green-400/20',
    },
    {
      label: 'Failed',
      value: stats.failed.toString(),
      color: 'text-red-400',
      border: 'border-red-400/20',
    },
    {
      label: 'Total Volume',
      value: formatCurrency(stats.totalAmount),
      color: 'text-yellow-400',
      border: 'border-yellow-400/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gray-900 rounded-xl p-4 border ${card.border}`}
        >
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className={`text-xl font-semibold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
