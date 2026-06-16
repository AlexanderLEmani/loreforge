import type { BattleAttack } from '@/lib/battle-config'
import { BATTLE_ATTACKS } from '@/lib/battle-config'
import { LECTURE_NUMS } from '@/lib/college-lectures'
import { lectureLevelForUser } from '@/lib/college-lectures'

/** Боевые заклинания — выучить в лавке один раз, использовать в бою с кулдауном */
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

/** @deprecated счётчики расходников — только для миграции старых сохранений */
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
  /** Лекция в Коллегии, после которой можно покупать */
  lectureLevel: number
}

export const SPELL_SCROLL_DEFS: SpellScrollDef[] = [
  {
    id: 'scroll_twin_strike',
    name: 'Двойной удар',
    icon: '➕➖',
    cost: 90,
    shortDesc: 'Сложение + вычитание · кулдаун как у техники',
    attackId: 'twin_strike',
    requiresMasteryNode: 7,
    masteryLabel: 'Мастер прибавления',
    lectureLevel: 1,
  },
  {
    id: 'scroll_fireball',
    name: 'Огненный шар',
    icon: '🔥',
    cost: 140,
    shortDesc: 'Умножение + деление · мощная атака',
    attackId: 'fireball',
    requiresMasteryNode: 21,
    masteryLabel: 'Мастер умножения',
    lectureLevel: 2,
  },
  {
    id: 'scroll_storm_lance',
    name: 'Штормовой ланс',
    icon: '⚔️',
    cost: 155,
    shortDesc: '× и ÷ · усиленный удар',
    attackId: 'storm_lance',
    requiresMasteryNode: 28,
    masteryLabel: 'Мастер деления',
    lectureLevel: 3,
  },
  {
    id: 'scroll_arcane_burst',
    name: 'Арканический взрыв',
    icon: '🌀',
    cost: 195,
    shortDesc: 'Несколько тем · тяжёлый урон',
    attackId: 'arcane_burst',
    requiresMasteryNode: 35,
    masteryLabel: 'Мастер дробей',
    lectureLevel: 3,
  },
  {
    id: 'scroll_dark_sigil',
    name: 'Тёмный сигил',
    icon: '💀',
    cost: 230,
    shortDesc: 'Ввод ответа · ошибка = −40 HP',
    attackId: 'dark_sigil',
    requiresMasteryNode: 21,
    masteryLabel: 'Мастер умножения',
    lectureLevel: 2,
  },
]

export type LearnedSpells = SpellScrollId[]

export type SpellPurchaseGate =
  | { ok: true }
  | { ok: false; reason: 'learned' | 'lecture' | 'mastery' | 'gold'; message: string }

/** Читает выученные заклинания: массив learned_spells или legacy-счётчики spell_scrolls */
export function parseLearnedSpells(raw: unknown, legacyCounts?: unknown): LearnedSpells {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter((id): id is SpellScrollId =>
      typeof id === 'string' && SPELL_SCROLL_IDS.includes(id as SpellScrollId),
    )
  }
  const legacy = legacyCounts ?? (Array.isArray(raw) ? undefined : raw)
  if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
    const learned: SpellScrollId[] = []
    for (const id of SPELL_SCROLL_IDS) {
      const n = (legacy as Record<string, unknown>)[id]
      if (typeof n === 'number' && n > 0) learned.push(id)
    }
    return learned
  }
  return []
}

/** @deprecated используй parseLearnedSpells */
export function parseSpellScrolls(raw: unknown): SpellScrollInventory {
  const inv = { ...EMPTY_SPELL_SCROLLS }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return inv
  for (const id of SPELL_SCROLL_IDS) {
    const n = (raw as Record<string, unknown>)[id]
    if (typeof n === 'number' && n > 0) inv[id] = Math.floor(n)
  }
  return inv
}

export function parseCompletedLectures(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 4)
}

export function isLectureCompleteForSpells(
  lectureLevel: number,
  userLevel: number,
  completed: number[],
): boolean {
  if (lectureLevel < lectureLevelForUser(userLevel)) return true
  return completed.includes(lectureLevel)
}

export function spellScrollDef(id: SpellScrollId): SpellScrollDef | undefined {
  return SPELL_SCROLL_DEFS.find(s => s.id === id)
}

export function isSpellLearned(learned: LearnedSpells, id: SpellScrollId): boolean {
  return learned.includes(id)
}

export function masteryUnlocked(unlockedNodeIds: number[], nodeId: number): boolean {
  return unlockedNodeIds.includes(nodeId)
}

export function spellsForMasteryNode(nodeId: number): SpellScrollDef[] {
  return SPELL_SCROLL_DEFS.filter(s => s.requiresMasteryNode === nodeId)
}

export function spellPurchaseGate(
  def: SpellScrollDef,
  ctx: {
    learned: LearnedSpells
    unlockedNodeIds: number[]
    completedLectures: number[]
    userLevel: number
    gold: number
  },
): SpellPurchaseGate {
  if (isSpellLearned(ctx.learned, def.id)) {
    return { ok: false, reason: 'learned', message: 'Заклинание уже выучено' }
  }
  if (!isLectureCompleteForSpells(def.lectureLevel, ctx.userLevel, ctx.completedLectures)) {
    const num = LECTURE_NUMS[def.lectureLevel - 1] ?? String(def.lectureLevel)
    return { ok: false, reason: 'lecture', message: `Прочитай лекцию ${num} в Коллегии` }
  }
  if (!masteryUnlocked(ctx.unlockedNodeIds, def.requiresMasteryNode)) {
    return { ok: false, reason: 'mastery', message: `Открой «${def.masteryLabel}» на древе навыков` }
  }
  if (ctx.gold < def.cost) {
    return { ok: false, reason: 'gold', message: 'Недостаточно золота' }
  }
  return { ok: true }
}

export function scrollAttackForBattle(
  scrollId: SpellScrollId,
  attacks: BattleAttack[] = BATTLE_ATTACKS,
): BattleAttack | undefined {
  const def = spellScrollDef(scrollId)
  if (!def) return undefined
  return attacks.find(a => a.id === def.attackId)
}

export function getLearnedSpellAttacks(
  userLevel: number,
  currentDungeon: string,
  unlockedTopics: string[],
  learned: LearnedSpells,
  unlockedNodeIds: number[],
): BattleAttack[] {
  return BATTLE_ATTACKS.filter(a => {
    if (a.kind !== 'scroll_spell') return false
    const def = SPELL_SCROLL_DEFS.find(s => s.attackId === a.id)
    if (!def || !isSpellLearned(learned, def.id)) return false
    if (!masteryUnlocked(unlockedNodeIds, def.requiresMasteryNode)) return false
    if (userLevel < a.minLevel) return false
    if (a.requiresTopics && !a.requiresTopics.every(t => unlockedTopics.includes(t))) return false
    return true
  }).map(a => ({
    ...a,
    dungeons: [currentDungeon],
    desc: a.desc.replace(/^Свиток · /, ''),
  }))
}

/** @deprecated */
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

/** @deprecated */
export function subtractSpellScroll(
  inv: SpellScrollInventory,
  scrollId: SpellScrollId,
  count = 1,
): SpellScrollInventory {
  return { ...inv, [scrollId]: Math.max(0, inv[scrollId] - count) }
}

/** @deprecated */
export function addSpellScroll(
  inv: SpellScrollInventory,
  scrollId: SpellScrollId,
  count = 1,
): SpellScrollInventory {
  return { ...inv, [scrollId]: inv[scrollId] + count }
}
