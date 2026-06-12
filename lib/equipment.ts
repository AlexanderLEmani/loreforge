export type EquipSlot = 'head' | 'body' | 'weapon' | 'hands' | 'feet'

export type StatBonuses = {
  attackPct?: number
  defensePct?: number
  damagePct?: number
  xpPct?: number
  defendTimerSec?: number
  spellDamagePct?: number
}

export type EquipmentItem = {
  id: string
  slot: EquipSlot
  name: string
  tier: 1 | 2 | 3
  icon: string
  /** Ключ для PixelCharacter — одинаковый на всех расах */
  visualId: string
  minLevel: number
  goldCost: number
  bonuses: StatBonuses
  desc: string
}

export const EQUIP_SLOTS: { id: EquipSlot; icon: string; label: string }[] = [
  { id: 'head', icon: '🎩', label: 'Голова' },
  { id: 'body', icon: '🥋', label: 'Мантия' },
  { id: 'weapon', icon: '🪄', label: 'Оружие' },
  { id: 'hands', icon: '🧤', label: 'Руки' },
  { id: 'feet', icon: '👢', label: 'Ноги' },
]

/** Снаряжение только из данжей — не продаётся в лавке */
export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'head_cowl', slot: 'head', name: 'Капюшон ученика', tier: 1, icon: '🎓', visualId: 'head_cowl', minLevel: 1, goldCost: 0, bonuses: { xpPct: 3 }, desc: '+3% XP' },
  { id: 'head_cap', slot: 'head', name: 'Шапка теоретика', tier: 2, icon: '📐', visualId: 'head_cap', minLevel: 2, goldCost: 0, bonuses: { xpPct: 5, spellDamagePct: 2 }, desc: '+5% XP, +2% магия' },
  { id: 'head_crown', slot: 'head', name: 'Диадема архимага', tier: 3, icon: '👑', visualId: 'head_crown', minLevel: 3, goldCost: 0, bonuses: { damagePct: 4, xpPct: 3 }, desc: '+4% урон, +3% XP' },
  { id: 'body_cloth', slot: 'body', name: 'Тканевая мантия', tier: 1, icon: '🥋', visualId: 'body_cloth', minLevel: 1, goldCost: 0, bonuses: { defensePct: 3 }, desc: '+3% защита' },
  { id: 'body_runed', slot: 'body', name: 'Рунная мантия', tier: 2, icon: '🔮', visualId: 'body_runed', minLevel: 2, goldCost: 0, bonuses: { defensePct: 5, spellDamagePct: 3 }, desc: '+5% защита, +3% магия' },
  { id: 'body_mantle', slot: 'body', name: 'Боевой накид', tier: 3, icon: '⚔️', visualId: 'body_mantle', minLevel: 3, goldCost: 0, bonuses: { defensePct: 4, damagePct: 4 }, desc: '+4% защита и урон' },
  { id: 'weapon_birch', slot: 'weapon', name: 'Берёзовый посох', tier: 1, icon: '🪄', visualId: 'weapon_birch', minLevel: 1, goldCost: 0, bonuses: { spellDamagePct: 3 }, desc: '+3% магия' },
  { id: 'weapon_iron', slot: 'weapon', name: 'Железный жезл', tier: 2, icon: '⚙️', visualId: 'weapon_iron', minLevel: 2, goldCost: 0, bonuses: { attackPct: 5, damagePct: 2 }, desc: '+5% атака, +2% урон' },
  { id: 'weapon_crystal', slot: 'weapon', name: 'Кристальный стержень', tier: 3, icon: '💎', visualId: 'weapon_crystal', minLevel: 3, goldCost: 0, bonuses: { spellDamagePct: 6, damagePct: 3 }, desc: '+6% магия, +3% урон' },
  { id: 'hands_cloth', slot: 'hands', name: 'Тканевые перчатки', tier: 1, icon: '🧤', visualId: 'hands_cloth', minLevel: 1, goldCost: 0, bonuses: { defendTimerSec: 1 }, desc: '+1 сек защиты' },
  { id: 'hands_leather', slot: 'hands', name: 'Кожаные перчатки', tier: 2, icon: '🥊', visualId: 'hands_leather', minLevel: 2, goldCost: 0, bonuses: { defendTimerSec: 2, defensePct: 2 }, desc: '+2 сек защиты, +2% броня' },
  { id: 'hands_runes', slot: 'hands', name: 'Рунные перчатки', tier: 3, icon: '✦', visualId: 'hands_runes', minLevel: 3, goldCost: 0, bonuses: { defendTimerSec: 2, damagePct: 4 }, desc: '+2 сек защиты, +4% урон' },
  { id: 'feet_soft', slot: 'feet', name: 'Мягкие сапоги', tier: 1, icon: '👢', visualId: 'feet_soft', minLevel: 1, goldCost: 0, bonuses: { attackPct: 2 }, desc: '+2% скорость атаки' },
  { id: 'feet_iron', slot: 'feet', name: 'Железные сапоги', tier: 2, icon: '🛡', visualId: 'feet_iron', minLevel: 2, goldCost: 0, bonuses: { defensePct: 4, attackPct: 2 }, desc: '+4% защита, +2% атака' },
  { id: 'feet_swift', slot: 'feet', name: 'Стремные сапоги', tier: 3, icon: '⚡', visualId: 'feet_swift', minLevel: 3, goldCost: 0, bonuses: { attackPct: 5, damagePct: 2 }, desc: '+5% атака, +2% урон' },
]

