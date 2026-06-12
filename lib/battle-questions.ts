import type { BattleAttack } from '@/lib/battle-config'
import { shuffleQuestionAnswers } from '@/lib/shuffle-question'

export function getDifficultyPool(questions: any[], difficulty: string) {
  const filtered = questions.filter((q: any) => q.difficulty === difficulty)
  return filtered.length > 0 ? filtered : questions.filter((q: any) => q.difficulty === 'easy')
}

export function pickUnused(
  pool: any[],
  usedIds: Set<number>,
  onUse: (id: number) => void,
): any | null {
  if (pool.length === 0) return null
  const unused = pool.filter((q: any) => !usedIds.has(q.id))
  const source = unused.length > 0 ? unused : pool
  const q = source[Math.floor(Math.random() * source.length)]
  onUse(q.id)
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
