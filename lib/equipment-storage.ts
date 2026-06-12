import { createClient } from '@/lib/supabase'
import { normalizeEquipped, starterItemIds, type EquippedMap } from '@/lib/equipment'

const LOCAL_KEY = (userId: string) => `loreforge_equipped_${userId}`

export function loadEquippedLocal(userId: string): EquippedMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LOCAL_KEY(userId))
    if (!raw) return {}
    return normalizeEquipped(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function saveEquippedLocal(userId: string, equipped: EquippedMap) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY(userId), JSON.stringify(equipped))
}

/** Читает снаряжение: БД если есть колонка, иначе localStorage */
export async function loadEquipped(userId: string): Promise<EquippedMap> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('characters')
    .select('equipment')
    .eq('user_id', userId)
    .maybeSingle()

  if (!error && data?.equipment && typeof data.equipment === 'object') {
    return normalizeEquipped(data.equipment as EquippedMap)
  }
  return loadEquippedLocal(userId)
}

/** Сохраняет в БД + localStorage; не падает если колонки ещё нет */
export async function saveEquipped(userId: string, equipped: EquippedMap) {
  saveEquippedLocal(userId, equipped)
  const supabase = createClient()
  const { error } = await supabase.from('characters').update({ equipment: equipped }).eq('user_id', userId)
  if (error) return { ok: false, usedLocal: true }
  return { ok: true, usedLocal: false }
}

const OWNED_LOCAL_KEY = (userId: string) => `loreforge_owned_equipment_${userId}`

export function loadOwnedLocal(userId: string): string[] {
  if (typeof window === 'undefined') return starterItemIds()
  try {
    const raw = localStorage.getItem(OWNED_LOCAL_KEY(userId))
    if (!raw) return starterItemIds()
    return JSON.parse(raw) as string[]
  } catch {
    return starterItemIds()
  }
}

export function saveOwnedLocal(userId: string, ids: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(OWNED_LOCAL_KEY(userId), JSON.stringify(ids))
}

export async function loadOwnedIds(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('user_equipment').select('item_id').eq('user_id', userId)
  if (!error && data?.length) return data.map(r => r.item_id)

  const local = loadOwnedLocal(userId)
  const starters = starterItemIds()
  if (local.length === 0) {
    saveOwnedLocal(userId, starters)
    return starters
  }
  return local
}

export async function addOwnedItem(userId: string, itemId: string): Promise<string[]> {
  const supabase = createClient()
  const { error } = await supabase
    .from('user_equipment')
    .upsert({ user_id: userId, item_id: itemId }, { onConflict: 'user_id,item_id' })

  const current = await loadOwnedIds(userId)
  const next = [...new Set([...current, itemId])]
  if (error) saveOwnedLocal(userId, next)
  return next
}
