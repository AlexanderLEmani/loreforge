/**
 * Генерация банков вопросов: 100 уникальных примеров на данж.
 * 40 easy · 35 medium · 25 hard
 */

const PER_DUNGEON = 100
const MIX = { easy: 40, medium: 35, hard: 25 }

const DUNGEONS = [
  { name: 'Пещера сложения', level: 1, slug: 'pechera-slozheniya' },
  { name: 'Пещера вычитания', level: 1, slug: 'pechera-vychitaniya' },
  { name: 'Башня умножения', level: 2, slug: 'bashnya-umnozheniya' },
  { name: 'Пещера деления', level: 2, slug: 'pechera-deleniya' },
  { name: 'Храм дробей', level: 3, slug: 'hram-drobei' },
  { name: 'Рынок процентов', level: 4, slug: 'rynok-procentov' },
]

let nextId = 10000

function shuffleAnswers(correct, distractors) {
  const answers = [correct, ...distractors]
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[answers[i], answers[j]] = [answers[j], answers[i]]
  }
  return { answers, correct_index: answers.indexOf(correct) }
}

function nearInt(n, spread = 3) {
  const opts = new Set()
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

function row(dungeon, question, correct, distractors, level, difficulty) {
  const { answers, correct_index } = shuffleAnswers(String(correct), distractors.map(String))
  return {
    id: nextId++,
    dungeon_name: dungeon,
    question,
    answers,
    correct_index,
    level,
    difficulty,
  }
}

function fillPool(seen, dungeon, level, difficulty, count, generator) {
  const out = []
  let guard = 0
  while (out.length < count && guard < count * 200) {
    guard++
    const spec = generator()
    if (!spec) continue
    const key = spec.question
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row(dungeon, spec.question, spec.correct, spec.distractors, level, difficulty))
  }
  return out
}

// --- Целые числа ---
function buildAddition(dungeon, level) {
  const seen = new Set()
  const easy = fillPool(seen, dungeon, level, 'easy', MIX.easy, () => {
    const a = 2 + Math.floor(Math.random() * 18)
    const b = 2 + Math.floor(Math.random() * 18)
    const ans = a + b
    return { question: `${a} + ${b} = ?`, correct: ans, distractors: nearInt(ans, 2) }
  })
  const medium = fillPool(seen, dungeon, level, 'medium', MIX.medium, () => {
    const kind = Math.floor(Math.random() * 3)
    if (kind === 0) {
      const a = 20 + Math.floor(Math.random() * 60)
      const b = 15 + Math.floor(Math.random() * 55)
      const ans = a + b
      return { question: `${a} + ${b} = ?`, correct: ans, distractors: nearInt(ans, 4) }
    }
    if (kind === 1) {
      const a = 15 + Math.floor(Math.random() * 40)
      const b = 12 + Math.floor(Math.random() * 35)
      const c = 8 + Math.floor(Math.random() * 25)
      const ans = a + b + c
      return { question: `${a} + ${b} + ${c} = ?`, correct: ans, distractors: nearInt(ans, 5) }
    }
    const a = 10 + Math.floor(Math.random() * 40)
    const b = 10 + Math.floor(Math.random() * 40)
    const c = 5 + Math.floor(Math.random() * 30)
    const ans = a + b + c
    return { question: `(${a} + ${b}) + ${c} = ?`, correct: ans, distractors: nearInt(ans, 5) }
  })
  const hard = fillPool(seen, dungeon, level, 'hard', MIX.hard, () => {
    const kind = Math.floor(Math.random() * 2)
    if (kind === 0) {
      const a = 120 + Math.floor(Math.random() * 280)
      const b = 80 + Math.floor(Math.random() * 220)
      const c = 40 + Math.floor(Math.random() * 160)
      const ans = a + b + c
      return { question: `${a} + ${b} + ${c} = ?`, correct: ans, distractors: nearInt(ans, 10) }
    }
    const a = 100 + Math.floor(Math.random() * 200)
    const b = 50 + Math.floor(Math.random() * 150)
    const c = 30 + Math.floor(Math.random() * 120)
    const ans = a + b + c
    return { question: `(${a} + ${b}) + ${c} = ?`, correct: ans, distractors: nearInt(ans, 12) }
  })
  return [...easy, ...medium, ...hard]
}

