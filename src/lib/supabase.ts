import { createClient } from '@supabase/supabase-js'

// Vite only exposes variables that start with VITE_ to the browser.
// The anon key is safe here ONLY because Row Level Security protects the data.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

// Fallback strings stop createClient from throwing, so we can show a friendly setup screen.
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing-key')
