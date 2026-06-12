/**
 * Заполняет таблицу questions для первых двух уровней (4 данжа).
 * Usage: node scripts/seed-questions.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env.local')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile(envPath)

function shuffleAnswers(correct, distractors) {
  const answers = [correct, ...distractors]
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[answers[i], answers[j]] = [answers[j], answers[i]]
  }
  return { answers, correct_index: answers.indexOf(correct) }
}

function near(n, spread = 3) {
  const opts = new Set()
  while (opts.size < 3) {
    const delta = Math.floor(Math.random() * spread * 2 + 1) - spread
    const v = n + delta
    if (v !== n && v >= 0) opts.add(String(v))
  }
  return [...opts]
}

function q(dungeon, question, correct, distractors, level, difficulty) {
  const { answers, correct_index } = shuffleAnswers(String(correct), distractors.map(String))
  return { dungeon_name: dungeon, question, answers, correct_index, level, difficulty }
}

// --- Пещера сложения (ур. 1) ---
function additionQuestions() {
  const out = []
  const dungeon = 'Пещера сложения'

  // easy: однозначные и простые двузначные
  const easyPairs = [
    [3, 4], [5, 2], [6, 7], [8, 1], [9, 5], [4, 6], [7, 3], [2, 9],
    [12, 5], [23, 4], [34, 6], [45, 3], [56, 2], [18, 7], [27, 8],
    [31, 9], [42, 5], [53, 6], [64, 3], [75, 4],
  ]
  for (const [a, b] of easyPairs) {
    const ans = a + b
    out.push(q(dungeon, `${a} + ${b} = ?`, ans, near(ans, 2), 1, 'easy'))
  }

  // medium: двузначные + двузначные, три слагаемых
  const mediumSpecs = [
    () => { const a = 24 + Math.floor(Math.random() * 40), b = 17 + Math.floor(Math.random() * 35); return [`${a} + ${b} = ?`, a + b] },
    () => { const a = 35, b = 28, c = 14; return [`${a} + ${b} + ${c} = ?`, a + b + c] },
    () => { const a = 47, b = 23, c = 9; return [`${a} + ${b} + ${c} = ?`, a + b + c] },
    () => { return ['(45 + 28) + 19 = ?', 92] },
    () => { return ['(12 + 8) + 35 = ?', 55] },
    () => { return ['(34 + 17) + 28 = ?', 79] },
    () => { return ['47 + (23 + 9) = ?', 79] },
    () => { return ['56 + 37 + 14 = ?', 107] },
    () => { return ['38 + 46 + 25 = ?', 109] },
    () => { return ['29 + 58 + 13 = ?', 100] },
    () => { return ['63 + 28 + 9 = ?', 100] },
    () => { return ['41 + 35 + 24 = ?', 100] },
  ]
  for (const spec of mediumSpecs) {
    const [question, ans] = spec()
    out.push(q(dungeon, question, ans, near(ans, 4), 1, 'medium'))
  }

  // hard: крупные суммы, скобки
  const hardSpecs = [
    ['174 + 239 + 88 = ?', 501],
    ['246 + (138 + 75) = ?', 459],
    ['(123 + 47) + 89 = ?', 259],
    ['385 + 67 + 148 = ?', 600],
    ['(457 + 84) + 163 = ?', 704],
    ['298 + 156 + 74 = ?', 528],
    ['(189 + 92) + 115 = ?', 396],
    ['320 + 185 + 96 = ?', 601],
    ['(275 + 48) + 167 = ?', 490],
    ['412 + 98 + 54 = ?', 564],
  ]
  for (const [question, ans] of hardSpecs) {
    out.push(q(dungeon, question, ans, near(ans, 8), 1, 'hard'))
  }

  return out
}

// --- Пещера вычитания (ур. 1) ---
function subtractionQuestions() {
  const out = []
  const dungeon = 'Пещера вычитания'

  const easyPairs = [
    [9, 3], [8, 5], [7, 2], [6, 4], [15, 8], [14, 6], [13, 7], [12, 5],
    [43, 17], [50, 23], [61, 34], [63, 28], [72, 45], [76, 38], [84, 49],
    [85, 37], [91, 54], [95, 67], [88, 39], [77, 28],
  ]
  for (const [a, b] of easyPairs) {
    const ans = a - b
    out.push(q(dungeon, `${a} − ${b} = ?`, ans, near(ans, 2), 1, 'easy'))
  }

  const mediumSpecs = [
    ['100 − 38 − 24 = ?', 38],
    ['(80 − 23) − 14 = ?', 43],
    ['(88 − 34) − 17 = ?', 37],
    ['(74 − 19) − 26 = ?', 29],
    ['95 − (27 + 18) = ?', 50],
    ['120 − 45 − 28 = ?', 47],
    ['(65 − 18) − 12 = ?', 35],
    ['150 − 67 − 34 = ?', 49],
    ['(92 − 35) − 19 = ?', 38],
    ['110 − (42 + 18) = ?', 50],
    ['(78 − 29) − 16 = ?', 33],
    ['135 − 58 − 27 = ?', 50],
  ]
  for (const [question, ans] of mediumSpecs) {
    out.push(q(dungeon, question, ans, near(ans, 4), 1, 'medium'))
  }

  const hardSpecs = [
    ['400 − 156 − 87 = ?', 157],
    ['(347 − 89) − 124 = ?', 134],
    ['(623 − 178) − 95 = ?', 350],
    ['(734 − 267) − 143 = ?', 324],
    ['500 − (147 + 83) = ?', 270],
    ['612 − 248 − 135 = ?', 229],
    ['(580 − 193) − 142 = ?', 245],
    ['750 − (289 + 156) = ?', 305],
  ]
  for (const [question, ans] of hardSpecs) {
    out.push(q(dungeon, question, ans, near(ans, 8), 1, 'hard'))
  }

  return out
}

// --- Башня умножения (ур. 2) ---
function multiplicationQuestions() {
  const out = []
  const dungeon = 'Башня умножения'

  const easyPairs = [
    [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 6],
    [7, 7], [8, 8], [9, 9], [6, 6], [5, 9], [4, 7], [3, 8], [2, 9],
    [7, 9], [8, 6], [9, 4], [6, 8],
  ]
  for (const [a, b] of easyPairs) {
    const ans = a * b
    out.push(q(dungeon, `${a} × ${b} = ?`, ans, near(ans, 3), 2, 'easy'))
  }

  const mediumSpecs = [
    ['(3 × 9) + 12 = ?', 39],
    ['(4 × 8) − 11 = ?', 21],
    ['(6 × 7) + 13 = ?', 55],
    ['(7 × 7) + 15 = ?', 64],
    ['(8 × 7) + 8 = ?', 64],
    ['(8 × 9) − 24 = ?', 48],
    ['(9 × 6) − 11 = ?', 43],
    ['5 × 8 + 7 = ?', 47],
    ['7 × 6 − 5 = ?', 37],
    ['9 × 5 + 14 = ?', 59],
    ['(12 × 3) + 6 = ?', 42],
    ['(11 × 4) − 8 = ?', 36],
  ]
  for (const [question, ans] of mediumSpecs) {
    out.push(q(dungeon, question, ans, near(ans, 5), 2, 'medium'))
  }

  const hardSpecs = [
    ['(11 × 12) − 47 = ?', 85],
    ['(12 × 11) − 34 = ?', 98],
    ['(13 × 9) + 26 = ?', 143],
    ['(14 × 8) − 35 = ?', 77],
    ['(14 × 8) + 19 = ?', 131],
    ['(15 × 7) − 38 = ?', 67],
    ['13 × 6 + 25 = ?', 103],
    ['15 × 8 − 27 = ?', 93],
    ['(11 × 9) − 18 = ?', 81],
    ['(12 × 7) + 34 = ?', 118],
  ]
  for (const [question, ans] of hardSpecs) {
    out.push(q(dungeon, question, ans, near(ans, 10), 2, 'hard'))
  }

  return out
}

// --- Пещера деления (ур. 2) ---
function divisionQuestions() {
  const out = []
  const dungeon = 'Пещера деления'

  const easyPairs = [
    [12, 3], [16, 4], [20, 4], [24, 6], [28, 7], [30, 5], [36, 6], [42, 6],
    [45, 9], [48, 8], [56, 7], [63, 7], [64, 8], [72, 8], [81, 9], [54, 9],
    [35, 7], [32, 8], [27, 9], [40, 5],
  ]
  for (const [a, b] of easyPairs) {
    const ans = a / b
    out.push(q(dungeon, `${a} ÷ ${b} = ?`, ans, near(ans, 2), 2, 'easy'))
  }

  const mediumSpecs = [
    ['(24 ÷ 4) + 3 = ?', 9],
    ['(48 ÷ 6) + 12 = ?', 20],
    ['(56 ÷ 7) − 4 = ?', 4],
    ['(63 ÷ 9) × 3 = ?', 21],
    ['(72 ÷ 9) × 2 = ?', 16],
    ['(36 ÷ 6) + 15 = ?', 21],
    ['(45 ÷ 5) − 3 = ?', 6],
    ['(54 ÷ 6) + 8 = ?', 17],
    ['(80 ÷ 8) + 5 = ?', 15],
    ['(49 ÷ 7) × 4 = ?', 28],
    ['(60 ÷ 5) − 6 = ?', 6],
    ['(84 ÷ 7) + 9 = ?', 21],
  ]
  for (const [question, ans] of mediumSpecs) {
    out.push(q(dungeon, question, ans, near(ans, 4), 2, 'medium'))
  }

  const hardSpecs = [
    ['(132 ÷ 11) + 48 = ?', 60],
    ['(144 ÷ 12) + 35 = ?', 47],
    ['(180 ÷ 9) × 4 = ?', 80],
    ['(225 ÷ 15) − 8 = ?', 7],
    ['(256 ÷ 8) − 17 = ?', 15],
    ['(168 ÷ 12) + 29 = ?', 43],
    ['(210 ÷ 14) × 3 = ?', 45],
    ['(315 ÷ 9) − 18 = ?', 17],
  ]
  for (const [question, ans] of hardSpecs) {
    out.push(q(dungeon, question, ans, near(ans, 6), 2, 'hard'))
  }

  return out
}

const DUNGEONS = [
  'Пещера сложения',
  'Пещера вычитания',
  'Башня умножения',
  'Пещера деления',
]

const allQuestions = [
  ...additionQuestions(),
  ...subtractionQuestions(),
  ...multiplicationQuestions(),
  ...divisionQuestions(),
]

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!databaseUrl) {
  console.error('DATABASE_URL не найден в .env.local')
  process.exit(1)
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query('BEGIN')

  for (const d of DUNGEONS) {
    const del = await client.query('DELETE FROM questions WHERE dungeon_name = $1', [d])
    console.log(`Удалено из «${d}»: ${del.rowCount}`)
  }

  for (const row of allQuestions) {
    await client.query(
      `INSERT INTO questions (dungeon_name, question, answers, correct_index, level, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [row.dungeon_name, row.question, row.answers, row.correct_index, row.level, row.difficulty],
    )
  }

  await client.query('COMMIT')

  const stats = await client.query(`
    SELECT dungeon_name, difficulty, count(*)::int AS n,
           array_agg(correct_index ORDER BY random()) FILTER (WHERE true) AS sample_indices
    FROM questions
    WHERE dungeon_name = ANY($1)
    GROUP BY dungeon_name, difficulty
    ORDER BY dungeon_name, difficulty
  `, [DUNGEONS])

  console.log('\nИтого вставлено:', allQuestions.length)
  for (const row of stats.rows) {
    const dist = {}
    for (const idx of row.sample_indices) dist[idx] = (dist[idx] || 0) + 1
    console.log(`${row.dungeon_name} / ${row.difficulty}: ${row.n} вопросов, индексы:`, dist)
  }
} catch (err) {
  await client.query('ROLLBACK')
  console.error('Ошибка:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
