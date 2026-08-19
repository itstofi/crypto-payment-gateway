import { describe, expect, it } from 'vitest'
import { LatestRequestCoordinator, getPaymentStatusPresentation } from './paymentStatus'

describe('LatestRequestCoordinator', () => {
  it('aborts an earlier poll and accepts only the latest response', () => {
    const coordinator = new LatestRequestCoordinator()
    const first = coordinator.begin()
    const second = coordinator.begin()

    expect(first.signal.aborted).toBe(true)
    expect(coordinator.isCurrent(first.id)).toBe(false)
    expect(second.signal.aborted).toBe(false)
    expect(coordinator.isCurrent(second.id)).toBe(true)
  })

  it('aborts the current poll on cancellation', () => {
    const coordinator = new LatestRequestCoordinator()
    const request = coordinator.begin()
    coordinator.cancel()
    expect(request.signal.aborted).toBe(true)
    expect(coordinator.isCurrent(request.id)).toBe(false)
  })
})

describe('getPaymentStatusPresentation', () => {
  it('labels pending demo payments as simulated rather than Binance-confirmed', () => {
    const presentation = getPaymentStatusPresentation('pending', 'demo')
    expect(presentation.providerLabel).toBe('Demo / Simulated')
    expect(presentation.description).toContain('simulated')
    expect(presentation.description).not.toContain('Binance')
  })

  it('labels production payments as Binance Pay', () => {
    const presentation = getPaymentStatusPresentation('pending', 'binance_pay')
    expect(presentation.providerLabel).toBe('Binance Pay')
    expect(presentation.description).toContain('Binance Pay')
  })
})