function buildSubtraction(dungeon, level) {
  const seen = new Set()
  const easy = fillPool(seen, dungeon, level, 'easy', MIX.easy, () => {
    const b = 2 + Math.floor(Math.random() * 15)
    const ans = 2 + Math.floor(Math.random() * 18)
    const a = b + ans
    return { question: `${a} − ${b} = ?`, correct: ans, distractors: nearInt(ans, 2) }
  })
  const medium = fillPool(seen, dungeon, level, 'medium', MIX.medium, () => {
    const kind = Math.floor(Math.random() * 3)
    if (kind === 0) {
      const b = 15 + Math.floor(Math.random() * 50)
      const c = 10 + Math.floor(Math.random() * 40)
      const ans = 20 + Math.floor(Math.random() * 40)
      const a = ans + b + c
      return { question: `${a} − ${b} − ${c} = ?`, correct: ans, distractors: nearInt(ans, 4) }
    }
    if (kind === 1) {
      const inner = 10 + Math.floor(Math.random() * 35)
      const outer = 5 + Math.floor(Math.random() * 25)
      const ans = 15 + Math.floor(Math.random() * 35)
      const a = ans + inner + outer
      return { question: `${a} − (${inner} + ${outer}) = ?`, correct: ans, distractors: nearInt(ans, 4) }
    }
    const b = 12 + Math.floor(Math.random() * 40)
    const c = 8 + Math.floor(Math.random() * 30)
    const ans = 10 + Math.floor(Math.random() * 40)
    const a = ans + b + c
    return { question: `(${a} − ${b}) − ${c} = ?`, correct: ans, distractors: nearInt(ans, 5) }
  })
  const hard = fillPool(seen, dungeon, level, 'hard', MIX.hard, () => {
    const b = 80 + Math.floor(Math.random() * 180)
    const c = 40 + Math.floor(Math.random() * 120)
    const ans = 50 + Math.floor(Math.random() * 150)
    const a = ans + b + c
    if (a > 900) return null
    return { question: `${a} − ${b} − ${c} = ?`, correct: ans, distractors: nearInt(ans, 10) }
  })
  return [...easy, ...medium, ...hard]
}

function buildMultiplication(dungeon, level) {
  const seen = new Set()
  const easy = fillPool(seen, dungeon, level, 'easy', MIX.easy, () => {
    const a = 2 + Math.floor(Math.random() * 10)
    const b = 2 + Math.floor(Math.random() * 10)
    const ans = a * b
    return { question: `${a} × ${b} = ?`, correct: ans, distractors: nearInt(ans, 3) }
  })
  const medium = fillPool(seen, dungeon, level, 'medium', MIX.medium, () => {
    const kind = Math.floor(Math.random() * 2)
    if (kind === 0) {
      const a = 11 + Math.floor(Math.random() * 4)
      const b = 6 + Math.floor(Math.random() * 7)
      const ans = a * b
      return { question: `${a} × ${b} = ?`, correct: ans, distractors: nearInt(ans, 6) }
    }
    const a = 3 + Math.floor(Math.random() * 8)
    const b = 4 + Math.floor(Math.random() * 8)
    const c = 5 + Math.floor(Math.random() * 15)
    const ans = a * b + c
    return { question: `${a} × ${b} + ${c} = ?`, correct: ans, distractors: nearInt(ans, 5) }
  })
  const hard = fillPool(seen, dungeon, level, 'hard', MIX.hard, () => {
    const kind = Math.floor(Math.random() * 2)
    if (kind === 0) {
      const a = 12 + Math.floor(Math.random() * 4)
      const b = 8 + Math.floor(Math.random() * 7)
      const ans = a * b
      return { question: `${a} × ${b} = ?`, correct: ans, distractors: nearInt(ans, 10) }
    }
    const a = 11 + Math.floor(Math.random() * 5)
    const b = 7 + Math.floor(Math.random() * 8)
    const c = 10 + Math.floor(Math.random() * 30)
    const ans = a * b - c
    if (ans < 5) return null
    return { question: `${a} × ${b} − ${c} = ?`, correct: ans, distractors: nearInt(ans, 8) }
  })
  return [...easy, ...medium, ...hard]
}

