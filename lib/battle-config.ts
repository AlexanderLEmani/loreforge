import { TOPIC_UNLOCK_LEVEL } from '@/lib/curriculum'

export { TOPIC_UNLOCK_LEVEL }

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Monster = {
  id: string
  name: string
  icon: string
  hp: number
  defendTimer: number
  attackDmg: number
  timeoutDmg: number
  trait: string
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
  kind: 'basic' | 'spell'
}

export const DUNGEON_TO_TOPIC: Record<string, string> = {
  'Пещера сложения': 'add',
  'Пещера вычитания': 'sub',
  'Башня умножения': 'mul',
  'Пещера деления': 'div',
  'Храм дробей': 'frac',
}

export const BOSS_ENRAGE_HP_RATIO = 0.4
export const BOSS_ENRAGE_BONUS_HP = 45
export const BOSS_ENRAGE_TIMER_DELTA = -3

export const STREAK_CRIT_THRESHOLD = 3
export const STREAK_CRIT_MULT = 1.5

const DEFAULT_MONSTERS: Monster[] = [
  { id: 'imp', name: 'Бес цифр', icon: '👹', hp: 90, defendTimer: 12, attackDmg: 18, timeoutDmg: 28, trait: 'Быстрый' },
  { id: 'shade', name: 'Тень счёта', icon: '🌑', hp: 110, defendTimer: 15, attackDmg: 22, timeoutDmg: 30, trait: 'Стандарт' },
  { id: 'brute', name: 'Голем ошибок', icon: '🗿', hp: 130, defendTimer: 18, attackDmg: 25, timeoutDmg: 35, trait: 'Медленный, сильный' },
]

export const MONSTERS_BY_DUNGEON: Record<string, Monster[]> = {
  'Пещера сложения': [
    { id: 'slime', name: 'Слизь суммы', icon: '🟢', hp: 85, defendTimer: 15, attackDmg: 18, timeoutDmg: 25, trait: 'Липкий' },
    { id: 'adder', name: 'Скриб-скриб', icon: '📜', hp: 100, defendTimer: 13, attackDmg: 20, timeoutDmg: 28, trait: 'Шустрый' },
    { id: 'golem_add', name: 'Голем плюса', icon: '🗿', hp: 120, defendTimer: 16, attackDmg: 24, timeoutDmg: 32, trait: 'Толстый' },
  ],
  'Пещера вычитания': [
    { id: 'bat', name: 'Бат минус', icon: '🦇', hp: 80, defendTimer: 11, attackDmg: 19, timeoutDmg: 27, trait: 'Очень быстрый' },
    { id: 'debt', name: 'Коллектор', icon: '💸', hp: 105, defendTimer: 14, attackDmg: 22, timeoutDmg: 30, trait: 'Коварный' },
    { id: 'void', name: 'Пожиратель', icon: '🕳️', hp: 115, defendTimer: 15, attackDmg: 23, timeoutDmg: 30, trait: 'Голодный' },
  ],
  'Башня умножения': [
    { id: 'spark', name: 'Искра таблицы', icon: '⚡', hp: 95, defendTimer: 10, attackDmg: 22, timeoutDmg: 32, trait: 'Молниеносный' },
    { id: 'wizard', name: 'Множитель', icon: '🧙', hp: 110, defendTimer: 12, attackDmg: 24, timeoutDmg: 34, trait: 'Маг' },
    { id: 'titan', name: 'Квадратный титан', icon: '⬛', hp: 125, defendTimer: 14, attackDmg: 26, timeoutDmg: 36, trait: 'Массивный' },
  ],
  'Пещера деления': [
    { id: 'split', name: 'Делитель', icon: '✂️', hp: 100, defendTimer: 13, attackDmg: 21, timeoutDmg: 30, trait: 'Рассекающий' },
    { id: 'remain', name: 'Остаточный дух', icon: '👻', hp: 90, defendTimer: 11, attackDmg: 20, timeoutDmg: 29, trait: 'Нервный' },
    { id: 'frac_demon', name: 'Демон частей', icon: '👹', hp: 120, defendTimer: 15, attackDmg: 25, timeoutDmg: 33, trait: 'Злой' },
  ],
  'Храм дробей': [
    { id: 'pie', name: 'Пирог дробей', icon: '🥧', hp: 110, defendTimer: 14, attackDmg: 22, timeoutDmg: 31, trait: 'Липкий' },
    { id: 'half', name: 'Полуэльф половин', icon: '🧝', hp: 100, defendTimer: 12, attackDmg: 21, timeoutDmg: 30, trait: 'Хитрый' },
    { id: 'frac_boss', name: 'Архидробь', icon: '½', hp: 140, defendTimer: 16, attackDmg: 26, timeoutDmg: 35, trait: 'Босс-претендент' },
  ],
}

