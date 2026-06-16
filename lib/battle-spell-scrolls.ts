import type { BattleAttack } from '@/lib/battle-config'

/** Свитки боевых заклинаний — купить в лавке, взять в данж, нужна ветка «Мастер …» на древе */
export type SpellScrollId =
  | 'scroll_twin_strike'
  | 'scroll_fireball'
  | 'scroll_storm_lance'
  | 'scroll_arcane_burst'
  | 'scroll_dark_sigil'

export const SPELL_SCROLL_IDS: SpellScrollId[] = [
  'scroll_twin_strike',
  'scroll_fireball',
  'scroll_storm_lance',
  'scroll_arcane_burst',
  'scroll_dark_sigil',
]

export type SpellScrollInventory = Record<SpellScrollId, number>

export const EMPTY_SPELL_SCROLLS: SpellScrollInventory = {
  scroll_twin_strike: 0,
  scroll_fireball: 0,
  scroll_storm_lance: 0,
  scroll_arcane_burst: 0,
  scroll_dark_sigil: 0,
}

export type SpellScrollDef = {
  id: SpellScrollId
  name: string
  icon: string
  cost: number
  shortDesc: string
  attackId: string
  /** id пассивного узла «Мастер …» на древе навыков */
  requiresMasteryNode: number
  masteryLabel: string
}

export const SPELL_SCROLL_DEFS: SpellScrollDef[] = [
  {
    id: 'scroll_twin_strike',
    name: 'Свиток двойного удара',
    icon: '➕➖',
    cost: 90,
    shortDesc: 'Сложение + вычитание · один раз в бою',
    attackId: 'twin_strike',
    requiresMasteryNode: 7,
    masteryLabel: 'Мастер прибавления',
  },
  {
    id: 'scroll_fireball',
    name: 'Свиток огненного шара',
    icon: '🔥',
    cost: 140,
    shortDesc: 'Умножение + деление',
    attackId: 'fireball',
    requiresMasteryNode: 21,
    masteryLabel: 'Мастер умножения',
  },
  {
    id: 'scroll_storm_lance',
    name: 'Свиток штормового ланса',
    icon: '⚔️',
    cost: 155,
    shortDesc: 'Мощная × и ÷',
    attackId: 'storm_lance',
    requiresMasteryNode: 28,
    masteryLabel: 'Мастер деления',
  },
  {
    id: 'scroll_arcane_burst',
    name: 'Свиток арканического взрыва',
    icon: '🌀',
    cost: 195,
    shortDesc: 'Сложный мульти-темный удар',
    attackId: 'arcane_burst',
    requiresMasteryNode: 35,
    masteryLabel: 'Мастер дробей',
  },
  {
    id: 'scroll_dark_sigil',
    name: 'Свиток тёмного сигила',
    icon: '💀',
    cost: 230,
    shortDesc: 'Запретная магия · ввод · ошибка = −40 HP',
    attackId: 'dark_sigil',
    requiresMasteryNode: 21,
    masteryLabel: 'Мастер умножения',
  },
]

export function parseSpellScrolls(raw: unknown): SpellScrollInventory {
  const inv = { ...EMPTY_SPELL_SCROLLS }
  if (!raw || typeof raw !== 'object') return inv
  for (const id of SPELL_SCROLL_IDS) {
    const n = (raw as Record<string, unknown>)[id]
    if (typeof n === 'number' && n > 0) inv[id] = Math.floor(n)
  }
  return inv
}

export function spellScrollDef(id: SpellScrollId): SpellScrollDef | undefined {
  return SPELL_SCROLL_DEFS.find(s => s.id === id)
}

export function masteryUnlocked(unlockedNodeIds: number[], nodeId: number): boolean {
  return unlockedNodeIds.includes(nodeId)
}

export function canUseSpellScroll(
  scrollId: SpellScrollId,
  unlockedNodeIds: number[],
  inventory: SpellScrollInventory,
): boolean {
  const def = spellScrollDef(scrollId)
  if (!def) return false
  if (inventory[scrollId] <= 0) return false
  return masteryUnlocked(unlockedNodeIds, def.requiresMasteryNode)
}

export function scrollAttackForBattle(
  scrollId: SpellScrollId,
  attacks: BattleAttack[],
): BattleAttack | undefined {
  const def = spellScrollDef(scrollId)
  if (!def) return undefined
  return attacks.find(a => a.id === def.attackId)
}

export function subtractSpellScroll(
  inv: SpellScrollInventory,
  scrollId: SpellScrollId,
  count = 1,
): SpellScrollInventory {
  return { ...inv, [scrollId]: Math.max(0, inv[scrollId] - count) }
}

export function addSpellScroll(
  inv: SpellScrollInventory,
  scrollId: SpellScrollId,
  count = 1,
): SpellScrollInventory {
  return { ...inv, [scrollId]: inv[scrollId] + count }
}
