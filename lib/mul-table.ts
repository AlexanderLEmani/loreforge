export const MUL_MIN = 1
export const MUL_MAX = 10
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
    desc: '2, 5, 10 — лайфхаки. Потом случайные ячейки.',
    sessionLabel: '15 примеров',
  },
  {
    id: 'row',
    name: 'Один ряд',
    icon: '📏',
    desc: 'Зафиксируй ×3, ×7… — все комбинации с числом.',
    sessionLabel: '10 примеров',
  },
  {
    id: 'squares',
    name: 'Квадраты',
    icon: '🟧',
    desc: 'Диагональ таблицы: 1², 2² … 10².',
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
    name: 'Вся таблица',
    icon: '🗺️',
    desc: '20 случайных пар 1–10 · без подсказок.',
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

const ROW_HACKS: Record<number, string> = {
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

const SQUARE_HINTS: Record<number, string> = {
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

const EASY_ROWS = [2, 5, 10]

export function pairKey(a: number, b: number): string {
  return `${a}x${b}`
}

export function allPairs(): MulPair[] {
  const out: MulPair[] = []
  for (let a = MUL_MIN; a <= MUL_MAX; a++) {
    for (let b = MUL_MIN; b <= MUL_MAX; b++) {
      out.push({ a, b, product: a * b })
    }
  }
  return out
}

export function makePair(a: number, b: number): MulPair {
  return { a, b, product: a * b }
}

export function rowLifehack(n: number): string | null {
  return ROW_HACKS[n] ?? null
}

export function squareHint(n: number): string | null {
  return SQUARE_HINTS[n] ?? null
}

export function symmetryTip(a: number, b: number): string | null {
  if (a === b) return squareHint(a)
  return `Зеркало: ${b}×${a} — тот же ответ. Выучи один раз.`
}

export function tipForPair(a: number, b: number): string {
  if (a === b) return squareHint(a) ?? rowLifehack(a) ?? symmetryTip(a, b) ?? ''
  const hackA = rowLifehack(a)
  const hackB = rowLifehack(b)
  if (hackA && a <= b) return hackA
  if (hackB) return hackB
  return symmetryTip(a, b) ?? ''
}

const STATS_KEY = (userId: string) => `loreforge_mul_table_${userId}`

export function loadMulStats(userId: string): Record<string, CellStat> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STATS_KEY(userId))
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CellStat>
  } catch {
    return {}
  }
}

export function saveMulStats(userId: string, stats: Record<string, CellStat>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STATS_KEY(userId), JSON.stringify(stats))
}

export function recordMulStat(
  userId: string,
  a: number,
  b: number,
  correct: boolean,
): Record<string, CellStat> {
  const stats = loadMulStats(userId)
  const key = pairKey(a, b)
  const prev = stats[key] ?? { correct: 0, total: 0 }
  stats[key] = {
    correct: prev.correct + (correct ? 1 : 0),
    total: prev.total + 1,
  }
  saveMulStats(userId, stats)
  return stats
}

export function cellAccuracy(stat: CellStat | undefined): number | null {
  if (!stat || stat.total === 0) return null
  return Math.round((stat.correct / stat.total) * 100)
}

export function rowProgress(stats: Record<string, CellStat>, row: number): number {
  let mastered = 0
  for (let b = MUL_MIN; b <= MUL_MAX; b++) {
    const acc = cellAccuracy(stats[pairKey(row, b)])
    if (acc !== null && acc >= 90 && stats[pairKey(row, b)]!.total >= 2) mastered++
  }
  return Math.round((mastered / MUL_MAX) * 100)
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pairsForRow(row: number): MulPair[] {
  return Array.from({ length: MUL_MAX }, (_, i) => makePair(row, i + 1))
}

function squarePairs(): MulPair[] {
  return Array.from({ length: MUL_MAX }, (_, i) => makePair(i + 1, i + 1))
}

function pairsForEasyRows(): MulPair[] {
  const out: MulPair[] = []
  for (const row of EASY_ROWS) {
    for (let b = MUL_MIN; b <= MUL_MAX; b++) out.push(makePair(row, b))
  }
  return out
}

export function weakPairs(stats: Record<string, CellStat>, limit = 20): MulPair[] {
  const all = allPairs()
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
  options: { row?: number; cell?: MulPair } = {},
): MulPair[] {
  switch (mode) {
    case 'cell':
      if (!options.cell) return shuffle(allPairs()).slice(0, 10)
      const { a, b } = options.cell
      return shuffle([
        makePair(a, b),
        makePair(b, a),
        ...shuffle(allPairs()).slice(0, 8),
      ]).slice(0, 10)
    case 'row':
      const row = options.row ?? 2 + Math.floor(Math.random() * 9)
      return shuffle(pairsForRow(row)).slice(0, 10)
    case 'squares':
      return shuffle(squarePairs())
    case 'easy':
      const easy = shuffle(pairsForEasyRows()).slice(0, 10)
      const filler = shuffle(allPairs()).filter(
        p => !easy.some(e => e.a === p.a && e.b === p.b),
      )
      return [...easy, ...filler.slice(0, 5)]
    case 'weak':
      const weak = weakPairs(stats, 15)
      return weak.length >= 10 ? shuffle(weak).slice(0, 15) : shuffle(allPairs()).slice(0, 15)
    case 'full':
      return shuffle(allPairs()).slice(0, 20)
    case 'sprint':
      return shuffle(allPairs())
    default:
      return shuffle(allPairs()).slice(0, 20)
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

const SPRINT_RECORD_KEY = (userId: string) => `loreforge_mul_sprint_record_${userId}`

export function loadMulSprintRecord(userId: string): MulSprintRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SPRINT_RECORD_KEY(userId))
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
): { record: MulSprintRecord; isNewBest: boolean } {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const prev = loadMulSprintRecord(userId)
  const isNewBest = !prev || correct > prev.bestCorrect

  if (isNewBest) {
    const record: MulSprintRecord = {
      bestCorrect: correct,
      total,
      accuracy,
      at: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPRINT_RECORD_KEY(userId), JSON.stringify(record))
    }
    return { record, isNewBest: true }
  }

  return { record: prev, isNewBest: false }
}