export const BOSS_VARIANTS: Record<string, Partial<Monster>> = {
  default: { name: 'Яростная тень', icon: '👺', trait: 'Ярость · быстрый и сильный' },
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
    id: 'heavy', label: 'Тёмная магия', icon: '💀', desc: 'Сложный пример · ввод ответа · ошибка = -40 HP',
    dmg: 50, color: '#e05555', difficulty: 'hard', dungeons: [], minLevel: 1, cooldown: 3, kind: 'basic',
  },
  {
    id: 'twin_strike', label: 'Двойной удар', icon: '➕➖', desc: 'Сложение + вычитание',
    dmg: 24, color: '#3db87a', difficulty: 'easy', dungeons: ['Пещера сложения', 'Пещера вычитания'],
    minLevel: 1, requiresTopics: ['add', 'sub'], kind: 'spell',
  },
  {
    id: 'fireball', label: 'Огненный шар', icon: '🔥', desc: 'Умножение + деление',
    dmg: 38, color: '#e0bc6a', difficulty: 'medium', dungeons: ['Башня умножения', 'Пещера деления'],
    minLevel: 2, requiresTopics: ['mul', 'div'], cooldown: 2, kind: 'spell',
  },
  {
    id: 'arcane_burst', label: 'Арканический взрыв', icon: '🌀', desc: 'Сложение + вычитание + умножение',
    dmg: 52, color: '#b8aeff', difficulty: 'hard', dungeons: ['Пещера сложения', 'Пещера вычитания', 'Башня умножения'],
    minLevel: 3, requiresTopics: ['add', 'sub', 'mul'], cooldown: 3, kind: 'spell',
  },
  {
    id: 'storm_lance', label: 'Штормовой ланс', icon: '⚔️', desc: 'Умножение + деление · мощный',
    dmg: 46, color: '#7b6cff', difficulty: 'hard', dungeons: ['Башня умножения', 'Пещера деления'],
    minLevel: 2, requiresTopics: ['mul', 'div'], cooldown: 2, kind: 'spell',
  },
]

export type ScrollBattleEffect = 'hint' | 'power' | 'shield'

export function getUnlockedTopics(userLevel: number): string[] {
  return Object.entries(TOPIC_UNLOCK_LEVEL)
    .filter(([, minLv]) => userLevel >= minLv)
    .map(([topic]) => topic)
}

export function pickMonster(dungeonName: string): Monster {
  const pool = MONSTERS_BY_DUNGEON[dungeonName] || DEFAULT_MONSTERS
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getAttacksForBattle(
  userLevel: number,
  currentDungeon: string,
  unlockedTopics: string[],
): BattleAttack[] {
  return BATTLE_ATTACKS.filter(a => {
    if (userLevel < a.minLevel) return false
    if (a.requiresTopics && !a.requiresTopics.every(t => unlockedTopics.includes(t))) return false
    return true
  }).map(a => ({
    ...a,
    dungeons: a.kind === 'basic' ? [currentDungeon] : a.dungeons,
  }))
}

export const SCROLL_EFFECT_LABELS: Record<ScrollBattleEffect, { label: string; icon: string; desc: string }> = {
  hint: { label: 'Подсказка', icon: '💡', desc: 'Подсветит верный ответ' },
  power: { label: 'Мощь', icon: '⚡', desc: '×2 урон следующей атаки' },
  shield: { label: 'Щит', icon: '🛡', desc: 'Блокирует удар монстра' },
}
