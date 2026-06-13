import type { BattleAttack } from '@/lib/battle-config'
import { DUNGEON_TO_TOPIC } from '@/lib/battle-config'

export type MathTopic = 'add' | 'sub' | 'mul' | 'div' | 'frac' | 'pct'

export type DefendBehavior = 'normal' | 'stance_on_block' | 'rage_on_block'

export type MonsterProfile = {
  weakTopics: MathTopic[]
  resistTopics: MathTopic[]
  defendBehavior: DefendBehavior
  /** Ярость при HP < 40% */
  enrage?: boolean
  /** Подсказка для игрока */
  tip: string
  stanceMax?: number
}

const TOPIC_LABEL: Record<MathTopic, string> = {
  add: 'сложение',
  sub: 'вычитание',
  mul: 'умножение',
  div: 'деление',
  frac: 'дроби',
  pct: 'проценты',
}

/** Темы, которые покрывает атака */
export function attackTopics(attack: BattleAttack, dungeonName: string): MathTopic[] {
  if (attack.id === 'twin_strike') return ['add', 'sub']
  if (attack.id === 'fireball' || attack.id === 'storm_lance') return ['mul', 'div']
  if (attack.id === 'arcane_burst') return ['add', 'sub', 'mul']

  if (attack.kind === 'basic') {
    const t = DUNGEON_TO_TOPIC[dungeonName]
    return t ? [t as MathTopic] : []
  }

  const topics: MathTopic[] = []
  for (const d of attack.dungeons) {
    const t = DUNGEON_TO_TOPIC[d]
    if (t) topics.push(t as MathTopic)
  }
  return topics
}

export function topicDamageMultiplier(
  attack: BattleAttack,
  dungeonName: string,
  profile: MonsterProfile,
): { mult: number; label: string | null } {
  const topics = attackTopics(attack, dungeonName)
  if (!topics.length) return { mult: 1, label: null }

  const weak = topics.some(t => profile.weakTopics.includes(t))
  const resist = topics.some(t => profile.resistTopics.includes(t))

  if (weak && !resist) {
    const names = profile.weakTopics.filter(t => topics.includes(t)).map(t => TOPIC_LABEL[t])
    return { mult: 1.3, label: `▲ ${names.join(', ')}` }
  }
  if (resist && !weak) {
    const names = profile.resistTopics.filter(t => topics.includes(t)).map(t => TOPIC_LABEL[t])
    return { mult: 0.75, label: `▼ ${names.join(', ')}` }
  }
  return { mult: 1, label: null }
}

export function monsterProfile(monsterId: string): MonsterProfile {
  return MONSTER_PROFILES[monsterId] ?? DEFAULT_PROFILE
}

export const STANCE_ATTACK_PER_STACK = 5
export const STANCE_TIMEOUT_PER_STACK = 3
export const RAGE_CHARGE_PER_BLOCK = 0.35
export const RAGE_CHARGE_MAX = 2

const DEFAULT_PROFILE: MonsterProfile = {
  weakTopics: [],
  resistTopics: [],
  defendBehavior: 'normal',
  tip: 'Стандартный враг — блокируй верным ответом.',
}

