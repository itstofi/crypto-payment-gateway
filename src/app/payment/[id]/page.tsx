import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { PaymentStatusCard } from '@/components/payment/PaymentStatusCard'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaymentStatusPage({ params }: Props) {
  const { id } = await params

  return (
    <PageContainer>
      <Header activePage="payment" />
      <main className="flex items-center justify-center p-4 py-16">
        <div className="w-full max-w-md">
          <PaymentStatusCard paymentId={id} />
        </div>
      </main>
    </PageContainer>
  )
}
