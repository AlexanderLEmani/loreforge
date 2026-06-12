import type { SupabaseClient } from '@supabase/supabase-js'
import { mergeWithFallback } from '@/lib/fallback-questions'

export type ScrollTrainingTag =
  | 'add_easy'
  | 'add_medium'
  | 'add_chain'
  | 'add_hard'
  | 'sub_easy'
  | 'sub_medium'
  | 'sub_chain'
  | 'sub_hard'

export type ScrollRecord = {
  id: number
  level: number
  title: string
  subtitle?: string
  body?: string
  gorus?: string
  example?: unknown
  combat?: string
  training_tag?: string | null
}

export type ScrollQuestion = {
  id: number
  question: string
  answers: string[]
  correct_index: number
  dungeon_name: string
  difficulty?: string
}

type QuestionRow = ScrollQuestion

export type ScrollTrainingProfile = {
  tag: ScrollTrainingTag
  topicId: 'add' | 'sub'
  dungeon: string
  label: string
  matches: (q: QuestionRow) => boolean
}

/** Все числа из строки примера (до «=») */
export function extractQuestionNumbers(question: string): number[] {
  const head = question.split('=')[0] ?? question
  return [...head.matchAll(/(\d+)/g)].map(m => Number(m[1]))
}

function plusCount(question: string): number {
  return (question.match(/\+/g) || []).length
}

function minusCount(question: string): number {
  return (question.match(/−/g) || []).length
}

/** Сложение до 20: два числа ≤20, сумма ≤20, без скобок */
function matchesAddEasy(q: QuestionRow): boolean {
  if (q.question.includes('(') || plusCount(q.question) !== 1) return false
  const nums = extractQuestionNumbers(q.question)
  if (nums.length !== 2) return false
  const [a, b] = nums
  return a >= 2 && b >= 2 && a <= 20 && b <= 20 && a + b <= 20
}

/** Двузначное сложение: два числа 10–99, один плюс, без скобок */
function matchesAddMedium(q: QuestionRow): boolean {
  if (q.question.includes('(') || plusCount(q.question) !== 1) return false
  const nums = extractQuestionNumbers(q.question)
  if (nums.length !== 2) return false
  const [a, b] = nums
  if (a < 10 || b < 10 || a > 99 || b > 99) return false
  // не пересекаемся с «до 20»
  if (a <= 20 && b <= 20 && a + b <= 20) return false
  return true
}

/** Цепочки / скобки: 2+ плюсов или скобки, числа < 100 (уровень I) */
function matchesAddChain(q: QuestionRow): boolean {
  if (!q.question.includes('+')) return false
  const nums = extractQuestionNumbers(q.question)
  if (nums.length < 2) return false
  const chain = q.question.includes('(') || plusCount(q.question) >= 2
  if (!chain) return false
  return nums.every(n => n < 100)
}

/** Большие числа: хотя бы одно число ≥ 100 */
function matchesAddHard(q: QuestionRow): boolean {
  return extractQuestionNumbers(q.question).some(n => n >= 100)
}

/** Вычитание до 20: a,b ≤20, результат < 20, один минус */
function matchesSubEasy(q: QuestionRow): boolean {
  if (q.question.includes('(') || minusCount(q.question) !== 1) return false
  const nums = extractQuestionNumbers(q.question)
  if (nums.length !== 2) return false
  const [a, b] = nums
  if (a <= b || a > 20 || b > 20) return false
  return a - b < 20
}

/** Двузначное вычитание: a,b 10–99, один минус */
function matchesSubMedium(q: QuestionRow): boolean {
  if (q.question.includes('(') || minusCount(q.question) !== 1) return false
  const nums = extractQuestionNumbers(q.question)
  if (nums.length !== 2) return false
  const [a, b] = nums
  return a >= 10 && b >= 10 && a > b && a <= 99 && b <= 99
}