export const DEFAULT_EQUIPMENT: Record<EquipSlot, string> = {
  head: '',
  body: '',
  weapon: '',
  hands: '',
  feet: '',
}

export function itemsForTier(tier: 1 | 2 | 3): EquipmentItem[] {
  return EQUIPMENT_ITEMS.filter(i => i.tier === tier)
}

export function itemById(id: string): EquipmentItem | undefined {
  return EQUIPMENT_ITEMS.find(i => i.id === id)
}

export function itemsForSlot(slot: EquipSlot): EquipmentItem[] {
  return EQUIPMENT_ITEMS.filter(i => i.slot === slot)
}

export function ownedItemIds(level: number, owned: string[]): string[] {
  return owned.filter(id => {
    const item = itemById(id)
    return item && item.minLevel <= level
  })
}

export type EquippedMap = Partial<Record<EquipSlot, string>>

export function normalizeEquipped(raw: EquippedMap | null | undefined): EquippedMap {
  if (!raw || typeof raw !== 'object') return {}
  const out: EquippedMap = {}
  for (const slot of EQUIP_SLOTS) {
    const id = raw[slot.id]
    if (id && itemById(id)) out[slot.id] = id
  }
  return out
}

/** Снаряжение только из данжей — стартовый набор пуст */
export function starterItemIds(): string[] {
  return []
}

export function computeEquipBonuses(equipped: EquippedMap): StatBonuses {
  const total: StatBonuses = {}
  for (const id of Object.values(equipped)) {
    const item = itemById(id)
    if (!item) continue
    for (const [k, v] of Object.entries(item.bonuses) as [keyof StatBonuses, number][]) {
      total[k] = (total[k] ?? 0) + v
    }
  }
  return total
}

export function bonusLabel(b: StatBonuses): string {
  const parts: string[] = []
  if (b.damagePct) parts.push(`+${b.damagePct}% урон`)
  if (b.spellDamagePct) parts.push(`+${b.spellDamagePct}% магия`)
  if (b.defensePct) parts.push(`+${b.defensePct}% защита`)
  if (b.attackPct) parts.push(`+${b.attackPct}% атака`)
  if (b.xpPct) parts.push(`+${b.xpPct}% XP`)
  if (b.defendTimerSec) parts.push(`+${b.defendTimerSec}с защита`)
  return parts.join(' · ') || '—'
}
