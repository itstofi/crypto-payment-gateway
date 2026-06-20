import crypto from 'crypto'

interface MockOrderParams {
  amount: number
  currency: string
}

// Generates a fake prepayId and routes the user to our local mock checkout page.
// This keeps the full payment flow testable without real Binance credentials.
export function createMockOrder(params: MockOrderParams): { checkoutUrl: string; prepayId: string } {
  const prepayId = `MOCK-${crypto.randomBytes(8).toString('hex').toUpperCase()}`
  const checkoutUrl = `/mock-checkout?prepayId=${prepayId}&amount=${params.amount}&currency=${params.currency}`
  return { checkoutUrl, prepayId }
}
