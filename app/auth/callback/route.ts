import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** OAuth (Google) — обмен code на сессию, редирект в приложение */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/hub'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const safeNext = next.startsWith('/') ? next : '/hub'
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