/** Цепочки / скобки: все числа ≤ 99 */
function matchesSubChain(q: QuestionRow): boolean {
  const nums = extractQuestionNumbers(q.question)
  if (nums.length < 2) return false
  const chain = q.question.includes('(') || minusCount(q.question) >= 2
  if (!chain) return false
  return nums.every(n => n <= 99)
}

/** Большие разности: столбик 100+ или несколько сотен */
function matchesSubHard(q: QuestionRow): boolean {
  const nums = extractQuestionNumbers(q.question)
  if (nums.length < 2) return false
  if (!q.question.includes('(') && minusCount(q.question) === 1 && nums.length === 2) {
    const [a, b] = nums
    return a >= 100 && b >= 10 && a > b
  }
  return nums.some(n => n >= 200) || nums.filter(n => n >= 100).length >= 2
}

export const SCROLL_TRAINING_PROFILES: Record<ScrollTrainingTag, ScrollTrainingProfile> = {
  add_easy: {
    tag: 'add_easy',
    topicId: 'add',
    dungeon: 'Пещера сложения',
    label: 'Сложение до 20',
    matches: matchesAddEasy,
  },
  add_medium: {
    tag: 'add_medium',
    topicId: 'add',
    dungeon: 'Пещера сложения',
    label: 'Двузначные суммы',
    matches: matchesAddMedium,
  },
  add_chain: {
    tag: 'add_chain',
    topicId: 'add',
    dungeon: 'Пещера сложения',
    label: 'Сложение в столбик / цепочки',
    matches: matchesAddChain,
  },
  add_hard: {
    tag: 'add_hard',
    topicId: 'add',
    dungeon: 'Пещера сложения',
    label: 'Большие числа',
    matches: matchesAddHard,
  },
  sub_easy: {
    tag: 'sub_easy',
    topicId: 'sub',
    dungeon: 'Пещера вычитания',
    label: 'Вычитание до 20',
    matches: matchesSubEasy,
  },
  sub_medium: {
    tag: 'sub_medium',
    topicId: 'sub',
    dungeon: 'Пещера вычитания',
    label: 'Двузначные разности',
    matches: matchesSubMedium,
  },
  sub_chain: {
    tag: 'sub_chain',
    topicId: 'sub',
    dungeon: 'Пещера вычитания',
    label: 'Цепочки и скобки',
    matches: matchesSubChain,
  },
  sub_hard: {
    tag: 'sub_hard',
    topicId: 'sub',
    dungeon: 'Пещера вычитания',
    label: 'Большие разности',
    matches: matchesSubHard,
  },
}

const TITLE_TAG_HINTS: Array<{ pattern: RegExp; tag: ScrollTrainingTag }> = [
  { pattern: /сложен.*до\s*20|до\s*двадцати/i, tag: 'add_easy' },
  { pattern: /двузначн.*слож|разряд.*слож/i, tag: 'add_medium' },
  { pattern: /цепочк|столбик|тройн/i, tag: 'add_chain' },
  { pattern: /больш.*слож|сложен.*100|сот/i, tag: 'add_hard' },
  { pattern: /вычит.*до\s*20|до\s*двадцати/i, tag: 'sub_easy' },
  { pattern: /двузначн.*выч/i, tag: 'sub_medium' },
  { pattern: /цепочк.*выч|скобк.*выч/i, tag: 'sub_chain' },
  { pattern: /больш.*выч|вычит.*100/i, tag: 'sub_hard' },
  { pattern: /разност/i, tag: 'sub_medium' },
]

export function resolveScrollTrainingTag(scroll: ScrollRecord): ScrollTrainingTag | null {
  const raw = scroll.training_tag
  if (raw && raw in SCROLL_TRAINING_PROFILES) return raw as ScrollTrainingTag
  const hay = `${scroll.title} ${scroll.subtitle ?? ''}`
  for (const { pattern, tag } of TITLE_TAG_HINTS) {
    if (pattern.test(hay)) return tag
  }
  return null
}

export function scrollSupportsTraining(scroll: ScrollRecord): boolean {
  return scroll.level === 1 && resolveScrollTrainingTag(scroll) !== null
}