function buildDivision(dungeon, level) {
  const seen = new Set()
  const easy = fillPool(seen, dungeon, level, 'easy', MIX.easy, () => {
    const b = 2 + Math.floor(Math.random() * 10)
    const ans = 2 + Math.floor(Math.random() * 10)
    const a = b * ans
    return { question: `${a} ÷ ${b} = ?`, correct: ans, distractors: nearInt(ans, 2) }
  })
  const medium = fillPool(seen, dungeon, level, 'medium', MIX.medium, () => {
    const kind = Math.floor(Math.random() * 2)
    if (kind === 0) {
      const b = 6 + Math.floor(Math.random() * 7)
      const ans = 6 + Math.floor(Math.random() * 10)
      const a = b * ans
      return { question: `${a} ÷ ${b} = ?`, correct: ans, distractors: nearInt(ans, 4) }
    }
    const b = 4 + Math.floor(Math.random() * 9)
    const q = 5 + Math.floor(Math.random() * 12)
    const a = b * q
    const c = 3 + Math.floor(Math.random() * 12)
    const ans = q + c
    return { question: `${a} ÷ ${b} + ${c} = ?`, correct: ans, distractors: nearInt(ans, 4) }
  })
  const hard = fillPool(seen, dungeon, level, 'hard', MIX.hard, () => {
    const b = 11 + Math.floor(Math.random() * 5)
    const q = 8 + Math.floor(Math.random() * 10)
    const a = b * q
    const kind = Math.floor(Math.random() * 2)
    if (kind === 0) {
      return { question: `${a} ÷ ${b} = ?`, correct: q, distractors: nearInt(q, 5) }
    }
    const c = 10 + Math.floor(Math.random() * 25)
    const ans = q - c
    if (ans < 2) return null
    return { question: `${a} ÷ ${b} − ${c} = ?`, correct: ans, distractors: nearInt(ans, 6) }
  })
  return [...easy, ...medium, ...hard]
}

// --- Дроби ---
const FRAC_UNICODE = {
  '1/1': '1',
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
}

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function fracFromParts(n, d) {
  if (d === 0) return null
  const g = gcd(n, d)
  n /= g
  d /= g
  if (d < 0) {
    n = -n
    d = -d
  }
  return { n, d }
}

function fracToStr(f) {
  if (!f) return '?'
  if (f.d === 1) return String(f.n)
  const key = `${f.n}/${f.d}`
  return FRAC_UNICODE[key] || `${f.n}/${f.d}`
}

function fracAdd(a, b) {
  return fracFromParts(a.n * b.d + b.n * a.d, a.d * b.d)
}

function fracSub(a, b) {
  return fracFromParts(a.n * b.d - b.n * a.d, a.d * b.d)
}

function fracMul(a, b) {
  return fracFromParts(a.n * b.n, a.d * b.d)
}

function fracDiv(a, b) {
  return fracFromParts(a.n * b.d, a.d * b.n)
}

const FRAC_PARTS = [
  { n: 1, d: 2 },
  { n: 1, d: 3 },
  { n: 2, d: 3 },
  { n: 1, d: 4 },
  { n: 3, d: 4 },
  { n: 1, d: 5 },
  { n: 2, d: 5 },
  { n: 3, d: 5 },
  { n: 4, d: 5 },
  { n: 1, d: 6 },
  { n: 5, d: 6 },
  { n: 1, d: 8 },
  { n: 3, d: 8 },
]

