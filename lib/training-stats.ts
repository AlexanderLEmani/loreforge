import type { SupabaseClient } from '@supabase/supabase-js'

export type TrainingStats = {
  sessionsToday: number
  totalSolved: number
  accuracy: number | null
  bestStreak: number
  source: 'question_attempts' | 'dungeon_runs' | 'none'
}

type AttemptRow = {
  is_correct: boolean
  session_id: string | null
  created_at: string
  source: string | null
}

type RunRow = {
  score: number
  total: number
  created_at: string | null
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
