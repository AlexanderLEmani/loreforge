export type MulTierId = 'basic' | 'teens'

export const MUL_TIERS: Record<
  MulTierId,
  { id: MulTierId; label: string; subtitle: string; min: number; max: number; easyRows: number[] }
> = {
  basic: {
    id: 'basic',
    label: '1–10',
    subtitle: 'Классическая таблица Пифагора',
    min: 1,
    max: 10,
    easyRows: [2, 5, 10],
  },
  teens: {
    id: 'teens',
    label: '11–20',
    subtitle: 'Десятки — прокачка после базы',
    min: 11,
    max: 20,
    easyRows: [11, 12, 20],
  },
}

/** @deprecated используй MUL_TIERS.basic */
export const MUL_MIN = MUL_TIERS.basic.min
/** @deprecated используй MUL_TIERS.basic */
export const MUL_MAX = MUL_TIERS.basic.max

export const MUL_SPRINT_SECONDS = 180
/** Цель ачивки «Спринтер таблицы» */
export const MUL_SPRINT_ACHIEVEMENT_CORRECT = 60
export const MUL_SPRINT_ACHIEVEMENT_ACCURACY = 90

export type MulPair = { a: number; b: number; product: number }

export type MulTableModeId = 'easy' | 'row' | 'squares' | 'weak' | 'full' | 'sprint' | 'cell'

export type CellStat = { correct: number; total: number }

export const MUL_TABLE_MODES: {
  id: MulTableModeId
  name: string
  icon: string
  desc: string
  sessionLabel: string
}[] = [
  {
    id: 'easy',
    name: 'Лёгкие ряды',
    icon: '🎯',
    desc: 'Удобные ряды с лайфхаками, потом случайные ячейки.',
    sessionLabel: '15 примеров',
  },
  {
    id: 'row',
    name: 'Один ряд',
    icon: '📏',
    desc: 'Зафиксируй один множитель — все комбинации с числом.',
    sessionLabel: '10 примеров',
  },
  {
    id: 'squares',
    name: 'Квадраты',
    icon: '🟧',
    desc: 'Диагональ: n² для каждого числа диапазона.',
    sessionLabel: '10 квадратов',
  },
  {
    id: 'weak',
    name: 'Слабые ячейки',
    icon: '🔴',
    desc: 'То, что ошибаешь или ещё не трогал.',
    sessionLabel: '15 примеров',
  },
  {
    id: 'full',
    name: 'Вся сетка',
    icon: '🗺️',
    desc: '20 случайных пар · без подсказок.',
    sessionLabel: '20 примеров',
  },
  {
    id: 'sprint',
    name: 'Спринт 3 мин',
    icon: '⚡',
    desc: `Сколько верных за 3 мин · ачивка от ${MUL_SPRINT_ACHIEVEMENT_CORRECT}`,
    sessionLabel: '3 минуты',
  },
]

const ROW_HACKS_BASIC: Record<number, string> = {
  1: '×1 — число не меняется.',
  2: '×2 — удвой: 7+7, не считай по одному.',
  3: '×3 — тройное сложение или «перепрыгни» через десяток.',
  4: '×4 — удвой дважды: ×2, ещё раз ×2.',
  5: '×5 — половина от ×10: 7×5 = 70÷2.',
  6: '×6 — ×5 плюс ещё одно: 7×6 = 7×5 + 7.',
  7: '×7 — ×5 + ×2 или выучи ряд как песенку.',
  8: '×8 — ×4 два раза или ×10 − ×2.',
  9: '×9 — десятки минус число: 7×9 = 70−7. Пальцы тоже работают.',
  10: '×10 — прибавь ноль справа.',
}

const ROW_HACKS_TEENS: Record<number, string> = {
  11: '×11 — для 1–9: цифра повторяется (7×11 = 77). Для 10+: сложи соседние цифры посередине.',
  12: '×12 — ×10 + ×2: 7×12 = 70 + 14.',
  13: '×13 — ×10 + ×3.',
  14: '×14 — ×10 + ×4 или ×7 ×2.',
  15: '×15 — ×10 + ×5 или половина от ×30.',
  16: '×16 — ×10 + ×6 или ×8 ×2.',
  17: '×17 — ×10 + ×7.',
  18: '×18 — ×20 − ×2 или ×9 ×2.',
  19: '×19 — ×20 − число.',
  20: '×20 — ×10 ×2: удвой «десяток».',
}

