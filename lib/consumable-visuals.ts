import type { ScrollBattleEffect } from '@/lib/battle-config'

export const CONSUMABLE_PIXEL_IDS: Record<ScrollBattleEffect, string> = {
  hint: 'item_scroll_hint',
  power: 'potion_power',
  shield: 'item_shield',
  heal: 'potion_hp',
}

export function consumablePixelId(effect: ScrollBattleEffect): string {
  return CONSUMABLE_PIXEL_IDS[effect]
}
