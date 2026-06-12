/**
 * Генерирует JSON-банки (100 примеров на данж) для fallback без БД.
 * Usage: node scripts/generate-question-banks.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildAllQuestionBanks } from './lib/question-bank.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'data', 'question-banks')

const { byDungeon, meta } = buildAllQuestionBanks()

fs.mkdirSync(outDir, { recursive: true })

for (const m of meta) {
  const file = path.join(outDir, `${m.slug}.json`)
  fs.writeFileSync(file, JSON.stringify(byDungeon[m.name], null, 0))
  console.log(`${m.slug}: ${m.total} (easy ${m.easy}, medium ${m.medium}, hard ${m.hard})`)
}

const index = meta.map(m => ({ dungeon_name: m.name, slug: m.slug, file: `${m.slug}.json`, count: m.total }))
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2))
console.log('\nГотово:', outDir)