function nearInt(n: number, spread = 3): string[] {
  const opts = new Set<string>()
  let guard = 0
  while (opts.size < 3 && guard < 50) {
    guard++
    const delta = Math.floor(Math.random() * spread * 2 + 1) - spread
    const v = n + delta
    if (v !== n && v >= 0) opts.add(String(v))
  }
  while (opts.size < 3) {
    const v = n + opts.size + 1
    if (v !== n) opts.add(String(v))
  }
  return [...opts]
}

function shuffleAnswers(correct: number, spread = 3): { answers: string[]; correct_index: number } {
  const distractors = nearInt(correct, spread)
  const answers = [String(correct), ...distractors]
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[answers[i], answers[j]] = [answers[j], answers[i]]
  }
  return { answers, correct_index: answers.indexOf(String(correct)) }
}

function makeRow(
  dungeon: string,
  question: string,
  correct: number,
  difficulty: string,
  spread = 3,
): ScrollQuestion {
  const { answers, correct_index } = shuffleAnswers(correct, spread)
  return {
    id: -Math.floor(Math.random() * 1_000_000_000),
    dungeon_name: dungeon,
    question,
    answers,
    correct_index,
    difficulty,
  }
}

function generateForTag(tag: ScrollTrainingTag, count: number): ScrollQuestion[] {
  const profile = SCROLL_TRAINING_PROFILES[tag]
  const seen = new Set<string>()
  const out: ScrollQuestion[] = []
  let guard = 0

  while (out.length < count && guard < count * 300) {
    guard++
    let row: ScrollQuestion | null = null

    switch (tag) {
      case 'add_easy': {
        const a = 2 + Math.floor(Math.random() * 18)
        const b = 2 + Math.floor(Math.random() * 18)
        if (a + b > 20) continue
        row = makeRow(profile.dungeon, `${a} + ${b} = ?`, a + b, 'easy', 2)
        break
      }
      case 'add_medium': {
        const a = 10 + Math.floor(Math.random() * 90)
        const b = 10 + Math.floor(Math.random() * 90)
        if (a <= 20 && b <= 20 && a + b <= 20) continue
        row = makeRow(profile.dungeon, `${a} + ${b} = ?`, a + b, 'medium', 4)
        break
      }
      case 'add_chain': {
        const kind = Math.floor(Math.random() * 2)
        if (kind === 0) {
          const a = 10 + Math.floor(Math.random() * 40)
          const b = 10 + Math.floor(Math.random() * 40)
          const c = 5 + Math.floor(Math.random() * 25)
          if (a >= 100 || b >= 100 || c >= 100) continue
          row = makeRow(profile.dungeon, `(${a} + ${b}) + ${c} = ?`, a + b + c, 'medium', 5)
        } else {
          const a = 10 + Math.floor(Math.random() * 35)
          const b = 8 + Math.floor(Math.random() * 25)
          const c = 5 + Math.floor(Math.random() * 20)
          if (a + b + c >= 100) continue
          row = makeRow(profile.dungeon, `${a} + ${b} + ${c} = ?`, a + b + c, 'medium', 5)
        }
        break
      }
      case 'add_hard': {
        const kind = Math.floor(Math.random() * 2)
        if (kind === 0) {
          const a = 100 + Math.floor(Math.random() * 200)
          const b = 50 + Math.floor(Math.random() * 150)
          row = makeRow(profile.dungeon, `${a} + ${b} = ?`, a + b, 'hard', 10)
        } else {
          const a = 100 + Math.floor(Math.random() * 180)
          const b = 40 + Math.floor(Math.random() * 120)
          const c = 30 + Math.floor(Math.random() * 90)
          row = makeRow(profile.dungeon, `(${a} + ${b}) + ${c} = ?`, a + b + c, 'hard', 12)
        }
        break
      }
      case 'sub_easy': {
        const b = 2 + Math.floor(Math.random() * 18)
        const ans = 1 + Math.floor(Math.random() * 18)
        const a = b + ans
        if (a > 20 || b > 20 || ans >= 20) continue
        row = makeRow(profile.dungeon, `${a} − ${b} = ?`, ans, 'easy', 2)
        break
      }
      case 'sub_medium': {
        const b = 10 + Math.floor(Math.random() * 89)
        const ans = 5 + Math.floor(Math.random() * 50)
        const a = b + ans
        if (a > 99 || b > 99) continue
        row = makeRow(profile.dungeon, `${a} − ${b} = ?`, ans, 'medium', 4)
        break
      }
      case 'sub_chain': {
        const kind = Math.floor(Math.random() * 2)
        if (kind === 0) {
          const inner = 5 + Math.floor(Math.random() * 25)
          const outer = 3 + Math.floor(Math.random() * 20)
          const ans = 5 + Math.floor(Math.random() * 25)
          const a = ans + inner + outer
          if (a > 99 || inner > 99 || outer > 99) continue
          row = makeRow(profile.dungeon, `(${a} − ${inner}) − ${outer} = ?`, ans, 'medium', 4)
        } else {
          const b = 8 + Math.floor(Math.random() * 30)
          const c = 5 + Math.floor(Math.random() * 20)
          const ans = 5 + Math.floor(Math.random() * 30)
          const a = ans + b + c
          if (a > 99 || b > 99 || c > 99) continue
          row = makeRow(profile.dungeon, `${a} − ${b} − ${c} = ?`, ans, 'medium', 4)
        }
        break
      }
      case 'sub_hard': {
        const kind = Math.floor(Math.random() * 2)
        if (kind === 0) {
          const b = 10 + Math.floor(Math.random() * 89)
          const ans = 20 + Math.floor(Math.random() * 180)
          const a = b + ans
          if (a < 100) continue
          row = makeRow(profile.dungeon, `${a} − ${b} = ?`, ans, 'hard', 10)
        } else {
          const b = 80 + Math.floor(Math.random() * 180)
          const c = 40 + Math.floor(Math.random() * 120)
          const ans = 50 + Math.floor(Math.random() * 150)
          const a = ans + b + c
          if (a > 900 || a < 200) continue
          row = makeRow(profile.dungeon, `${a} − ${b} − ${c} = ?`, ans, 'hard', 10)
        }
        break
      }
    }

    if (!row || seen.has(row.question)) continue
    if (!profile.matches(row)) continue
    seen.add(row.question)
    out.push(row)
  }

  return out
}

