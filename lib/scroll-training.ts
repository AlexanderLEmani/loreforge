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
  | 'mul_table_low'
  | 'mul_table_high'
  | 'mul_two_digit'
  | 'div_exact'
  | 'div_tens'
  | 'mul_div_pair'
  | 'div_chain'
  | 'frac_lcd'
  | 'frac_add'
  | 'frac_sub'
  | 'frac_mul'
  | 'frac_div'
  | 'frac_mixed'
  | 'pct_of'
  | 'pct_discount'
  | 'pct_markup'
  | 'pct_share'
  | 'pct_find_whole'

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
  topicId: 'add' | 'sub' | 'mul' | 'div' | 'frac' | 'pct'
  dungeon: string
  dungeons?: string[]
  label: string
  matches: (q: QuestionRow) => boolean
}

export const SCROLL_LEVEL_LABELS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
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

function isFractionQuestion(question: string): boolean {
  return /[½⅓¼⅕⅙⅐⅑⅒⅔⅖⅗⅘⅚⅜⅝⅞]|\d+\/\d+/.test(question)
}

function mulFactors(question: string): [number, number] | null {
  const m = question.match(/^(\d+)\s×\s(\d+)\s*=/)
  if (!m) return null
  return [Number(m[1]), Number(m[2])]
}

function divOperands(question: string): [number, number] | null {
  const m = question.match(/^(\d+)\s÷\s(\d+)\s*=/)
  if (!m) return null
  return [Number(m[1]), Number(m[2])]
}

function isSingleMul(q: QuestionRow): boolean {
  return q.question.includes('×') && !q.question.includes('+') && !q.question.includes('−') && !q.question.includes('÷')
}

function isSingleDiv(q: QuestionRow): boolean {
  return q.question.includes('÷') && !q.question.includes('×') && !q.question.includes('+') && !q.question.includes('−')
}

function matchesMulTableLow(q: QuestionRow): boolean {
  if (!isSingleMul(q)) return false
  const f = mulFactors(q.question)
  if (!f) return false
  const [a, b] = f
  return a >= 2 && b >= 2 && a <= 5 && b <= 5
}

function matchesMulTableHigh(q: QuestionRow): boolean {
  if (!isSingleMul(q)) return false
  const f = mulFactors(q.question)
  if (!f) return false
  const [a, b] = f
  return a >= 6 && b >= 6 && a <= 11 && b <= 11
}

function matchesMulTwoDigit(q: QuestionRow): boolean {
  if (!isSingleMul(q)) return false
  const f = mulFactors(q.question)
  if (!f) return false
  const [a, b] = f
  return a >= 10 && a <= 19 && b >= 2 && b <= 9
}

function matchesDivExact(q: QuestionRow): boolean {
  return isSingleDiv(q)
}

function matchesDivTens(q: QuestionRow): boolean {
  if (!isSingleDiv(q)) return false
  const ops = divOperands(q.question)
  if (!ops) return false
  const [a, b] = ops
  return a % 10 === 0 && b >= 2 && b <= 12
}

function matchesMulDivPair(q: QuestionRow): boolean {
  if (q.dungeon_name === 'Башня умножения' && isSingleMul(q) && q.difficulty === 'easy') return true
  if (q.dungeon_name === 'Пещера деления' && isSingleDiv(q) && q.difficulty === 'easy') return true
  return false
}

function matchesDivChain(q: QuestionRow): boolean {
  return q.question.includes('÷') && q.question.includes('−') && !q.question.includes('×')
}

function matchesFracMixed(q: QuestionRow): boolean {
  return isFractionQuestion(q.question) && /^1\s−/.test(q.question)
}

function matchesFracAdd(q: QuestionRow): boolean {
  return isFractionQuestion(q.question) && q.question.includes('+') && !q.question.includes('×') && !q.question.includes('÷') && !matchesFracMixed(q) && q.difficulty === 'easy'
}

function matchesFracSub(q: QuestionRow): boolean {
  return isFractionQuestion(q.question) && q.question.includes('−') && !q.question.includes('×') && !q.question.includes('÷') && !matchesFracMixed(q) && q.difficulty === 'easy'
}

function matchesFracLcd(q: QuestionRow): boolean {
  return isFractionQuestion(q.question) && q.question.includes('+') && !q.question.includes('×') && !q.question.includes('÷') && q.difficulty === 'medium'
}

function matchesFracMul(q: QuestionRow): boolean {
  return isFractionQuestion(q.question) && q.question.includes('×')
}

function matchesFracDiv(q: QuestionRow): boolean {
  return isFractionQuestion(q.question) && q.question.includes('÷')
}

function matchesPctOf(q: QuestionRow): boolean {
  return /% от \d+ =/.test(q.question) && !q.question.includes('от ?')
}

function matchesPctDiscount(q: QuestionRow): boolean {
  return q.question.includes('Скидка') || /\d+\s−\s\d+%/.test(q.question)
}

function matchesPctMarkup(q: QuestionRow): boolean {
  return /\+\s*\d+%/.test(q.question) && !q.question.includes('Скидка')
}

