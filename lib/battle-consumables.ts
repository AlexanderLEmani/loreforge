import type { ScrollBattleEffect } from '@/lib/battle-config'
import { SCROLL_EFFECT_LABELS } from '@/lib/battle-config'

export type ConsumableInventory = Record<ScrollBattleEffect, number>

export const CONSUMABLE_EFFECTS: ScrollBattleEffect[] = ['hint', 'power', 'shield', 'heal']

export const EMPTY_CONSUMABLES: ConsumableInventory = { hint: 0, power: 0, shield: 0, heal: 0 }

export const BATTLE_CONSUMABLES: Array<{
  effect: ScrollBattleEffect
  name: string
  cost: number
  shortDesc: string
}> = [
  { effect: 'hint', name: 'Светоч подсказки', cost: 25, shortDesc: 'В бою: 2 из 4 вариантов (один верный)' },
  { effect: 'power', name: 'Эссенция мощи', cost: 40, shortDesc: '×2 урон следующей атаки' },
  { effect: 'shield', name: 'Руна щита', cost: 35, shortDesc: 'Блокирует один удар монстра' },
  { effect: 'heal', name: 'Зелье жизни', cost: 85, shortDesc: 'Восстанавливает 40 HP' },
]

export function parseConsumables(raw: unknown): ConsumableInventory {
  const inv = { ...EMPTY_CONSUMABLES }
  if (!raw || typeof raw !== 'object') return inv
  for (const key of CONSUMABLE_EFFECTS) {
    const n = (raw as Record<string, unknown>)[key]
    if (typeof n === 'number' && n > 0) inv[key] = Math.floor(n)
  }
  return inv
}

export function consumableMeta(effect: ScrollBattleEffect) {
  return SCROLL_EFFECT_LABELS[effect]
}

export function consumableShopItem(effect: ScrollBattleEffect) {
  return BATTLE_CONSUMABLES.find(c => c.effect === effect)
}
