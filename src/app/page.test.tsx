import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import PaymentPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('payment page', () => {
  it('does not claim demo records are stored in Supabase', () => {
    const markup = renderToStaticMarkup(<PaymentPage />)

    expect(markup).toContain('Demo and production modes are isolated')
    expect(markup).not.toContain('Records stored in Supabase')
  })
})
