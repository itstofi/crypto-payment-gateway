import { createClient } from '@supabase/supabase-js'

// Browser-safe client using the anon key.
// Access is governed by Supabase Row Level Security policies.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
