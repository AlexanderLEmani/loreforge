import type { ScrollBattleEffect } from '@/lib/battle-config'
import { SCROLL_EFFECT_LABELS } from '@/lib/battle-config'

export type ConsumableInventory = Record<ScrollBattleEffect, number>

export const EMPTY_CONSUMABLES: ConsumableInventory = { hint: 0, power: 0, shield: 0 }

export const BATTLE_CONSUMABLES: Array<{
  effect: ScrollBattleEffect
  name: string
  cost: number
  shortDesc: string
}> = [
  { effect: 'hint', name: 'Светоч подсказки', cost: 25, shortDesc: 'Подсветит верный вариант' },
  { effect: 'power', name: 'Эссенция мощи', cost: 40, shortDesc: '×2 урон следующей атаки' },
  { effect: 'shield', name: 'Руна щита', cost: 35, shortDesc: 'Блокирует один удар монстра' },
]

export function parseConsumables(raw: unknown): ConsumableInventory {
  const inv = { ...EMPTY_CONSUMABLES }
  if (!raw || typeof raw !== 'object') return inv
  for (const key of Object.keys(inv) as ScrollBattleEffect[]) {
    const n = (raw as Record<string, unknown>)[key]
    if (typeof n === 'number' && n > 0) inv[key] = Math.floor(n)
  }
  return inv
}

export function consumableMeta(effect: ScrollBattleEffect) {
  return SCROLL_EFFECT_LABELS[effect]
}