/** Профили по id монстра — основа для будущих стратегий */
export const MONSTER_PROFILES: Record<string, MonsterProfile> = {
  // Пещера сложения
  slime: {
    weakTopics: ['add'],
    resistTopics: ['sub'],
    defendBehavior: 'normal',
    tip: 'Слаб к сложению — кулак/заклинания +.',
  },
  adder: {
    weakTopics: ['add'],
    resistTopics: [],
    defendBehavior: 'stance_on_block',
    stanceMax: 4,
    tip: 'Блокировка копит стойку — добивай быстро или не блокируй.',
  },
  golem_add: {
    weakTopics: ['add'],
    resistTopics: ['mul'],
    defendBehavior: 'normal',
    enrage: true,
    tip: 'Толстый · ярость ниже 40% HP.',
  },

  // Пещера вычитания
  bat: {
    weakTopics: ['sub'],
    resistTopics: ['add'],
    defendBehavior: 'rage_on_block',
    tip: 'Уклоняйся (неверный ответ) — блок заряжает его удар!',
  },
  debt: {
    weakTopics: ['sub'],
    resistTopics: [],
    defendBehavior: 'normal',
    tip: 'Коварный — бей вычитанием.',
  },
  void: {
    weakTopics: ['sub'],
    resistTopics: ['add'],
    defendBehavior: 'stance_on_block',
    stanceMax: 3,
    tip: 'Голодный · стойка растёт при блоке.',
  },

  // Башня умножения
  spark: {
    weakTopics: ['mul'],
    resistTopics: ['div'],
    defendBehavior: 'normal',
    tip: 'Молниеносный · слаб к умножению.',
  },
  wizard: {
    weakTopics: ['mul'],
    resistTopics: ['div'],
    defendBehavior: 'normal',
    tip: 'Маг умножения — Огненный шар / × таблица.',
  },
  titan: {
    weakTopics: ['mul'],
    resistTopics: ['add'],
    defendBehavior: 'stance_on_block',
    stanceMax: 3,
    enrage: true,
    tip: 'Массивный · стойка + ярость на финише.',
  },

  // Пещера деления
  split: {
    weakTopics: ['div'],
    resistTopics: ['mul'],
    defendBehavior: 'normal',
    tip: 'Рассекающий — бей делением.',
  },
  remain: {
    weakTopics: ['div'],
    resistTopics: ['mul'],
    defendBehavior: 'rage_on_block',
    tip: 'Нервный · не блокируй — уклоняйся!',
  },
  frac_demon: {
    weakTopics: ['div'],
    resistTopics: ['mul'],
    defendBehavior: 'stance_on_block',
    stanceMax: 3,
    tip: 'Злой · стойка при блоке, слаб к ÷.',
  },

  // Храм дробей
  pie: {
    weakTopics: ['frac'],
    resistTopics: ['add'],
    defendBehavior: 'stance_on_block',
    stanceMax: 3,
    tip: 'Липкий · дроби и быстрый добив.',
  },
  half: {
    weakTopics: ['frac'],
    resistTopics: ['mul'],
    defendBehavior: 'rage_on_block',
    tip: 'Хитрый · уклонение лучше блока.',
  },
  frac_boss: {
    weakTopics: ['frac'],
    resistTopics: ['mul'],
    defendBehavior: 'normal',
    enrage: true,
    tip: 'Босс дробей · ярость + слаб к дробям.',
  },

  // Рынок процентов
  merchant: {
    weakTopics: ['pct'],
    resistTopics: ['sub'],
    defendBehavior: 'normal',
    tip: 'Суетливый · слаб к процентам.',
  },
  tax: {
    weakTopics: ['pct'],
    resistTopics: [],
    defendBehavior: 'stance_on_block',
    stanceMax: 4,
    tip: 'Точный · стойка при каждом блоке.',
  },
  pct_boss: {
    weakTopics: ['pct'],
    resistTopics: ['add'],
    defendBehavior: 'normal',
    enrage: true,
    tip: 'Жадный босс · % атаки + ярость.',
  },

  // Fallback
  imp: { weakTopics: ['add'], resistTopics: [], defendBehavior: 'normal', tip: 'Бес цифр.' },
  shade: { weakTopics: [], resistTopics: [], defendBehavior: 'stance_on_block', stanceMax: 2, tip: 'Тень · стойка при блоке.' },
  brute: { weakTopics: [], resistTopics: ['add'], defendBehavior: 'normal', enrage: true, tip: 'Голем · ярость на финише.' },
}

export function stanceCap(profile: MonsterProfile): number {
  return profile.stanceMax ?? 3
}

export function applyStanceToMonster(
  base: { attackDmg: number; timeoutDmg: number },
  stacks: number,
): { attackDmg: number; timeoutDmg: number } {
  if (stacks <= 0) return base
  return {
    attackDmg: base.attackDmg + stacks * STANCE_ATTACK_PER_STACK,
    timeoutDmg: base.timeoutDmg + stacks * STANCE_TIMEOUT_PER_STACK,
  }
}

export function rageChargeMultiplier(stacks: number): number {
  return 1 + Math.min(stacks, RAGE_CHARGE_MAX) * RAGE_CHARGE_PER_BLOCK
}
