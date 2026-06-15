import { createBrowserClient } from '@supabase/ssr'

/** Stub only so Next.js build/prerender does not crash when env is missing (misconfigured Preview). */
const BUILD_STUB_URL = 'https://placeholder.supabase.co'
const BUILD_STUB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.build-stub'

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (url && key) return { url, key }
  if (typeof window === 'undefined') {
    return { url: BUILD_STUB_URL, key: BUILD_STUB_KEY }
  }
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel → Settings → Environment Variables (Production + Preview).',
  )
}

export function createClient() {
  const { url, key } = supabaseConfig()
  return createBrowserClient(url, key)
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  )
}
