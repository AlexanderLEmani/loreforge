import type { SupabaseClient } from '@supabase/supabase-js'
import { todayIso } from '@/lib/guild-quests'
import { checkStudyStreakMastery } from '@/lib/mastery-achievements'

/** Цель дня: 20 минут активной практики */
export const DAILY_STUDY_TARGET_SECONDS = 20 * 60

/** Интервал heartbeat с клиента (секунды) */
export const STUDY_HEARTBEAT_SECONDS = 15

export type DailyStudyState = {
  seconds: number
  target: number
  date: string
  qualified: boolean
  streak: number
}

export function formatStudyMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function normalizeStudySeconds(
  seconds: number,
  studyDate: string | null | undefined,
  today = todayIso(),
): number {
  if (!studyDate || studyDate !== today) return 0
  return Math.max(0, seconds)
}

export function studyProgressRatio(seconds: number, target = DAILY_STUDY_TARGET_SECONDS): number {
  return Math.min(1, seconds / target)
}

function yesterdayIso(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0]
}

/** Сбрасывает стрик, если последний квалифицированный день был раньше вчера */
export function reconcileStreak(
  streak: number,
  lastVisit: string | null | undefined,
  today = todayIso(),
): { streak: number; broken: boolean } {
  if (!lastVisit || streak <= 0) return { streak: 0, broken: false }
  const yesterday = yesterdayIso()
  if (lastVisit === today || lastVisit === yesterday) return { streak, broken: false }
  return { streak: 0, broken: true }
}

export async function syncStreakOnVisit(
  supabase: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('users')
    .select('streak, last_visit')
    .eq('id', userId)
    .single()
  if (error || !data) return null

  const { streak, broken } = reconcileStreak(data.streak ?? 0, data.last_visit)
  if (!broken) return streak

  const { error: upErr } = await supabase.from('users').update({ streak: 0 }).eq('id', userId)
  if (upErr) {
    console.warn('syncStreakOnVisit:', upErr.message)
    return data.streak ?? 0
  }
  return 0
}

export async function fetchDailyStudy(
  supabase: SupabaseClient,
  userId: string,
): Promise<DailyStudyState> {
  const today = todayIso()
  const { data } = await supabase
    .from('users')
    .select('daily_study_seconds, daily_study_date, streak, last_visit')
    .eq('id', userId)
    .single()

  const seconds = normalizeStudySeconds(data?.daily_study_seconds ?? 0, data?.daily_study_date, today)
  const qualified = data?.last_visit === today && seconds >= DAILY_STUDY_TARGET_SECONDS

  return {
    seconds,
    target: DAILY_STUDY_TARGET_SECONDS,
    date: today,
    qualified,
    streak: data?.streak ?? 0,
  }
}

/** +15 с практики; при достижении цели — засчитывает день в стрик */
export async function recordStudyHeartbeat(
  supabase: SupabaseClient,
  userId: string,
): Promise<DailyStudyState | null> {
  const today = todayIso()
  const { data, error } = await supabase
    .from('users')
    .select('daily_study_seconds, daily_study_date, streak, last_visit')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  let seconds = normalizeStudySeconds(data.daily_study_seconds ?? 0, data.daily_study_date, today)
  const wasQualified = data.last_visit === today && seconds >= DAILY_STUDY_TARGET_SECONDS

  if (seconds < DAILY_STUDY_TARGET_SECONDS) {
    seconds = Math.min(DAILY_STUDY_TARGET_SECONDS, seconds + STUDY_HEARTBEAT_SECONDS)
  }

  const updates: Record<string, string | number> = {
    daily_study_seconds: seconds,
    daily_study_date: today,
  }

  const nowQualified = seconds >= DAILY_STUDY_TARGET_SECONDS
  let newStreak = data.streak ?? 0
  if (nowQualified && !wasQualified) {
    const lastVisit = data.last_visit
    newStreak = lastVisit === yesterdayIso() ? (data.streak ?? 0) + 1 : 1
    updates.streak = newStreak
    updates.last_visit = today
  }

  const { error: upErr } = await supabase.from('users').update(updates).eq('id', userId)
  if (upErr?.message?.includes('daily_study')) {
    return null
  }
  if (upErr) {
    console.warn('recordStudyHeartbeat:', upErr.message)
    return null
  }

  if (nowQualified && !wasQualified && newStreak > 0) {
    await checkStudyStreakMastery(supabase, userId, newStreak)
  }

  return {
    seconds,
    target: DAILY_STUDY_TARGET_SECONDS,
    date: today,
    qualified: nowQualified || wasQualified,
    streak: (updates.streak as number | undefined) ?? newStreak,
  }
}