function matchesPctShare(q: QuestionRow): boolean {
  return /из \d+ = ?%/.test(q.question)
}

function matchesPctFindWhole(q: QuestionRow): boolean {
  return /% от \? =/.test(q.question)
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
  mul_table_low: {
    tag: 'mul_table_low',
    topicId: 'mul',
    dungeon: 'Башня умножения',
    label: 'Таблица 2–5',
    matches: matchesMulTableLow,
  },
  mul_table_high: {
    tag: 'mul_table_high',
    topicId: 'mul',
    dungeon: 'Башня умножения',
    label: 'Таблица 6–10',
    matches: matchesMulTableHigh,
  },
  mul_two_digit: {
    tag: 'mul_two_digit',
    topicId: 'mul',
    dungeon: 'Башня умножения',
    label: 'Двузначное × однозначное',
    matches: matchesMulTwoDigit,
  },
  div_exact: {
    tag: 'div_exact',
    topicId: 'div',
    dungeon: 'Пещера деления',
    label: 'Деление без остатка',
    matches: matchesDivExact,
  },
  div_tens: {
    tag: 'div_tens',
    topicId: 'div',
    dungeon: 'Пещера деления',
    label: 'Деление десятками',
    matches: matchesDivTens,
  },
  mul_div_pair: {
    tag: 'mul_div_pair',
    topicId: 'mul',
    dungeon: 'Башня умножения',
    dungeons: ['Башня умножения', 'Пещера деления'],
    label: 'Связь × и ÷',
    matches: matchesMulDivPair,
  },
  div_chain: {
    tag: 'div_chain',
    topicId: 'div',
    dungeon: 'Пещера деления',
    label: 'Цепочки с делением',
    matches: matchesDivChain,
  },
  frac_lcd: {
    tag: 'frac_lcd',
    topicId: 'frac',
    dungeon: 'Храм дробей',
    label: 'Общий знаменатель',
    matches: matchesFracLcd,
  },
  frac_add: {
    tag: 'frac_add',
    topicId: 'frac',
    dungeon: 'Храм дробей',
    label: 'Сложение дробей',
    matches: matchesFracAdd,
  },
  frac_sub: {
    tag: 'frac_sub',
    topicId: 'frac',
    dungeon: 'Храм дробей',
    label: 'Вычитание дробей',
    matches: matchesFracSub,
  },
  frac_mul: {
    tag: 'frac_mul',
    topicId: 'frac',
    dungeon: 'Храм дробей',
    label: 'Умножение дробей',
    matches: matchesFracMul,
  },
  frac_div: {
    tag: 'frac_div',
    topicId: 'frac',
    dungeon: 'Храм дробей',
    label: 'Деление дробей',
    matches: matchesFracDiv,
  },
  frac_mixed: {
    tag: 'frac_mixed',
    topicId: 'frac',
    dungeon: 'Храм дробей',
    label: 'Смешанные числа',
    matches: matchesFracMixed,
  },
  pct_of: {
    tag: 'pct_of',
    topicId: 'pct',
    dungeon: 'Рынок процентов',
    label: 'Процент от числа',
    matches: matchesPctOf,
  },
  pct_discount: {
    tag: 'pct_discount',
    topicId: 'pct',
    dungeon: 'Рынок процентов',
    label: 'Скидки',
    matches: matchesPctDiscount,
  },
  pct_markup: {
    tag: 'pct_markup',
    topicId: 'pct',
    dungeon: 'Рынок процентов',
    label: 'Наценки',
    matches: matchesPctMarkup,
  },
  pct_share: {
    tag: 'pct_share',
    topicId: 'pct',
    dungeon: 'Рынок процентов',
    label: 'Пропорции (из N)',
    matches: matchesPctShare,
  },
  pct_find_whole: {
    tag: 'pct_find_whole',
    topicId: 'pct',
    dungeon: 'Рынок процентов',
    label: 'Найти целое',
    matches: matchesPctFindWhole,
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
  { pattern: /таблица\s*2|2.?5|маленьк/i, tag: 'mul_table_low' },
  { pattern: /таблица\s*6|6.?10|больш.*множ/i, tag: 'mul_table_high' },
  { pattern: /двузначн.*умнож/i, tag: 'mul_two_digit' },
  { pattern: /делен.*без\s*остат/i, tag: 'div_exact' },
  { pattern: /делен.*десят/i, tag: 'div_tens' },
  { pattern: /связь.*×|×.*÷|умнож.*делен/i, tag: 'mul_div_pair' },
  { pattern: /цепочк.*делен/i, tag: 'div_chain' },
  { pattern: /общий\s*знамен/i, tag: 'frac_lcd' },
  { pattern: /сложен.*дроб/i, tag: 'frac_add' },
  { pattern: /вычит.*дроб/i, tag: 'frac_sub' },
  { pattern: /умножен.*дроб/i, tag: 'frac_mul' },
  { pattern: /делен.*дроб/i, tag: 'frac_div' },
  { pattern: /смешанн/i, tag: 'frac_mixed' },
  { pattern: /процент\s*от\s*числа|10%.*25%/i, tag: 'pct_of' },
  { pattern: /скидк/i, tag: 'pct_discount' },
  { pattern: /наценк/i, tag: 'pct_markup' },
  { pattern: /пропорц/i, tag: 'pct_share' },
  { pattern: /найти\s*целое/i, tag: 'pct_find_whole' },
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
  return scroll.level >= 1 && scroll.level <= 4 && resolveScrollTrainingTag(scroll) !== null
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
      case 'mul_table_low': {
        const a = 2 + Math.floor(Math.random() * 4)
        const b = 2 + Math.floor(Math.random() * 4)
        row = makeRow(profile.dungeon, `${a} × ${b} = ?`, a * b, 'easy', 2)
        break
      }
      case 'mul_table_high': {
        const a = 6 + Math.floor(Math.random() * 6)
        const b = 6 + Math.floor(Math.random() * 6)
        row = makeRow(profile.dungeon, `${a} × ${b} = ?`, a * b, 'easy', 3)
        break
      }
      case 'mul_two_digit': {
        const a = 10 + Math.floor(Math.random() * 10)
        const b = 2 + Math.floor(Math.random() * 8)
        row = makeRow(profile.dungeon, `${a} × ${b} = ?`, a * b, 'medium', 4)
        break
      }
      case 'div_exact': {
        const b = 2 + Math.floor(Math.random() * 9)
        const ans = 2 + Math.floor(Math.random() * 11)
        const a = b * ans
        row = makeRow(profile.dungeon, `${a} ÷ ${b} = ?`, ans, 'easy', 2)
        break
      }
      case 'div_tens': {
        const b = 2 + Math.floor(Math.random() * 9)
        const ans = (1 + Math.floor(Math.random() * 9)) * 10
        const a = b * ans
        row = makeRow(profile.dungeon, `${a} ÷ ${b} = ?`, ans, 'easy', 3)
        break
      }
      case 'mul_div_pair': {
        if (Math.random() < 0.5) {
          const a = 2 + Math.floor(Math.random() * 9)
          const b = 2 + Math.floor(Math.random() * 9)
          row = makeRow('Башня умножения', `${a} × ${b} = ?`, a * b, 'easy', 2)
        } else {
          const b = 2 + Math.floor(Math.random() * 9)
          const ans = 2 + Math.floor(Math.random() * 11)
          const a = b * ans
          row = makeRow('Пещера деления', `${a} ÷ ${b} = ?`, ans, 'easy', 2)
        }
        break
      }
      case 'div_chain': {
        const b = 2 + Math.floor(Math.random() * 9)
        const divAns = 2 + Math.floor(Math.random() * 8)
        const a = b * divAns
        const c = 1 + Math.floor(Math.random() * 5)
        const ans = divAns - c
        if (ans < 0) continue
        row = makeRow(profile.dungeon, `${a} ÷ ${b} − ${c} = ?`, ans, 'hard', 3)
        break
      }
      case 'pct_of': {
        const pct = [10, 20, 25, 50][Math.floor(Math.random() * 4)]
        const n = 20 + Math.floor(Math.random() * 8) * 10
        const ans = Math.round(n * pct / 100)
        row = makeRow(profile.dungeon, `${pct}% от ${n} = ?`, ans, 'easy', 2)
        break
      }
      case 'pct_discount': {
        const price = 40 + Math.floor(Math.random() * 8) * 20
        const pct = [10, 15, 20, 25][Math.floor(Math.random() * 4)]
        row = makeRow(profile.dungeon, `Скидка ${pct}% на ${price} = ?`, Math.round(price * pct / 100), 'medium', 3)
        break
      }
      case 'pct_markup': {
        const price = 40 + Math.floor(Math.random() * 8) * 20
        const pct = [10, 15, 20, 30][Math.floor(Math.random() * 4)]
        const part = Math.round(price * pct / 100)
        row = makeRow(profile.dungeon, `${price} + ${pct}% = ?`, price + part, 'medium', 4)
        break
      }
      case 'pct_share': {
        const whole = 20 + Math.floor(Math.random() * 30)
        const part = 1 + Math.floor(Math.random() * Math.min(9, whole - 1))
        const ans = Math.round((part / whole) * 100)
        row = makeRow(profile.dungeon, `${part} из ${whole} = ?%`, ans, 'hard', 3)
        break
      }
      case 'pct_find_whole': {
        const pct = [10, 20, 25, 50][Math.floor(Math.random() * 4)]
        const part = 2 + Math.floor(Math.random() * 18) * (pct === 10 ? 1 : 2)
        const ans = Math.round(part * 100 / pct)
        row = makeRow(profile.dungeon, `${pct}% от ? = ${part}`, ans, 'hard', 5)
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
  const dungeonList = profile.dungeons ?? [profile.dungeon]
  const pool: ScrollQuestion[] = []
  const seen = new Set<string>()

  for (const dungeon of dungeonList) {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('dungeon_name', dungeon)
      .limit(120)
    const merged = mergeWithFallback(dungeon, data || [])
    for (const row of merged) {
      if (!profile.matches(row) || seen.has(row.question)) continue
      seen.add(row.question)
      pool.push(row)
    }
  }

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
