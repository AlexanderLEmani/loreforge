import { TOPIC_UNLOCK_LEVEL } from '@/lib/curriculum'
import { championUnlockedForDungeon } from '@/lib/champion-unlock'
import { DUNGEON_TO_TOPIC } from '@/lib/dungeon-topics'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type MonsterSpecial = 'lifesteal' | 'swarm' | 'windup'

export type Monster = {
  id: string
  name: string
  icon: string
  hp: number
  defendTimer: number
  attackDmg: number
  timeoutDmg: number
  trait: string
  /** Чемпион данжа — реже, сильнее, намерения в UI */
  isBoss?: boolean
  special?: MonsterSpecial
  /** Доля урона → лечение врага (0.35 = 35%) */
  lifestealPct?: number
  /** Число быстрых «укусов» в фазе роя */
  swarmStings?: number
}

export type BattleAttack = {
  id: string
  label: string
  icon: string
  desc: string
  dmg: number
  color: string
  difficulty: Difficulty
  /** Пулы вопросов — комбинация тем */
  dungeons: string[]
  minLevel: number
  requiresTopics?: string[]
  cooldown?: number
  kind: 'basic' | 'spell' | 'scroll_spell'
}

export { DUNGEON_TO_TOPIC } from '@/lib/dungeon-topics'

/** Шанс чемпиона данжа при обычном входе (дублируем boss-system — без импорта оттуда). */
const BOSS_ENCOUNTER_CHANCE = 0.28

export const STREAK_CRIT_THRESHOLD = 3
export const STREAK_CRIT_MULT = 1.5

export const DEFAULT_MONSTERS: Monster[] = [
  { id: 'imp', name: 'Бес цифр', icon: '👹', hp: 90, defendTimer: 12, attackDmg: 18, timeoutDmg: 28, trait: 'Быстрый' },
  { id: 'shade', name: 'Тень счёта', icon: '🌑', hp: 110, defendTimer: 15, attackDmg: 22, timeoutDmg: 30, trait: 'Стандарт' },
  { id: 'brute', name: 'Голем ошибок', icon: '🗿', hp: 130, defendTimer: 18, attackDmg: 25, timeoutDmg: 35, trait: 'Медленный, сильный' },
]

