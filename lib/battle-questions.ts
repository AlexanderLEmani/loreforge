import type { BattleAttack, Difficulty } from '@/lib/battle-config'
import { shuffleQuestionAnswers } from '@/lib/shuffle-question'

export function questionKey(q: { id?: number | string; question?: string }): string {
  const text = (q.question || '').trim()
  return text ? text : `id:${q.id}`
}

const FRACTION_CHARS = /[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/

/** Нормализует сложность — в БД часто поле пустое */
export function normalizeQuestionDifficulty(q: any): any {
  if (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') return q

  const text = String(q.question || '')
  const hasFraction = FRACTION_CHARS.test(text) || /\d+\s*\/\s*\d+/.test(text)

  if (hasFraction) {
    const ops = (text.match(/[+\-−×÷]/g) || []).length
    const fracCount = (text.match(FRACTION_CHARS) || []).length + (text.match(/\d+\s*\/\s*\d+/g) || []).length
    let difficulty: Difficulty = 'easy'
    if (text.includes('×') || text.includes('÷') || ops >= 2) {
      difficulty = 'hard'
    } else if (fracCount >= 2 || text.includes('−') || text.includes('-')) {
      difficulty = 'medium'
    }
    return { ...q, difficulty }
  }

  const nums = [...text.matchAll(/\d+/g)].map(m => parseInt(m[0], 10))
  const max = nums.length ? Math.max(...nums) : 0
  let difficulty: Difficulty = 'easy'
  if (nums.length >= 3 || max >= 100 || text.includes('+') && text.split('+').length > 2) {
    difficulty = 'hard'
  } else if (max > 20 || nums.length >= 2 || text.length > 12) {
    difficulty = 'medium'
  }
  return { ...q, difficulty }
}

/**
 * Пул для атаки: hard никогда не падает на easy (только hard → medium).
 */
export function getDifficultyPool(questions: any[], difficulty: Difficulty): any[] {
  const normalized = questions.map(normalizeQuestionDifficulty)
  const by = (d: Difficulty) => normalized.filter(q => q.difficulty === d)

  if (difficulty === 'hard') {
    const hard = by('hard')
    if (hard.length) return hard
    const medium = by('medium')
    if (medium.length) return medium
    return hard.length || medium.length ? [...hard, ...medium] : normalized
  }
  if (difficulty === 'medium') {
    const medium = by('medium')
    if (medium.length) return medium
    const hard = by('hard')
    if (hard.length) return hard
    return by('easy').length ? by('easy') : normalized
  }
  const easy = by('easy')
  if (easy.length) return easy
  return by('medium').length ? by('medium') : normalized
}

export function pickUnused(
  pool: any[],
  usedIds: Set<number>,
  usedTexts: Set<string>,
  onUse: (q: any) => void,
): any | null {
  if (pool.length === 0) return null

  const isUsed = (q: any) => usedIds.has(q.id) || usedTexts.has(questionKey(q))

  let candidates = pool.filter(q => !isUsed(q))

  if (candidates.length === 0) {
    candidates = pool.filter(q => !usedTexts.has(questionKey(q)))
  }
  if (candidates.length === 0) return null

  const q = candidates[Math.floor(Math.random() * candidates.length)]
  onUse(q)
  return shuffleQuestionAnswers(q)
}

export function poolForAttack(attack: BattleAttack, questionBank: Record<string, any[]>): any[] {
  const merged: any[] = []
  for (const dungeon of attack.dungeons) {
    const chunk = questionBank[dungeon]
    if (chunk) merged.push(...chunk)
  }
  return merged
}
