import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { CryptoPaymentForm } from '@/components/payment/CryptoPaymentForm'

export default function PaymentPage() {
  return (
    <PageContainer>
      <Header activePage="payment" />
      <main className="flex items-center justify-center p-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-2xl mb-4 text-2xl font-bold text-gray-900">
              B
            </div>
            <h1 className="text-2xl font-semibold text-white">Crypto Payment</h1>
            <p className="text-gray-400 text-sm mt-1">Pay securely with Binance Pay</p>
          </div>
          <CryptoPaymentForm />
          <p className="text-center text-xs text-gray-600 mt-4">
            Payments handled server-side · Demo and production modes are isolated
          </p>
        </div>
      </main>
    </PageContainer>
  )
}