const SQUARE_HINTS_BASIC: Record<number, string> = {
  1: '1² = 1',
  2: '2² = 4 — пара двойки',
  3: '3² = 9 — как 3×3 на пальцах',
  4: '4² = 16 — 4×4',
  5: '5² = 25 — четверть сотни',
  6: '6² = 36 — между 25 и 49',
  7: '7² = 49 — «семь семёрок»',
  8: '8² = 64 — шестьдесят четыре',
  9: '9² = 81 — девять девяток',
  10: '10² = 100 — целая сотка',
}

const SQUARE_HINTS_TEENS: Record<number, string> = {
  11: '11² = 121',
  12: '12² = 144 — «12 дюжин»',
  13: '13² = 169',
  14: '14² = 196',
  15: '15² = 225 — четверть тысячи',
  16: '16² = 256',
  17: '17² = 289',
  18: '18² = 324',
  19: '19² = 361',
  20: '20² = 400 — две сотни дважды',
}

export function tierConfig(tier: MulTierId = 'basic') {
  return MUL_TIERS[tier]
}

export function tierSpan(tier: MulTierId = 'basic'): string {
  const t = tierConfig(tier)
  return `${t.min}–${t.max}`
}

export function pairKey(a: number, b: number): string {
  return `${a}x${b}`
}

export function allPairs(tier: MulTierId = 'basic'): MulPair[] {
  const { min, max } = tierConfig(tier)
  const out: MulPair[] = []
  for (let a = min; a <= max; a++) {
    for (let b = min; b <= max; b++) {
      out.push({ a, b, product: a * b })
    }
  }
  return out
}

export function makePair(a: number, b: number): MulPair {
  return { a, b, product: a * b }
}

function rowHacks(tier: MulTierId): Record<number, string> {
  return tier === 'teens' ? ROW_HACKS_TEENS : ROW_HACKS_BASIC
}

function squareHints(tier: MulTierId): Record<number, string> {
  return tier === 'teens' ? SQUARE_HINTS_TEENS : SQUARE_HINTS_BASIC
}

export function rowLifehack(n: number, tier: MulTierId = 'basic'): string | null {
  return rowHacks(tier)[n] ?? null
}

export function squareHint(n: number, tier: MulTierId = 'basic'): string | null {
  return squareHints(tier)[n] ?? null
}

export function symmetryTip(a: number, b: number, tier: MulTierId = 'basic'): string | null {
  if (a === b) return squareHint(a, tier)
  return `Зеркало: ${b}×${a} — тот же ответ. Выучи один раз.`
}

export function tipForPair(a: number, b: number, tier: MulTierId = 'basic'): string {
  if (a === b) return squareHint(a, tier) ?? rowLifehack(a, tier) ?? symmetryTip(a, b, tier) ?? ''
  const hackA = rowLifehack(a, tier)
  const hackB = rowLifehack(b, tier)
  if (hackA && a <= b) return hackA
  if (hackB) return hackB
  if (tier === 'teens') {
    const big = Math.max(a, b)
    const small = Math.min(a, b)
    if (big >= 11) return `×10 + ×${small - 10}: ${big}×${small} = ${big * 10} + ${big * (small - 10)}`
  }
  return symmetryTip(a, b, tier) ?? ''
}

const STATS_KEY = (userId: string, tier: MulTierId) => `loreheim_mul_table_${tier}_${userId}`

export function loadMulStats(userId: string, tier: MulTierId = 'basic'): Record<string, CellStat> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STATS_KEY(userId, tier))
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CellStat>
  } catch {
    return {}
  }
}

export function saveMulStats(userId: string, stats: Record<string, CellStat>, tier: MulTierId = 'basic') {
  if (typeof window === 'undefined') return
  localStorage.setItem(STATS_KEY(userId, tier), JSON.stringify(stats))
}

export function recordMulStat(
  userId: string,
  a: number,
  b: number,
  correct: boolean,
  tier: MulTierId = 'basic',
): Record<string, CellStat> {
  const stats = loadMulStats(userId, tier)
  const key = pairKey(a, b)
  const prev = stats[key] ?? { correct: 0, total: 0 }
  stats[key] = {
    correct: prev.correct + (correct ? 1 : 0),
    total: prev.total + 1,
  }
  saveMulStats(userId, stats, tier)
  return stats
}

export function cellAccuracy(stat: CellStat | undefined): number | null {
  if (!stat || stat.total === 0) return null
  return Math.round((stat.correct / stat.total) * 100)
}

export function rowProgress(stats: Record<string, CellStat>, row: number, tier: MulTierId = 'basic'): number {
  const { min, max } = tierConfig(tier)
  const span = max - min + 1
  let mastered = 0
  for (let b = min; b <= max; b++) {
    const acc = cellAccuracy(stats[pairKey(row, b)])
    if (acc !== null && acc >= 90 && stats[pairKey(row, b)]!.total >= 2) mastered++
  }
  return Math.round((mastered / span) * 100)
}

