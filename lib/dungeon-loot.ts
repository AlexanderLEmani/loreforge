import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScrollBattleEffect } from '@/lib/battle-config'
import { consumableMeta, parseConsumables } from '@/lib/battle-consumables'
import { itemsForTier } from '@/lib/equipment'

/** Частый шанс дропа при победе — настройка в DUNGEON_WIN_DROP_CHANCE */
export const DUNGEON_WIN_DROP_CHANCE = 0.72

export type LootKind = 'scroll' | 'consumable' | 'gold' | 'equipment'

export type LootDrop = {
  kind: LootKind
  label: string
  icon: string
  scrollId?: number
  scrollTitle?: string
  consumable?: ScrollBattleEffect
  gold?: number
  equipmentId?: string
  equipmentDesc?: string
}

type PoolEntry = {
  kind: LootKind
  weight: number
  consumable?: ScrollBattleEffect
  goldMin?: number
  goldMax?: number
}

const DUNGEON_SCROLL_LEVEL: Record<string, number> = {
  'Пещера сложения': 1,
  'Пещера вычитания': 1,
  'Башня умножения': 2,
  'Пещера деления': 2,
  'Храм дробей': 3,
  'Рынок процентов': 4,
}

const DUNGEON_EQUIP_TIER: Record<string, 1 | 2 | 3> = {
  'Пещера сложения': 1,
  'Пещера вычитания': 1,
  'Башня умножения': 2,
  'Пещера деления': 2,
  'Храм дробей': 3,
  'Рынок процентов': 3,
}

const DEFAULT_POOL: PoolEntry[] = [
  { kind: 'equipment', weight: 38 },
  { kind: 'scroll', weight: 28 },
  { kind: 'consumable', weight: 14, consumable: 'hint' },
  { kind: 'consumable', weight: 12, consumable: 'power' },
  { kind: 'consumable', weight: 10, consumable: 'shield' },
  { kind: 'consumable', weight: 5, consumable: 'heal' },
  { kind: 'gold', weight: 8, goldMin: 10, goldMax: 22 },
]

const FRACTION_POOL: PoolEntry[] = [
  { kind: 'equipment', weight: 42 },
  { kind: 'scroll', weight: 30 },
  { kind: 'consumable', weight: 12, consumable: 'hint' },
  { kind: 'consumable', weight: 10, consumable: 'power' },
  { kind: 'consumable', weight: 8, consumable: 'shield' },
  { kind: 'consumable', weight: 4, consumable: 'heal' },
  { kind: 'gold', weight: 8, goldMin: 15, goldMax: 28 },
]

const PERCENT_POOL: PoolEntry[] = [
  { kind: 'equipment', weight: 40 },
  { kind: 'scroll', weight: 32 },
  { kind: 'consumable', weight: 12, consumable: 'hint' },
  { kind: 'consumable', weight: 10, consumable: 'power' },
  { kind: 'consumable', weight: 8, consumable: 'shield' },
  { kind: 'consumable', weight: 4, consumable: 'heal' },
  { kind: 'gold', weight: 10, goldMin: 18, goldMax: 32 },
]

function poolForDungeon(dungeonName: string): PoolEntry[] {
  if (dungeonName === 'Храм дробей') return FRACTION_POOL
  if (dungeonName === 'Рынок процентов') return PERCENT_POOL
  return DEFAULT_POOL
}

function pickWeighted(pool: PoolEntry[]): PoolEntry {
  const total = pool.reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * total
  for (const entry of pool) {
    r -= entry.weight
    if (r <= 0) return entry
  }
  return pool[pool.length - 1]
}

export function rollDungeonLoot(dungeonName: string): PoolEntry | null {
  if (Math.random() > DUNGEON_WIN_DROP_CHANCE) return null
  return pickWeighted(poolForDungeon(dungeonName))
}

async function loadOwnedEquipmentIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('user_equipment').select('item_id').eq('user_id', userId)
  if (data?.length) return new Set(data.map(r => r.item_id))
  return new Set()
}

