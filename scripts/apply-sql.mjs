/**
 * Применяет SQL-файл к Supabase Postgres через DATABASE_URL из .env.local
 * Usage: node scripts/apply-sql.mjs supabase/skill_tree.sql
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

const file = process.argv[2] || 'supabase/skill_tree.sql'
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!databaseUrl) {
  console.error(
    'DATABASE_URL не найден в .env.local\n\n' +
      'Добавь строку из Supabase → Project Settings → Database → Connection string → URI:\n' +
      'DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-....pooler.supabase.com:6543/postgres\n'
  )
  process.exit(1)
}

const sqlPath = path.isAbsolute(file) ? file : path.join(root, file)
if (!fs.existsSync(sqlPath)) {
  console.error('Файл не найден:', sqlPath)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf8')
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(sql)
  console.log('OK:', sqlPath)
} catch (err) {
  console.error('SQL error:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
