import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createGuestCredentials } from '@/lib/guest-credentials'

/** Создаёт гостя через service role (не требует Anonymous Sign-In). */
export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { email, password } = createGuestCredentials()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { guest: true, display_name: 'Гость' },
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'create_failed' }, { status: 400 })
  }

  return NextResponse.json({ email, password, userId: data.user.id })
}
