'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { clearStaleAuth, isStaleAuthError, recoverAuthIfNeeded } from '@/lib/auth-recovery'

/** Ловит протухший refresh token после смены домена / очистки Supabase. */
export default function AuthRecovery() {
  useEffect(() => {
    const supabase = createClient()

    recoverAuthIfNeeded(supabase)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      const { error } = await supabase.auth.getSession()
      if (isStaleAuthError(error)) await clearStaleAuth(supabase)
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
