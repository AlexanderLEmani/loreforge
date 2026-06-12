/**
 * Заполняет таблицу questions — 100 примеров на каждый данж.
 * Usage: node scripts/seed-questions.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import { buildAllQuestionBanks } from './lib/question-bank.mjs'

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

const { byDungeon, meta, all: allQuestions } = buildAllQuestionBanks()
const DUNGEON_NAMES = meta.map(m => m.name)

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!databaseUrl) {
  console.error('DATABASE_URL не найден в .env.local')
  process.exit(1)
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query('BEGIN')

  for (const d of DUNGEON_NAMES) {
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

  const stats = await client.query(
    `
    SELECT dungeon_name, difficulty, count(*)::int AS n
    FROM questions
    WHERE dungeon_name = ANY($1)
    GROUP BY dungeon_name, difficulty
    ORDER BY dungeon_name, difficulty
  `,
    [DUNGEON_NAMES],
  )

  console.log('\nИтого вставлено:', allQuestions.length)
  for (const row of stats.rows) {
    console.log(`${row.dungeon_name} / ${row.difficulty}: ${row.n}`)
  }

  for (const m of meta) {
    const n = byDungeon[m.name].length
    if (n < 100) console.warn(`⚠ ${m.name}: только ${n} вопросов`)
  }
} catch (err) {
  await client.query('ROLLBACK')
  console.error('Ошибка:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
