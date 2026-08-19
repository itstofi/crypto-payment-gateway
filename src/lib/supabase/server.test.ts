import { afterEach, describe, expect, it } from 'vitest'
import { createServerSupabase } from './server'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('createServerSupabase', () => {
  it('fails closed when production Supabase configuration is incomplete', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(() => createServerSupabase()).toThrow(
      'Production mode requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    )
  })
})