export const MONSTERS_BY_DUNGEON: Record<string, Monster[]> = {
  'Пещера сложения': [
    { id: 'slime', name: 'Слизь суммы', icon: '🟢', hp: 85, defendTimer: 15, attackDmg: 18, timeoutDmg: 25, trait: 'Липкий' },
    { id: 'adder', name: 'Скриб-скриб', icon: '📜', hp: 100, defendTimer: 13, attackDmg: 20, timeoutDmg: 28, trait: 'Шустрый' },
    { id: 'golem_add', name: 'Голем плюса', icon: '🗿', hp: 120, defendTimer: 16, attackDmg: 24, timeoutDmg: 32, trait: 'Толстый', isBoss: true },
  ],
  'Пещера вычитания': [
    { id: 'bat', name: 'Бат минус', icon: '🦇', hp: 80, defendTimer: 11, attackDmg: 19, timeoutDmg: 27, trait: 'Очень быстрый' },
    { id: 'debt', name: 'Коллектор', icon: '💸', hp: 105, defendTimer: 14, attackDmg: 22, timeoutDmg: 30, trait: 'Коварный' },
    { id: 'void', name: 'Пожиратель', icon: '🕳️', hp: 115, defendTimer: 15, attackDmg: 23, timeoutDmg: 30, trait: 'Голодный', isBoss: true },
  ],
  'Башня умножения': [
    { id: 'spark', name: 'Искра таблицы', icon: '⚡', hp: 95, defendTimer: 10, attackDmg: 22, timeoutDmg: 32, trait: 'Молниеносный' },
    { id: 'wizard', name: 'Множитель', icon: '🧙', hp: 110, defendTimer: 12, attackDmg: 24, timeoutDmg: 34, trait: 'Маг' },
    { id: 'titan', name: 'Квадратный титан', icon: '⬛', hp: 125, defendTimer: 14, attackDmg: 26, timeoutDmg: 36, trait: 'Массивный', isBoss: true },
  ],
  'Пещера деления': [
    { id: 'split', name: 'Делитель', icon: '✂️', hp: 100, defendTimer: 13, attackDmg: 21, timeoutDmg: 30, trait: 'Рассекающий' },
    { id: 'remain', name: 'Остаточный дух', icon: '👻', hp: 90, defendTimer: 11, attackDmg: 20, timeoutDmg: 29, trait: 'Нервный' },
    { id: 'frac_demon', name: 'Демон частей', icon: '👹', hp: 120, defendTimer: 15, attackDmg: 25, timeoutDmg: 33, trait: 'Злой', isBoss: true },
  ],
  'Храм дробей': [
    { id: 'pie', name: 'Пирог дробей', icon: '🥧', hp: 110, defendTimer: 14, attackDmg: 22, timeoutDmg: 31, trait: 'Липкий' },
    { id: 'half', name: 'Полуэльф половин', icon: '🧝', hp: 100, defendTimer: 12, attackDmg: 21, timeoutDmg: 30, trait: 'Хитрый' },
    { id: 'frac_boss', name: 'Архидробь', icon: '½', hp: 140, defendTimer: 16, attackDmg: 26, timeoutDmg: 35, trait: 'Босс-претендент', isBoss: true },
  ],
  'Рынок процентов': [
    { id: 'merchant', name: 'Торговец скидок', icon: '🛒', hp: 105, defendTimer: 13, attackDmg: 21, timeoutDmg: 30, trait: 'Суетливый' },
    { id: 'tax', name: 'Сборщик процентов', icon: '💰', hp: 115, defendTimer: 14, attackDmg: 23, timeoutDmg: 32, trait: 'Точный' },
    { id: 'pct_boss', name: 'Лорд наценки', icon: '%', hp: 135, defendTimer: 15, attackDmg: 25, timeoutDmg: 34, trait: 'Жадный', isBoss: true },
  ],
  'Арена отрядов': [
    { id: 'pack_rat', name: 'Рынь цифр', icon: '🐀', hp: 55, defendTimer: 10, attackDmg: 14, timeoutDmg: 22, trait: 'Шустрый' },
    { id: 'pack_gob', name: 'Гоблин счёта', icon: '👺', hp: 72, defendTimer: 12, attackDmg: 16, timeoutDmg: 24, trait: 'Парирование · блок заряжает' },
    { id: 'pack_ogre', name: 'Огр суммы', icon: '🦴', hp: 95, defendTimer: 14, attackDmg: 19, timeoutDmg: 28, trait: 'Толстый' },
    { id: 'pack_leech', name: 'Кровопийца', icon: '🧛', hp: 78, defendTimer: 13, attackDmg: 15, timeoutDmg: 22, trait: 'Лайфстил 35%', special: 'lifesteal', lifestealPct: 0.35 },
    { id: 'pack_bee', name: 'Рой пчёл', icon: '🐝', hp: 50, defendTimer: 7, attackDmg: 7, timeoutDmg: 12, trait: 'Рой · 3 примера · один таймер', special: 'swarm', swarmStings: 3 },
    { id: 'pack_cult', name: 'Культист заряда', icon: '🔮', hp: 68, defendTimer: 13, attackDmg: 14, timeoutDmg: 20, trait: 'Заряжает удар · 2 хода', special: 'windup' },
  ],
}

