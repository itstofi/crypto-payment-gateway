import crypto from 'crypto'
import { createMockOrder } from './mockGateway'
import { isDemoMode } from '@/lib/config'

interface OrderRequest {
  amount: number
  currency: string
  referenceId: string
}

interface OrderResult {
  checkoutUrl: string
  prepayId: string
}

interface BinancePayResponse {
  status?: unknown
  code?: unknown
  data?: {
    prepayId?: unknown
    checkoutUrl?: unknown
  }
  errorMessage?: unknown
}

const BINANCE_ORDER_ENDPOINT = 'https://bpay.binanceapi.com/binancepay/openapi/v2/order'
const BINANCE_CHECKOUT_ORIGINS = new Set([
  'https://pay.binance.com',
  'https://www.binance.com',
])
const BINANCE_FETCH_TIMEOUT_MS = 10_000

function buildSignature(payload: string, timestamp: string, nonce: string, apiSecret: string): string {
  const message = `${timestamp}\n${nonce}\n${payload}\n`
  return crypto.createHmac('sha512', apiSecret).update(message).digest('hex').toUpperCase()
}

function isExpectedBinanceCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && BINANCE_CHECKOUT_ORIGINS.has(url.origin)
  } catch {
    return false
  }
}

function validateOrderResult(result: OrderResult, demoMode: boolean): OrderResult {
  if (typeof result.prepayId !== 'string' || result.prepayId.trim() === '') {
    throw new Error('Payment provider returned an invalid response')
  }

  const validCheckout = demoMode
    ? result.checkoutUrl.startsWith('/mock-checkout?')
    : isExpectedBinanceCheckoutUrl(result.checkoutUrl)
  if (typeof result.checkoutUrl !== 'string' || !validCheckout) {
    throw new Error('Payment provider returned an invalid response')
  }

  return result
}

export async function createPaymentOrder(params: OrderRequest): Promise<OrderResult> {
  const demoMode = isDemoMode()
  if (demoMode) return validateOrderResult(createMockOrder(params), true)

  const apiKey = process.env.BINANCE_PAY_API_KEY
  const apiSecret = process.env.BINANCE_PAY_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error('Binance Pay credentials are required outside DEMO_MODE')
  }

  const timestamp = Date.now().toString()
  const nonce = crypto.randomBytes(16).toString('hex')
  const body = {
    env: { terminalType: 'WEB' },
    merchantTradeNo: params.referenceId,
    orderAmount: params.amount.toFixed(2),
    currency: params.currency,
    goods: {
      goodsType: '02',
      goodsCategory: 'Z000',
      referenceGoodsId: params.referenceId,
      goodsName: 'Crypto Payment',
    },
  }
  const payload = JSON.stringify(body)
  const signature = buildSignature(payload, timestamp, nonce, apiSecret)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), BINANCE_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(BINANCE_ORDER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': apiKey,
        'BinancePay-Signature': signature,
      },
      body: payload,
      signal: controller.signal,
    })

    const result = await response.json() as BinancePayResponse
    if (!response.ok || result.status !== 'SUCCESS' || !result.data) {
      const providerMessage = typeof result.errorMessage === 'string' ? result.errorMessage : undefined
      throw new Error(providerMessage || 'Binance Pay order creation failed')
    }

    return validateOrderResult({
      checkoutUrl: result.data.checkoutUrl as string,
      prepayId: result.data.prepayId as string,
    }, false)
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Binance Pay request timed out')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
