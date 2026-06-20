'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PRESET_AMOUNTS = [10, 25, 50, 100, 250]

type Step = 'form' | 'loading' | 'redirect'

export function CryptoPaymentForm() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    setStep('loading')

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, currency: 'USDT' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Payment creation failed')
      }

      setStep('redirect')

      // Local URL means mock mode, absolute URL means real Binance Pay
      if (data.checkoutUrl.startsWith('/')) {
        router.push(`${data.checkoutUrl}&paymentId=${data.paymentId}`)
      } else {
        window.open(data.checkoutUrl, '_blank')
        router.push(`/payment/${data.paymentId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('form')
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
            USDT
          </span>
          <span className="text-xs text-gray-500">Tether USD</span>
        </div>

        <label className="block text-sm text-gray-400 mb-2" htmlFor="amount">
          Amount
        </label>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setError('')
              setAmount(e.target.value)
            }}
            disabled={step !== 'form'}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-16 py-3 text-white text-lg focus:outline-none focus:border-yellow-400 disabled:opacity-50 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USDT</span>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setError('')
                setAmount(preset.toString())
              }}
              disabled={step !== 'form'}
              className={`py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                amount === preset.toString()
                  ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-yellow-400/50'
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={step !== 'form' || !amount}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/40 text-gray-900 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {step === 'loading' && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {step === 'loading'
            ? 'Creating payment...'
            : step === 'redirect'
            ? 'Redirecting...'
            : 'Pay with Binance Pay'}
        </button>
      </form>
    </div>
  )
}
