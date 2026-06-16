import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScrollBattleEffect } from '@/lib/battle-config'
import { applyChampionBonus } from '@/lib/boss-system'
import { consumableMeta, parseConsumables } from '@/lib/battle-consumables'
import { itemsForTier, EQUIPMENT_ITEMS } from '@/lib/equipment'
import { addOwnedItem, loadOwnedIds } from '@/lib/equipment-storage'

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
  'Арена отрядов': 1,
}

const DUNGEON_EQUIP_TIER: Record<string, 1 | 2 | 3> = {
  'Пещера сложения': 1,
  'Пещера вычитания': 1,
  'Башня умножения': 2,
  'Пещера деления': 2,
  'Храм дробей': 3,
  'Рынок процентов': 3,
  'Арена отрядов': 1,
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

/** Ур.1 данжи — больше свитков, меньше дублей снаряжения */
const TIER1_POOL: PoolEntry[] = [
  { kind: 'scroll', weight: 36 },
  { kind: 'equipment', weight: 28 },
  { kind: 'consumable', weight: 14, consumable: 'hint' },
  { kind: 'consumable', weight: 12, consumable: 'power' },
  { kind: 'consumable', weight: 10, consumable: 'shield' },
  { kind: 'consumable', weight: 5, consumable: 'heal' },
  { kind: 'gold', weight: 10, goldMin: 8, goldMax: 18 },
]

/** Ур.2 — таблица и деление */
const TIER2_POOL: PoolEntry[] = [
  { kind: 'scroll', weight: 34 },
  { kind: 'equipment', weight: 32 },
  { kind: 'consumable', weight: 14, consumable: 'hint' },
  { kind: 'consumable', weight: 12, consumable: 'power' },
  { kind: 'consumable', weight: 10, consumable: 'shield' },
  { kind: 'consumable', weight: 5, consumable: 'heal' },
  { kind: 'gold', weight: 12, goldMin: 12, goldMax: 24 },
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
  if (dungeonName === 'Пещера сложения' || dungeonName === 'Пещера вычитания' || dungeonName === 'Арена отрядов') return TIER1_POOL
  if (dungeonName === 'Башня умножения' || dungeonName === 'Пещера деления') return TIER2_POOL
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

export function rollDungeonLoot(dungeonName: string, champion = false): PoolEntry | null {
  const chance = champion
    ? Math.min(0.92, DUNGEON_WIN_DROP_CHANCE * 1.35)
    : DUNGEON_WIN_DROP_CHANCE
  if (Math.random() > chance) return null
  return pickWeighted(poolForDungeon(dungeonName))
}

async function grantEquipment(
  supabase: SupabaseClient,
  userId: string,
  dungeonName: string,
): Promise<LootDrop | null> {
  const ownedIds = new Set(await loadOwnedIds(userId))
  const tier = DUNGEON_EQUIP_TIER[dungeonName] ?? 1
  let candidates = itemsForTier(tier).filter(i => !ownedIds.has(i.id))

  // Все предметы тира собраны — любой ещё не полученный с тиром ≤ данжа
  if (candidates.length === 0) {
    candidates = EQUIPMENT_ITEMS.filter(i => !ownedIds.has(i.id) && i.tier <= tier)
  }

  if (candidates.length === 0) return null

  const item = candidates[Math.floor(Math.random() * candidates.length)]
  const { ids, ok } = await addOwnedItem(userId, item.id)
  if (!ids.includes(item.id)) return null

  if (!ok) {
    console.warn(
      'equipment drop saved locally — apply migration 20250612150000_equipment.sql in Supabase',
    )
  }

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
  champion = false,
): Promise<LootDrop | null> {
  if (entry.kind === 'equipment') {
    const eq = await grantEquipment(supabase, userId, dungeonName)
    if (eq) return eq
    return grantDungeonLoot(supabase, userId, dungeonName, fallbackEntry(dungeonName), champion)
  }

  if (entry.kind === 'gold') {
    const baseGold =
      entry.goldMin != null && entry.goldMax != null
        ? entry.goldMin + Math.floor(Math.random() * (entry.goldMax - entry.goldMin + 1))
        : 12
    const gold = applyChampionBonus(baseGold, champion)
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
      const eq = await grantEquipment(supabase, userId, dungeonName)
      if (eq) return eq
      return grantDungeonLoot(supabase, userId, dungeonName, fallbackEntry(dungeonName), champion)
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
  champion = false,
): Promise<LootDrop | null> {
  if (!won) return null
  const entry = rollDungeonLoot(dungeonName, champion)
  if (!entry) return null
  return grantDungeonLoot(supabase, userId, dungeonName, entry, champion)
}
