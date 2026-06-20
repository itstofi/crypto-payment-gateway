import { createClient } from '@supabase/supabase-js'

// Server-side client with the service role key — bypasses RLS.
// Only import this from API routes or server components, never from client code.
export const serverSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
