import type { SupabaseClient } from '@supabase/supabase-js'

/** Гостевой вход без Google — нужен Anonymous Sign-In в Supabase Auth. */
export async function signInAsGuest(supabase: SupabaseClient) {
  return supabase.auth.signInAnonymously()
}

export async function guestLandingPath(supabase: SupabaseClient, userId: string) {
  const { data: ch } = await supabase
    .from('characters')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return ch ? '/hub' : '/create-character'
}
