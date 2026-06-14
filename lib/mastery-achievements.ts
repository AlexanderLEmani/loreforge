import type { SupabaseClient } from '@supabase/supabase-js'
import { grantGlory } from '@/lib/glory-wallet'
import {
  MUL_SPRINT_ACHIEVEMENT_ACCURACY,
  MUL_SPRINT_ACHIEVEMENT_CORRECT,
  MUL_SPRINT_SECONDS,
} from '@/lib/mul-table'

export type MasteryId =
  | 'mul_sprint'
  | 'mul_master'
  | 'add_master'
  | 'sub_master'
  | 'div_master'
  | 'mnemonics_apprentice'
  | 'mnemonics_master'
  | 'practice_habit'
  | 'practice_week'

export type MasteryDef = {
  id: MasteryId
  title: string
  icon: string
  desc: string
  glory: number
}

export type TrainingSessionResult = {
  mode: 'guided' | 'clean' | 'speed'
  topics: string[]
  setupSource: 'topics' | 'scroll'
  scrollTag?: string | null
  correct: number
  total: number
  elapsedSeconds: number
}

export type MasteryUnlocks = Record<string, string>

export const MASTERY_DEFS: MasteryDef[] = [
  {
    id: 'mul_sprint',
    title: 'Спринтер таблицы',
    icon: '⚡',
    desc: `Умножение · спидран 3 мин · ${MUL_SPRINT_ACHIEVEMENT_CORRECT}+ верных · ≥${MUL_SPRINT_ACHIEVEMENT_ACCURACY}%`,
    glory: 60,
  },
  {
    id: 'mul_master',
    title: 'Мастер таблицы умножения',
    icon: '✕',
    desc: '20/20 умножение без подсказок',
    glory: 100,
  },
  {
    id: 'add_master',
    title: 'Мастер сложения',
    icon: '➕',
    desc: '20/20 сложение без подсказок',
    glory: 80,
  },
  {
    id: 'sub_master',
    title: 'Мастер вычитания',
    icon: '➖',
    desc: '20/20 вычитание без подсказок',
    glory: 80,
  },
  {
    id: 'div_master',
    title: 'Мастер деления',
    icon: '÷',
    desc: '20/20 деление без подсказок',
    glory: 90,
  },
  {
    id: 'mnemonics_apprentice',
    title: 'Ученик мнемоники',
    icon: '🧠',
    desc: '15+ верных на тренировке по свитку',
    glory: 50,
  },
  {
    id: 'mnemonics_master',
    title: 'Мастер мнемоники',
    icon: '📜',
    desc: '20/20 по свитку без подсказок',
    glory: 120,
  },
  {
    id: 'practice_habit',
    title: 'Ритм практики',
    icon: '🔥',
    desc: '20 минут практики · 3 дня подряд',
    glory: 40,
  },
  {
    id: 'practice_week',
    title: 'Дисциплина ученика',
    icon: '🏆',
    desc: '20 минут практики · 7 дней подряд',
    glory: 120,
  },
]

export function parseMasteryUnlocks(raw: unknown): MasteryUnlocks {
  if (!raw || typeof raw !== 'object') return {}
  return raw as MasteryUnlocks
}

function accuracyPct(correct: number, total: number): number {
  if (total <= 0) return 0
  return (correct / total) * 100
}

function topicsOnly(session: TrainingSessionResult, topic: string): boolean {
  return session.topics.length === 1 && session.topics[0] === topic
}

function matchesTraining(def: MasteryDef, session: TrainingSessionResult): boolean {
  const acc = accuracyPct(session.correct, session.total)

  switch (def.id) {
    case 'mul_sprint':
      return (
        session.mode === 'speed'
        && topicsOnly(session, 'mul')
        && session.correct >= MUL_SPRINT_ACHIEVEMENT_CORRECT
        && session.elapsedSeconds <= MUL_SPRINT_SECONDS
        && acc >= MUL_SPRINT_ACHIEVEMENT_ACCURACY
      )
    case 'mul_master':
      return (
        session.mode === 'clean'
        && topicsOnly(session, 'mul')
        && session.correct >= 20
        && session.total >= 20
        && acc >= 100
      )
    case 'add_master':
      return session.mode === 'clean' && topicsOnly(session, 'add') && session.correct >= 20 && session.total >= 20 && acc >= 100
    case 'sub_master':
      return session.mode === 'clean' && topicsOnly(session, 'sub') && session.correct >= 20 && session.total >= 20 && acc >= 100
    case 'div_master':
      return session.mode === 'clean' && topicsOnly(session, 'div') && session.correct >= 20 && session.total >= 20 && acc >= 100
    case 'mnemonics_apprentice':
      return (
        session.setupSource === 'scroll'
        && session.mode !== 'guided'
        && session.correct >= 15
        && acc >= 85
      )
    case 'mnemonics_master':
      return (
        session.setupSource === 'scroll'
        && session.mode === 'clean'
        && session.correct >= 20
        && session.total >= 20
        && acc >= 100
      )
    default:
      return false
  }
}

function matchesStudyStreak(def: MasteryDef, streak: number): boolean {
  if (def.id === 'practice_habit') return streak >= 3
  if (def.id === 'practice_week') return streak >= 7
  return false
}

export async function loadMasteryUnlocks(
  supabase: SupabaseClient,
  userId: string,
): Promise<MasteryUnlocks> {
  const { data, error } = await supabase.from('users').select('mastery_unlocks').eq('id', userId).single()
  if (error?.message?.includes('mastery_unlocks')) return {}
  return parseMasteryUnlocks(data?.mastery_unlocks)
}

async function unlockMastery(
  supabase: SupabaseClient,
  userId: string,
  def: MasteryDef,
  current: MasteryUnlocks,
): Promise<boolean> {
  if (current[def.id]) return false
  const next = { ...current, [def.id]: new Date().toISOString() }
  const { error } = await supabase.from('users').update({ mastery_unlocks: next }).eq('id', userId)
  if (error?.message?.includes('mastery_unlocks')) {
    console.warn('mastery_unlocks column missing — run migration')
    return false
  }
  if (error) {
    console.warn('unlockMastery:', error.message)
    return false
  }
  if (def.glory > 0) await grantGlory(supabase, userId, def.glory)
  return true
}

export async function checkTrainingMastery(
  supabase: SupabaseClient,
  userId: string,
  session: TrainingSessionResult,
): Promise<MasteryDef[]> {
  const unlocked = await loadMasteryUnlocks(supabase, userId)
  const granted: MasteryDef[] = []

  for (const def of MASTERY_DEFS) {
    if (unlocked[def.id]) continue
    if (!matchesTraining(def, session)) continue
    const ok = await unlockMastery(supabase, userId, def, unlocked)
    if (ok) {
      unlocked[def.id] = new Date().toISOString()
      granted.push(def)
    }
  }

  return granted
}

export async function checkStudyStreakMastery(
  supabase: SupabaseClient,
  userId: string,
  streak: number,
): Promise<MasteryDef[]> {
  const unlocked = await loadMasteryUnlocks(supabase, userId)
  const granted: MasteryDef[] = []

  for (const def of MASTERY_DEFS) {
    if (unlocked[def.id]) continue
    if (!matchesStudyStreak(def, streak)) continue
    const ok = await unlockMastery(supabase, userId, def, unlocked)
    if (ok) {
      unlocked[def.id] = new Date().toISOString()
      granted.push(def)
    }
  }

  return granted
}

export function masteryProgressHint(def: MasteryDef, unlocked: MasteryUnlocks): string {
  if (unlocked[def.id]) return 'Получено'
  return def.desc
}