function nearFrac(correctStr, resultFrac) {
  const pool = FRAC_PARTS.map(p => fracToStr(fracFromParts(p.n, p.d)))
  const opts = new Set()
  for (const s of pool) {
    if (s !== correctStr) opts.add(s)
  }
  const shuffled = [...opts].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function buildFractions(dungeon, level) {
  const seen = new Set()
  const easy = fillPool(seen, dungeon, level, 'easy', MIX.easy, () => {
    const mode = Math.floor(Math.random() * 4)
    if (mode === 0) {
      const p = FRAC_PARTS[Math.floor(Math.random() * FRAC_PARTS.length)]
      const f1 = fracFromParts(p.n, p.d)
      const res = fracAdd(f1, f1)
      const correct = fracToStr(res)
      return {
        question: `${fracToStr(f1)} + ${fracToStr(f1)} = ?`,
        correct,
        distractors: nearFrac(correct, res),
      }
    }
    if (mode === 1) {
      const p = FRAC_PARTS[Math.floor(Math.random() * FRAC_PARTS.length)]
      const f1 = fracFromParts(1, 1)
      const f2 = fracFromParts(p.n, p.d)
      const res = fracSub(f1, f2)
      if (!res || res.n <= 0) return null
      const correct = fracToStr(res)
      return {
        question: `1 − ${fracToStr(f2)} = ?`,
        correct,
        distractors: nearFrac(correct, res),
      }
    }
    if (mode === 2) {
      const i = Math.floor(Math.random() * FRAC_PARTS.length)
      const j = Math.floor(Math.random() * FRAC_PARTS.length)
      const f1 = fracFromParts(FRAC_PARTS[i].n, FRAC_PARTS[i].d)
      const f2 = fracFromParts(FRAC_PARTS[j].n, FRAC_PARTS[j].d)
      const res = fracAdd(f1, f2)
      if (!res || res.n <= 0 || res.n > res.d) return null
      const correct = fracToStr(res)
      return {
        question: `${fracToStr(f1)} + ${fracToStr(f2)} = ?`,
        correct,
        distractors: nearFrac(correct, res),
      }
    }
    const p = FRAC_PARTS[Math.floor(Math.random() * FRAC_PARTS.length)]
    const f1 = fracFromParts(p.n, p.d)
    const f2 = fracFromParts(p.n, p.d)
    const res = fracSub(f1, f2)
    if (!res || res.n < 0) return null
    const correct = fracToStr(res)
    return {
      question: `${fracToStr(f1)} − ${fracToStr(f2)} = ?`,
      correct,
      distractors: nearFrac(correct, res),
    }
  })
  const medium = fillPool(seen, dungeon, level, 'medium', MIX.medium, () => {
    const a = FRAC_PARTS[Math.floor(Math.random() * FRAC_PARTS.length)]
    const b = FRAC_PARTS[Math.floor(Math.random() * FRAC_PARTS.length)]
    const f1 = fracFromParts(a.n, a.d)
    const f2 = fracFromParts(b.n, b.d)
    const op = Math.random() < 0.55 ? '+' : '−'
    const res = op === '+' ? fracAdd(f1, f2) : fracSub(f1, f2)
    if (!res || res.n <= 0 || res.n > res.d * 2) return null
    const correct = fracToStr(res)
    return {
      question: `${fracToStr(f1)} ${op === '+' ? '+' : '−'} ${fracToStr(f2)} = ?`,
      correct,
      distractors: nearFrac(correct, res),
    }
  })
  const hard = fillPool(seen, dungeon, level, 'hard', MIX.hard, () => {
    const kind = Math.floor(Math.random() * 2)
    const a = FRAC_PARTS[Math.floor(Math.random() * FRAC_PARTS.length)]
    const b = FRAC_PARTS[Math.floor(Math.random() * FRAC_PARTS.length)]
    const f1 = fracFromParts(a.n, a.d)
    const f2 = fracFromParts(b.n, b.d)
    if (kind === 0) {
      const res = fracMul(f1, f2)
      if (!res || res.n === 0) return null
      const correct = fracToStr(res)
      return {
        question: `${fracToStr(f1)} × ${fracToStr(f2)} = ?`,
        correct,
        distractors: nearFrac(correct, res),
      }
    }
    if (f2.n === 0) return null
    const res = fracDiv(f1, f2)
    if (!res || res.n === 0 || res.d === 0) return null
    const correct = fracToStr(res)
    return {
      question: `${fracToStr(f1)} ÷ ${fracToStr(f2)} = ?`,
      correct,
      distractors: nearFrac(correct, res),
    }
  })
  return [...easy, ...medium, ...hard]
}

const PCT_VALUES = [5, 10, 15, 20, 25, 30, 40, 50]

function buildPercentages(dungeon, level) {
  const seen = new Set()
  const easy = fillPool(seen, dungeon, level, 'easy', MIX.easy, () => {
    const pct = PCT_VALUES[Math.floor(Math.random() * PCT_VALUES.length)]
    const base = 10 * (2 + Math.floor(Math.random() * 18))
    const ans = (base * pct) / 100
    if (ans <= 0 || !Number.isInteger(ans)) return null
    return {
      question: `${pct}% от ${base} = ?`,
      correct: ans,
      distractors: nearInt(ans, 4),
    }
  })
  const medium = fillPool(seen, dungeon, level, 'medium', MIX.medium, () => {
    const pct = PCT_VALUES[1 + Math.floor(Math.random() * (PCT_VALUES.length - 1))]
    const price = 20 * (2 + Math.floor(Math.random() * 9))
    const discount = (price * pct) / 100
    if (!Number.isInteger(discount) || discount <= 0) return null
    const kind = Math.floor(Math.random() * 3)
    if (kind === 0) {
      const newPrice = price - discount
      return {
        question: `${price} − ${pct}% = ?`,
        correct: newPrice,
        distractors: nearInt(newPrice, 5),
      }
    }
    if (kind === 1) {
      return {
        question: `Скидка ${pct}% на ${price} = ?`,
        correct: discount,
        distractors: nearInt(discount, 4),
      }
    }
    const markup = discount
    const newPrice = price + markup
    return {
      question: `${price} + ${pct}% = ?`,
      correct: newPrice,
      distractors: nearInt(newPrice, 5),
    }
  })
  const hard = fillPool(seen, dungeon, level, 'hard', MIX.hard, () => {
    const kind = Math.floor(Math.random() * 2)
    if (kind === 0) {
      const pct = [10, 20, 25, 50][Math.floor(Math.random() * 4)]
      const whole = 20 * (2 + Math.floor(Math.random() * 8))
      const part = (whole * pct) / 100
      if (!Number.isInteger(part) || part <= 0) return null
      return {
        question: `${pct}% от ? = ${part}`,
        correct: whole,
        distractors: nearInt(whole, 10),
      }
    }
    const pct = [10, 20, 25][Math.floor(Math.random() * 3)]
    const part = 2 + Math.floor(Math.random() * 8)
    const whole = 20 + Math.floor(Math.random() * 30)
    const ans = Math.round((part / whole) * 100)
    if (ans !== pct && Math.abs(ans - pct) > 15) return null
    return {
      question: `${part} из ${whole} = ?%`,
      correct: ans,
      distractors: nearInt(ans, 5),
    }
  })
  return [...easy, ...medium, ...hard]
}

const BUILDERS = {
  'Пещера сложения': buildAddition,
  'Пещера вычитания': buildSubtraction,
  'Башня умножения': buildMultiplication,
  'Пещера деления': buildDivision,
  'Храм дробей': buildFractions,
  'Рынок процентов': buildPercentages,
}

export function buildAllQuestionBanks() {
  nextId = 10000
  const byDungeon = {}
  const meta = []

  for (const { name, level, slug } of DUNGEONS) {
    const questions = BUILDERS[name](name, level)
    byDungeon[name] = questions
    meta.push({
      name,
      slug,
      level,
      total: questions.length,
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
    })
  }

  return { byDungeon, meta, all: Object.values(byDungeon).flat() }
}

export { DUNGEONS, PER_DUNGEON }