export function tierProgress(stats: Record<string, CellStat>, tier: MulTierId = 'basic'): number {
  const pairs = allPairs(tier)
  let mastered = 0
  for (const p of pairs) {
    const s = stats[pairKey(p.a, p.b)]
    const acc = cellAccuracy(s)
    if (acc !== null && acc >= 90 && s!.total >= 2) mastered++
  }
  return Math.round((mastered / pairs.length) * 100)
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pairsForRow(row: number, tier: MulTierId): MulPair[] {
  const { min, max } = tierConfig(tier)
  return Array.from({ length: max - min + 1 }, (_, i) => makePair(row, i + min))
}

function squarePairs(tier: MulTierId): MulPair[] {
  const { min, max } = tierConfig(tier)
  return Array.from({ length: max - min + 1 }, (_, i) => makePair(i + min, i + min))
}

function pairsForEasyRows(tier: MulTierId): MulPair[] {
  const { min, max } = tierConfig(tier)
  const rows = tierConfig(tier).easyRows
  const out: MulPair[] = []
  for (const row of rows) {
    for (let b = min; b <= max; b++) out.push(makePair(row, b))
  }
  return out
}

export function weakPairs(stats: Record<string, CellStat>, tier: MulTierId = 'basic', limit = 20): MulPair[] {
  const all = allPairs(tier)
  const scored = all.map(p => {
    const s = stats[pairKey(p.a, p.b)]
    const acc = cellAccuracy(s)
    const priority = s ? (acc === null ? 50 : 100 - acc) + (s.total < 2 ? 30 : 0) : 80
    return { p, priority }
  })
  scored.sort((x, y) => y.priority - x.priority)
  return scored.slice(0, limit).map(x => x.p)
}

export function buildSession(
  mode: MulTableModeId,
  stats: Record<string, CellStat>,
  options: { tier?: MulTierId; row?: number; cell?: MulPair } = {},
): MulPair[] {
  const tier = options.tier ?? 'basic'
  const { min, max } = tierConfig(tier)
  const pool = () => allPairs(tier)

  switch (mode) {
    case 'cell':
      if (!options.cell) return shuffle(pool()).slice(0, 10)
      {
        const { a, b } = options.cell
        return shuffle([
          makePair(a, b),
          makePair(b, a),
          ...shuffle(pool()).slice(0, 8),
        ]).slice(0, 10)
      }
    case 'row': {
      const row = options.row ?? min + Math.floor(Math.random() * (max - min + 1))
      return shuffle(pairsForRow(row, tier)).slice(0, 10)
    }
    case 'squares':
      return shuffle(squarePairs(tier))
    case 'easy': {
      const easy = shuffle(pairsForEasyRows(tier)).slice(0, 10)
      const filler = shuffle(pool()).filter(
        p => !easy.some(e => e.a === p.a && e.b === p.b),
      )
      return [...easy, ...filler.slice(0, 5)]
    }
    case 'weak': {
      const weak = weakPairs(stats, tier, 15)
      return weak.length >= 10 ? shuffle(weak).slice(0, 15) : shuffle(pool()).slice(0, 15)
    }
    case 'full':
      return shuffle(pool()).slice(0, 20)
    case 'sprint':
      return shuffle(pool())
    default:
      return shuffle(pool()).slice(0, 20)
  }
}

export function isSquareCell(a: number, b: number): boolean {
  return a === b
}

export type MulSprintRecord = {
  bestCorrect: number
  total: number
  accuracy: number
  at: string
}

const SPRINT_RECORD_KEY = (userId: string, tier: MulTierId) => `loreheim_mul_sprint_record_${tier}_${userId}`

export function loadMulSprintRecord(userId: string, tier: MulTierId = 'basic'): MulSprintRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SPRINT_RECORD_KEY(userId, tier))
    if (!raw) return null
    return JSON.parse(raw) as MulSprintRecord
  } catch {
    return null
  }
}

export function saveMulSprintResult(
  userId: string,
  correct: number,
  total: number,
  tier: MulTierId = 'basic',
): { record: MulSprintRecord; isNewBest: boolean } {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const prev = loadMulSprintRecord(userId, tier)
  const isNewBest = !prev || correct > prev.bestCorrect

  if (isNewBest) {
    const record: MulSprintRecord = {
      bestCorrect: correct,
      total,
      accuracy,
      at: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPRINT_RECORD_KEY(userId, tier), JSON.stringify(record))
    }
    return { record, isNewBest: true }
  }

  return { record: prev, isNewBest: false }
}
