import type { SupabaseClient } from '@supabase/supabase-js'
import { USER_NAV_SELECT } from '@/lib/nav-unlock'

type UserRow = Record<string, unknown>

/** Загрузка users с откатом если в БД нет новых колонок */
export async function fetchUserRow(
  supabase: SupabaseClient,
  userId: string,
  extraFields: string[] = [],
): Promise<UserRow | null> {
  const fields = [...new Set([...USER_NAV_SELECT.split(', '), ...extraFields])].join(', ')
  const { data, error } = await supabase.from('users').select(fields).eq('id', userId).single()
  if (!error && data) return data as unknown as UserRow

  const { data: basic, error: basicError } = await supabase
    .from('users')
    .select('xp, level, gold, glory, glory_total, streak, onboarding_step')
    .eq('id', userId)
    .single()

  if (basicError || !basic) return null
  return basic as unknown as UserRow
}

export async function fetchSpellKills(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await supabase.from('users').select('spell_kills').eq('id', userId).single()
  if (error) return 0
  return (data?.spell_kills as number) ?? 0
}
