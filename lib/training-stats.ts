import type { SupabaseClient } from '@supabase/supabase-js'

export type TrainingStats = {
  sessionsToday: number
  totalSolved: number
  accuracy: number | null
  bestStreak: number
  source: 'question_attempts' | 'dungeon_runs' | 'none'
}

export type TopicProgressMap = Record<string, number | null>

const DUNGEON_TO_TOPIC: Record<string, string> = {
  'Пещера сложения': 'add',
  'Пещера вычитания': 'sub',
  'Башня умножения': 'mul',
  'Пещера деления': 'div',
  'Храм дробей': 'frac',
  'Рынок процентов': 'pct',
}

type AttemptRow = {
  is_correct: boolean
  session_id: string | null
  created_at: string
  source: string | null
  dungeon_name?: string | null
}

type RunRow = {
  score: number
  total: number
  created_at: string | null
  dungeon_name?: string | null
}

function topicIdFromDungeon(dungeonName: string | null | undefined) {
  if (!dungeonName) return null
  return DUNGEON_TO_TOPIC[dungeonName] ?? null
}

function aggregateByTopic(entries: { topicId: string | null; correct: number; total: number }[]): TopicProgressMap {
  const map: Record<string, { correct: number; total: number }> = {}
  for (const { topicId, correct, total } of entries) {
    if (!topicId) continue
    if (!map[topicId]) map[topicId] = { correct: 0, total: 0 }
    map[topicId].correct += correct
    map[topicId].total += total
  }
  const result: TopicProgressMap = {}
  for (const [id, { correct, total }] of Object.entries(map)) {
    result[id] = total > 0 ? Math.round((correct / total) * 100) : null
  }
  return result
}

function todayStartIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function computeFromAttempts(attempts: AttemptRow[], todayIso: string): TrainingStats {
  const totalSolved = attempts.length
  const correct = attempts.filter(a => a.is_correct).length
  const accuracy = totalSolved > 0 ? Math.round((correct / totalSolved) * 100) : null

  let bestStreak = 0
  let current = 0
  for (const a of attempts) {
    if (a.is_correct) {
      current++
      bestStreak = Math.max(bestStreak, current)
    } else {
      current = 0
    }
  }

  const sessionsToday = new Set(
    attempts
      .filter(a => a.created_at >= todayIso && a.session_id && a.source === 'training')
      .map(a => a.session_id)
  ).size

  return { sessionsToday, totalSolved, accuracy, bestStreak, source: 'question_attempts' }
}

function computeFromDungeonRuns(runs: RunRow[], todayIso: string): TrainingStats {
  const totalSolved = runs.reduce((s, r) => s + (r.total || 0), 0)
  const correct = runs.reduce((s, r) => s + (r.score || 0), 0)
  const accuracy = totalSolved > 0 ? Math.round((correct / totalSolved) * 100) : null
  const sessionsToday = runs.filter(r => r.created_at && r.created_at >= todayIso).length

  return {
    sessionsToday,
    totalSolved,
    accuracy,
    bestStreak: 0,
    source: 'dungeon_runs',
  }
}

export async function loadTrainingStats(
  supabase: SupabaseClient,
  userId: string
): Promise<TrainingStats> {
  const todayIso = todayStartIso()
  const empty: TrainingStats = { sessionsToday: 0, totalSolved: 0, accuracy: null, bestStreak: 0, source: 'none' }

  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempts')
    .select('is_correct, session_id, created_at, source')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!attemptsError && attempts && attempts.length > 0) {
    return computeFromAttempts(attempts as AttemptRow[], todayIso)
  }

  const { data: runs, error: runsError } = await supabase
    .from('dungeon_runs')
    .select('score, total, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (!runsError && runs && runs.length > 0) {
    return computeFromDungeonRuns(runs as RunRow[], todayIso)
  }

  return empty
}

export async function loadTopicProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<TopicProgressMap> {
  const { data: attempts, error: attemptsError } = await supabase
    .from('question_attempts')
    .select('is_correct, dungeon_name')
    .eq('user_id', userId)

  if (!attemptsError && attempts && attempts.length > 0) {
    return aggregateByTopic(
      (attempts as Pick<AttemptRow, 'is_correct' | 'dungeon_name'>[]).map(a => ({
        topicId: topicIdFromDungeon(a.dungeon_name),
        correct: a.is_correct ? 1 : 0,
        total: 1,
      }))
    )
  }

  const { data: runs, error: runsError } = await supabase
    .from('dungeon_runs')
    .select('score, total, dungeon_name')
    .eq('user_id', userId)

  if (!runsError && runs && runs.length > 0) {
    return aggregateByTopic(
      (runs as Pick<RunRow, 'score' | 'total' | 'dungeon_name'>[]).map(r => ({
        topicId: topicIdFromDungeon(r.dungeon_name),
        correct: r.score || 0,
        total: r.total || 0,
      }))
    )
  }

  return {}
}

export async function recordBattleAttempt(
  supabase: SupabaseClient,
  payload: {
    userId: string
    questionId: string | number
    isCorrect: boolean
    dungeonName?: string
  },
) {
  await supabase.from('question_attempts').insert({
    user_id: payload.userId,
    question_id: String(payload.questionId),
    is_correct: payload.isCorrect,
    source: 'battle',
    session_id: null,
    dungeon_name: payload.dungeonName ?? null,
  })
}

export async function recordTrainingAttempt(
  supabase: SupabaseClient,
  payload: {
    userId: string
    questionId: string
    isCorrect: boolean
    sessionId: string
    dungeonName?: string
  }
) {
  await supabase.from('question_attempts').insert({
    user_id: payload.userId,
    question_id: payload.questionId,
    is_correct: payload.isCorrect,
    source: 'training',
    session_id: payload.sessionId,
    dungeon_name: payload.dungeonName ?? null,
  })
}