const MIN_POOL = 24

export async function loadScrollTrainingQuestions(
  supabase: SupabaseClient,
  tag: ScrollTrainingTag,
): Promise<ScrollQuestion[]> {
  const profile = SCROLL_TRAINING_PROFILES[tag]
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('dungeon_name', profile.dungeon)
    .limit(120)
  const merged = mergeWithFallback(profile.dungeon, data || [])
  const filtered = merged.filter(profile.matches)

  const pool: ScrollQuestion[] = [...filtered]
  const seen = new Set(pool.map(q => q.question))

  if (pool.length < MIN_POOL) {
    const generated = generateForTag(tag, MIN_POOL + 10)
    for (const g of generated) {
      if (!seen.has(g.question)) {
        seen.add(g.question)
        pool.push(g)
      }
    }
  }

  return pool
}

export function parseScrollExample(example: unknown): { task?: string; steps?: string[] } {
  if (!example) return {}
  if (typeof example === 'string') {
    try {
      return JSON.parse(example) as { task?: string; steps?: string[] }
    } catch {
      return {}
    }
  }
  if (typeof example === 'object') return example as { task?: string; steps?: string[] }
  return {}
}

/** Для тестов и отладки: проверка что пример подходит под тег свитка */
export function questionMatchesScrollTag(tag: ScrollTrainingTag, question: string): boolean {
  return SCROLL_TRAINING_PROFILES[tag].matches({ id: 0, question, answers: [], correct_index: 0, dungeon_name: '' })
}
