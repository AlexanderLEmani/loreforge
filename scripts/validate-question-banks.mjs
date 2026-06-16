/**
 * Проверка банков вопросов (локальные JSON + опционально БД).
 * Usage: node scripts/validate-question-banks.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const banksDir = path.join(root, 'data', 'question-banks')

const UNICODE_TO_FRACTION = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6',
  '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
}

const INTEGER_DUNGEONS = new Set([
  'Пещера сложения',
  'Пещера вычитания',
  'Башня умножения',
  'Пещера деления',
])

function expandUnicodeFractions(s) {
  let out = s
  for (const [unicode, ascii] of Object.entries(UNICODE_TO_FRACTION)) {
    out = out.split(unicode).join(ascii)
  }
  return out
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

function parseRational(raw) {
  const s = expandUnicodeFractions(raw.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.'))
  if (!s) return null
  const frac = s.match(/^(-?\d+)\/(-?\d+)$/)
  if (frac) {
    const n = parseInt(frac[1], 10)
    const d = parseInt(frac[2], 10)
    if (d === 0) return null
    const g = gcd(n, d)
    return { n: n / g, d: d / g }
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const f = parseFloat(s)
    if (!Number.isFinite(f)) return null
    const n = Math.round(f * 10000)
    const d = 10000
    const g = gcd(n, d)
    return { n: n / g, d: d / g }
  }
  return null
}

function canonicalAnswer(s) {
  const rational = parseRational(s)
  if (rational) {
    if (rational.d === 1) return String(rational.n)
    return `${rational.n}/${rational.d}`
  }
  return expandUnicodeFractions(s.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.'))
}

function answersMatch(player, correct) {
  const a = canonicalAnswer(player)
  const b = canonicalAnswer(correct)
  if (a === b) return true
  const pa = parseRational(player)
  const pb = parseRational(correct)
  if (pa && pb) return pa.n === pb.n && pa.d === pb.d
  return false
}

function normalizeMathExpr(expr) {
  return expr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
}

function evaluateIntegerExpression(expr) {
  const cleaned = normalizeMathExpr(expr)
  if (!cleaned || !/^[0-9+\-*/()]+$/.test(cleaned)) return null
  try {
    const value = Function(`"use strict"; return (${cleaned})`)()
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) return null
    return value
  } catch {
    return null
  }
}

function expectedIntegerAnswer(question) {
  const match = question.match(/^(.+?)\s*=\s*\??\s*$/)
  if (!match) return null
  return evaluateIntegerExpression(match[1])
}

function isValid(q) {
  const correct = q.answers?.[q.correct_index]
  if (!correct) return false
  const dungeon = q.dungeon_name
  if (INTEGER_DUNGEONS.has(dungeon)) {
    const expected = expectedIntegerAnswer(q.question)
    if (expected === null) return false
    return answersMatch(String(expected), correct)
  }
  return true
}

function auditQuestions(label, questions) {
  const bad = []
  for (const q of questions) {
    if (!isValid(q)) {
      bad.push({
        id: q.id,
        question: q.question,
        correct: q.answers?.[q.correct_index],
        dungeon: q.dungeon_name,
      })
    }
  }
  if (bad.length) {
    console.log(`\n${label}: ${bad.length} invalid`)
    for (const row of bad.slice(0, 15)) {
      const expected = expectedIntegerAnswer(row.question)
      console.log(`  [${row.id}] ${row.question} → expected ${expected}, got ${row.correct}`)
    }
    if (bad.length > 15) console.log(`  … and ${bad.length - 15} more`)
  } else {
    console.log(`${label}: OK (${questions.length})`)
  }
  return bad.length
}

let totalBad = 0
const slugs = fs.readdirSync(banksDir).filter(f => f.endsWith('.json') && f !== 'index.json')
for (const file of slugs) {
  const questions = JSON.parse(fs.readFileSync(path.join(banksDir, file), 'utf8'))
  totalBad += auditQuestions(file, questions)
}

const envPath = path.join(root, '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (databaseUrl) {
    try {
      const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
      await client.connect()
      const { rows } = await client.query(
        'SELECT id, dungeon_name, question, answers, correct_index FROM questions ORDER BY dungeon_name, id',
      )
      totalBad += auditQuestions('Supabase questions', rows)
      await client.end()
    } catch (err) {
      console.warn('Supabase audit skipped:', err.message)
    }
  }
}

if (totalBad > 0) {
  console.log(`\nTotal invalid: ${totalBad}. Run: node scripts/seed-questions.mjs`)
  process.exit(1)
}

console.log('\nAll question banks valid.')
