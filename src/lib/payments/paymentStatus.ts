import type { CustomerPaymentProvider, PaymentStatus } from '@/types/payment'

export class LatestRequestCoordinator {
  private sequence = 0
  private controller: AbortController | null = null

  begin(): { id: number; signal: AbortSignal } {
    this.controller?.abort()
    this.sequence += 1
    this.controller = new AbortController()
    return { id: this.sequence, signal: this.controller.signal }
  }

  isCurrent(id: number): boolean {
    return id === this.sequence && this.controller !== null && !this.controller.signal.aborted
  }

  cancel(): void {
    this.controller?.abort()
    this.controller = null
    this.sequence += 1
  }
}

const STATUS_CONFIG = {
  pending: {
    icon: '○',
    label: 'Payment Pending',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/30',
  },
  paid: {
    icon: '✓',
    label: 'Payment Successful',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/30',
  },
  failed: {
    icon: '✕',
    label: 'Payment Failed',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/30',
  },
} as const

export function getPaymentStatusPresentation(status: PaymentStatus, provider: CustomerPaymentProvider) {
  const description = status === 'pending'
    ? provider === 'demo'
      ? 'Waiting for the simulated checkout result.'
      : 'Waiting for confirmation from Binance Pay.'
    : status === 'paid'
      ? provider === 'demo'
        ? 'The simulated payment has been marked successful.'
        : 'Your payment has been confirmed.'
      : 'The payment could not be completed.'

  return {
    ...STATUS_CONFIG[status],
    description,
    providerLabel: provider === 'demo' ? 'Demo / Simulated' : 'Binance Pay',
  }
}
