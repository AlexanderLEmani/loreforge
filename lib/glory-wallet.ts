import type { SupabaseClient } from '@supabase/supabase-js'

/** Начисление славы: кошелёк + суммарная репутация для ранга */
export async function grantGlory(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<boolean> {
  if (amount <= 0) return true

  const { data, error } = await supabase
    .from('users')
    .select('glory, glory_total')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.warn('grantGlory load failed:', error?.message)
    return false
  }

  const glory = (data.glory ?? 0) + amount
  const gloryTotal = Math.max((data.glory_total ?? 0) + amount, glory)

  const updates: Record<string, number> = { glory }
  if (data.glory_total !== undefined) {
    updates.glory_total = gloryTotal
  }

  const { error: upErr } = await supabase.from('users').update(updates).eq('id', userId)
  if (upErr?.message?.includes('glory_total')) {
    await supabase.from('users').update({ glory }).eq('id', userId)
    return !upErr
  }
  if (upErr) {
    console.warn('grantGlory update failed:', upErr.message)
    return false
  }
  return true
}

/** Списание славы на вход в данж — репутация (ранг) не падает */
export async function spendGlory(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<boolean> {
  if (amount <= 0) return true

  const { data, error } = await supabase.from('users').select('glory').eq('id', userId).single()
  if (error || !data || (data.glory ?? 0) < amount) return false

  const { error: upErr } = await supabase
    .from('users')
    .update({ glory: (data.glory ?? 0) - amount })
    .eq('id', userId)

  return !upErr
}
