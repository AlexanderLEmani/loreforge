import {
  CONSUMABLE_EFFECTS,
  parseConsumables,
  type ConsumableInventory,
} from '@/lib/battle-consumables'

export function totalConsumables(raw: unknown): number {
  const inv = parseConsumables(raw)
  return CONSUMABLE_EFFECTS.reduce((sum, key) => sum + inv[key], 0)
}

export function consumablesInventory(raw: unknown): ConsumableInventory {
  return parseConsumables(raw)
}