export const BATTLE_ATTACKS: BattleAttack[] = [
  {
    id: 'light', label: 'Кулак', icon: '👊', desc: 'Лёгкий пример из данжа',
    dmg: 15, color: '#3db87a', difficulty: 'easy', dungeons: [], minLevel: 1, kind: 'basic',
  },
  {
    id: 'medium', label: 'Заклятье', icon: '✨', desc: 'Средний пример из данжа',
    dmg: 28, color: '#a99fff', difficulty: 'medium', dungeons: [], minLevel: 1, kind: 'basic',
  },
  {
    id: 'charged_strike', label: 'Удар напором', icon: '⚡', desc: 'Средний пример · базовая техника академии',
    dmg: 34, color: '#7b6cff', difficulty: 'medium', dungeons: [], minLevel: 1, cooldown: 2, kind: 'basic',
  },
  {
    id: 'twin_strike', label: 'Двойной удар', icon: '➕➖', desc: 'Сложение + вычитание',
    dmg: 24, color: '#3db87a', difficulty: 'easy', dungeons: ['Пещера сложения', 'Пещера вычитания'],
    minLevel: 1, requiresTopics: ['add', 'sub'], kind: 'scroll_spell',
  },
  {
    id: 'fireball', label: 'Огненный шар', icon: '🔥', desc: 'Умножение + деление',
    dmg: 38, color: '#e0bc6a', difficulty: 'medium', dungeons: ['Башня умножения', 'Пещера деления'],
    minLevel: 2, requiresTopics: ['mul', 'div'], cooldown: 2, kind: 'scroll_spell',
  },
  {
    id: 'arcane_burst', label: 'Арканический взрыв', icon: '🌀', desc: 'Сложение + вычитание + умножение',
    dmg: 52, color: '#b8aeff', difficulty: 'hard', dungeons: ['Пещера сложения', 'Пещера вычитания', 'Башня умножения'],
    minLevel: 3, requiresTopics: ['add', 'sub', 'mul'], cooldown: 3, kind: 'scroll_spell',
  },
  {
    id: 'storm_lance', label: 'Штормовой ланс', icon: '⚔️', desc: 'Умножение + деление · мощный',
    dmg: 46, color: '#7b6cff', difficulty: 'hard', dungeons: ['Башня умножения', 'Пещера деления'],
    minLevel: 2, requiresTopics: ['mul', 'div'], cooldown: 2, kind: 'scroll_spell',
  },
  {
    id: 'dark_sigil', label: 'Тёмный сигил', icon: '💀', desc: 'Запретная магия · ввод · ошибка = −40 HP',
    dmg: 50, color: '#e05555', difficulty: 'hard', dungeons: [], minLevel: 2, requiresTopics: ['mul', 'div'],
    cooldown: 3, kind: 'scroll_spell',
  },
]

export type ScrollBattleEffect = 'hint' | 'power' | 'shield' | 'heal'

export function getUnlockedTopics(userLevel: number): string[] {
  return Object.entries(TOPIC_UNLOCK_LEVEL)
    .filter(([, minLv]) => userLevel >= minLv)
    .map(([topic]) => topic)
}

function pickMonsterFromPool(pool: Monster[], dungeonWins = 0): Monster {
  const bosses = pool.filter(m => m.isBoss)
  const normals = pool.filter(m => !m.isBoss)
  const canChampion = championUnlockedForDungeon(dungeonWins)

  if (bosses.length > 0 && canChampion && Math.random() < BOSS_ENCOUNTER_CHANCE) {
    return bosses[Math.floor(Math.random() * bosses.length)]
  }
  if (normals.length > 0) {
    return normals[Math.floor(Math.random() * normals.length)]
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickMonster(dungeonName: string, dungeonWins = 0): Monster {
  const pool = MONSTERS_BY_DUNGEON[dungeonName] || DEFAULT_MONSTERS
  return pickMonsterFromPool(pool, dungeonWins)
}

export function getAttacksForBattle(
  userLevel: number,
  currentDungeon: string,
  unlockedTopics: string[],
): BattleAttack[] {
  return BATTLE_ATTACKS.filter(a => {
    if (a.kind !== 'basic') return false
    if (userLevel < a.minLevel) return false
    if (a.requiresTopics && !a.requiresTopics.every(t => unlockedTopics.includes(t))) return false
    return true
  }).map(a => ({
    ...a,
    dungeons: [currentDungeon],
  }))
}

export function isTypedScrollAttack(attackId: string): boolean {
  return attackId === 'dark_sigil'
}

export const SCROLL_EFFECT_LABELS: Record<ScrollBattleEffect, { label: string; icon: string; desc: string }> = {
  hint: { label: 'Подсказка', icon: '💡', desc: 'Сузит выбор: 2 из 4 вариантов' },
  power: { label: 'Мощь', icon: '⚡', desc: '×2 урон следующей атаки' },
  shield: { label: 'Щит', icon: '🛡', desc: 'Блокирует удар монстра' },
  heal: { label: 'Зелье жизни', icon: '🧪', desc: '+40 HP в бою' },
}

export const HEAL_POTION_HP = 40