async function grantEquipment(
  supabase: SupabaseClient,
  userId: string,
  dungeonName: string,
  ownedIds: Set<string>,
): Promise<LootDrop | null> {
  const tier = DUNGEON_EQUIP_TIER[dungeonName] ?? 1
  const candidates = itemsForTier(tier).filter(i => !ownedIds.has(i.id))
  if (candidates.length === 0) return null

  const item = candidates[Math.floor(Math.random() * candidates.length)]
  await supabase
    .from('user_equipment')
    .upsert({ user_id: userId, item_id: item.id }, { onConflict: 'user_id,item_id' })

  return {
    kind: 'equipment',
    label: item.name,
    icon: item.icon,
    equipmentId: item.id,
    equipmentDesc: item.desc,
  }
}

function fallbackEntry(dungeonName: string): PoolEntry {
  const pool = poolForDungeon(dungeonName).filter(e => e.kind !== 'equipment')
  return pickWeighted(pool.length ? pool : DEFAULT_POOL.filter(e => e.kind !== 'equipment'))
}

export async function grantDungeonLoot(
  supabase: SupabaseClient,
  userId: string,
  dungeonName: string,
  entry: PoolEntry,
): Promise<LootDrop | null> {
  const ownedEquip = await loadOwnedEquipmentIds(supabase, userId)

  if (entry.kind === 'equipment') {
    const eq = await grantEquipment(supabase, userId, dungeonName, ownedEquip)
    if (eq) return eq
    return grantDungeonLoot(supabase, userId, dungeonName, fallbackEntry(dungeonName))
  }

  if (entry.kind === 'gold') {
    const gold =
      entry.goldMin != null && entry.goldMax != null
        ? entry.goldMin + Math.floor(Math.random() * (entry.goldMax - entry.goldMin + 1))
        : 12
    const { data: u } = await supabase.from('users').select('gold').eq('id', userId).single()
    const newGold = (u?.gold ?? 0) + gold
    await supabase.from('users').update({ gold: newGold }).eq('id', userId)
    return { kind: 'gold', label: `+${gold} золота`, icon: '💰', gold }
  }

  if (entry.kind === 'consumable' && entry.consumable) {
    const effect = entry.consumable
    const meta = consumableMeta(effect)
    const { data: u } = await supabase.from('users').select('consumables').eq('id', userId).single()
    const inv = parseConsumables(u?.consumables)
    const newInv = { ...inv, [effect]: inv[effect] + 1 }
    await supabase.from('users').update({ consumables: newInv }).eq('id', userId)
    return { kind: 'consumable', label: meta.label, icon: meta.icon, consumable: effect }
  }

  if (entry.kind === 'scroll') {
    const scrollLevel = DUNGEON_SCROLL_LEVEL[dungeonName] ?? 1
    const { data: owned } = await supabase.from('user_scrolls').select('scroll_id').eq('user_id', userId)
    const ownedIds = new Set((owned || []).map(r => r.scroll_id))

    const { data: catalog } = await supabase.from('scrolls').select('id, title').eq('level', scrollLevel)
    const candidates = (catalog || []).filter(s => !ownedIds.has(s.id))

    if (candidates.length === 0) {
      const eq = await grantEquipment(supabase, userId, dungeonName, ownedEquip)
      if (eq) return eq
      return grantDungeonLoot(supabase, userId, dungeonName, fallbackEntry(dungeonName))
    }

    const scroll = candidates[Math.floor(Math.random() * candidates.length)]
    await supabase.from('user_scrolls').insert({ user_id: userId, scroll_id: scroll.id })
    return {
      kind: 'scroll',
      label: scroll.title,
      icon: '📜',
      scrollId: scroll.id,
      scrollTitle: scroll.title,
    }
  }

  return null
}

export async function tryGrantDungeonLoot(
  supabase: SupabaseClient,
  userId: string,
  dungeonName: string,
  won: boolean,
): Promise<LootDrop | null> {
  if (!won) return null
  const entry = rollDungeonLoot(dungeonName)
  if (!entry) return null
  return grantDungeonLoot(supabase, userId, dungeonName, entry)
}
