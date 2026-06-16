import type { ScrollBattleEffect } from '@/lib/battle-config'
import { CONSUMABLE_EFFECTS, type ConsumableInventory } from '@/lib/battle-consumables'
import { dungeonIdFromRef } from '@/lib/dungeons'

export const MAX_BATTLE_LOADOUT = 3
export const BATTLE_LOADOUT_KEY = 'loreheim_battle_loadout'

export type BattleLoadoutPayload = {
  dungeon: string
  loadout: Partial<ConsumableInventory>
}

export function loadoutItemCount(loadout: Partial<ConsumableInventory>) {
  let n = 0
  for (const k of CONSUMABLE_EFFECTS) n += loadout[k] ?? 0
  return n
}

export function saveBattleLoadout(payload: BattleLoadoutPayload) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(BATTLE_LOADOUT_KEY, JSON.stringify(payload))
}

export function readBattleLoadout(dungeonRef: string): Partial<ConsumableInventory> | null {
  if (typeof window === 'undefined') return null
  const expectedId = dungeonIdFromRef(dungeonRef)
  try {
    const raw = sessionStorage.getItem(BATTLE_LOADOUT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BattleLoadoutPayload
    if (dungeonIdFromRef(parsed.dungeon) !== expectedId) return null
    return parsed.loadout ?? {}
  } catch {
    return null
  }
}

export function clearBattleLoadout() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(BATTLE_LOADOUT_KEY)
}

export function subtractInventory(
  inv: ConsumableInventory,
  loadout: Partial<ConsumableInventory>,
): ConsumableInventory {
  const out = { ...inv }
  for (const k of CONSUMABLE_EFFECTS) {
    out[k] = Math.max(0, out[k] - (loadout[k] ?? 0))
  }
  return out
}

export function addInventory(
  inv: ConsumableInventory,
  delta: Partial<ConsumableInventory>,
): ConsumableInventory {
  const out = { ...inv }
  for (const k of CONSUMABLE_EFFECTS) {
    out[k] = out[k] + (delta[k] ?? 0)
  }
  return out
}

export function slotsToLoadout(slots: ScrollBattleEffect[]): Partial<ConsumableInventory> {
  const loadout: Partial<ConsumableInventory> = {}
  for (const s of slots) {
    loadout[s] = (loadout[s] ?? 0) + 1
  }
  return loadout
}

export function loadoutToInventory(loadout: Partial<ConsumableInventory>): ConsumableInventory {
  const inv = { hint: 0, power: 0, shield: 0, heal: 0 }
  for (const k of CONSUMABLE_EFFECTS) {
    inv[k] = loadout[k] ?? 0
  }
  return inv
}
