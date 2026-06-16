import type { SupabaseClient } from '@supabase/supabase-js'

export function isStaleAuthError(error: { message?: string } | null | undefined): boolean {
  const msg = error?.message ?? ''
  return /refresh token/i.test(msg) || /invalid refresh/i.test(msg)
}

/** Сброс битой сессии (смена домена, протухший refresh token). */
export async function clearStaleAuth(supabase: SupabaseClient, redirectTo = '/') {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.location.pathname !== redirectTo) {
    window.location.replace(redirectTo)
  }
}

export async function recoverAuthIfNeeded(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.auth.getSession()
  if (error && isStaleAuthError(error)) {
    await clearStaleAuth(supabase)
    return true
  }
  return false
}
