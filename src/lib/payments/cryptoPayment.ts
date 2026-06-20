import crypto from 'crypto'
import { createMockOrder } from './mockGateway'

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
  status: string
  code: string
  data?: {
    prepayId: string
    checkoutUrl: string
  }
  errorMessage?: string
}

// Binance Pay uses HMAC-SHA512. The message format is fixed:
// timestamp + newline + nonce + newline + body + newline.
function buildSignature(payload: string, timestamp: string, nonce: string, apiSecret: string): string {
  const message = `${timestamp}\n${nonce}\n${payload}\n`
  return crypto.createHmac('sha512', apiSecret).update(message).digest('hex').toUpperCase()
}

// Entry point for creating a payment order.
// Uses real Binance Pay when credentials are configured, falls back to mock otherwise.
export async function createPaymentOrder(params: OrderRequest): Promise<OrderResult> {
  const apiKey = process.env.BINANCE_PAY_API_KEY
  const apiSecret = process.env.BINANCE_PAY_API_SECRET

  if (!apiKey || !apiSecret) {
    return createMockOrder(params)
  }

  const timestamp = Date.now().toString()
  const nonce = crypto.randomBytes(16).toString('hex')

  const body = {
    env: { terminalType: 'WEB' },
    merchantTradeNo: params.referenceId,
    orderAmount: params.amount.toFixed(2),
    currency: params.currency,
    goods: {
      goodsType: '02',       // '02' = digital goods, required by Binance Pay
      goodsCategory: 'Z000',
      referenceGoodsId: params.referenceId,
      goodsName: 'Crypto Payment',
    },
  }

  const payload = JSON.stringify(body)
  const signature = buildSignature(payload, timestamp, nonce, apiSecret)

  const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp,
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': apiKey,
      'BinancePay-Signature': signature,
    },
    body: payload,
  })

  // Binance returns HTTP 200 even on failure — check the status field
  const result: BinancePayResponse = await response.json()

  if (result.status !== 'SUCCESS' || !result.data) {
    throw new Error(result.errorMessage || 'Binance Pay order creation failed')
  }

  return {
    checkoutUrl: result.data.checkoutUrl,
    prepayId: result.data.prepayId,
  }
}
