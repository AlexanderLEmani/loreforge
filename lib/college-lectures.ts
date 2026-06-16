import type { LectureActionDef } from '@/lib/lecture-actions'
import lecture1 from '@/lib/lectures/1.json'
import lecture2 from '@/lib/lectures/2.json'
import lecture3 from '@/lib/lectures/3.json'
import lecture4 from '@/lib/lectures/4.json'

export type LectureSection = {
  type: string
  text?: string
  hint?: string
  actions?: LectureActionDef[]
}

export type Lecture = {
  title: string
  sections: LectureSection[]
}

/** Единственный источник текста лекций — JSON в lib/lectures/ (не Supabase) */
export const FALLBACK_LECTURES: Record<number, Lecture> = {
  1: lecture1 as Lecture,
  2: lecture2 as Lecture,
  3: lecture3 as Lecture,
  4: lecture4 as Lecture,
}


export function lectureLevelForUser(level: number): number {
  if (level <= 1) return 1
  if (level >= 4) return 4
  return level
}

export function getLectureForLevel(level: number): Lecture {
  const lectureLevel = lectureLevelForUser(level)
  return FALLBACK_LECTURES[lectureLevel] || FALLBACK_LECTURES[1]
}

export const LECTURE_NUMS = ['I', 'II', 'III', 'IV'] as const

export const LECTURE_META = [
  { level: 1, num: 'I', title: 'Введение в арифметику' },
  { level: 2, num: 'II', title: 'Умножение и деление' },
  { level: 3, num: 'III', title: 'Дроби' },
  { level: 4, num: 'IV', title: 'Проценты' },
] as const

/** Сигналы прогресса для архива лекций (игровой level + старые сохранения) */
export type LectureUnlockContext = {
  userLevel: number
  completedLectures?: number[]
  learnedSpellLectureMax?: number
  skillNodeLectureMax?: number
}

export function maxUnlockedLectureLevel(ctx: LectureUnlockContext | number): number {
  const c: LectureUnlockContext = typeof ctx === 'number' ? { userLevel: ctx } : ctx
  const fromLevel = lectureLevelForUser(c.userLevel)
  const fromCompleted = c.completedLectures?.length ? Math.max(...c.completedLectures) : 0
  const fromSpells = c.learnedSpellLectureMax ?? 0
  const fromSkills = c.skillNodeLectureMax ?? 0
  return Math.min(4, Math.max(1, fromLevel, fromCompleted, fromSpells, fromSkills))
}

/** Уровень для UI лавки/сайдбара — учитывает старые сохранения без exam level */
export function effectivePlayerLevel(ctx: LectureUnlockContext | number): number {
  const c: LectureUnlockContext = typeof ctx === 'number' ? { userLevel: ctx } : ctx
  const fromCompleted = c.completedLectures?.length ? Math.max(...c.completedLectures) : 0
  return Math.max(
    c.userLevel,
    fromCompleted,
    c.learnedSpellLectureMax ?? 0,
    c.skillNodeLectureMax ?? 0,
  )
}

export function isLectureUnlocked(lectureLevel: number, ctx: LectureUnlockContext | number): boolean {
  return lectureLevel >= 1 && lectureLevel <= maxUnlockedLectureLevel(ctx)
}

export function getLectureList(ctx: LectureUnlockContext | number, viewingLevel: number) {
  const c: LectureUnlockContext = typeof ctx === 'number' ? { userLevel: ctx } : ctx
  const maxUnlocked = maxUnlockedLectureLevel(c)
  const current = lectureLevelForUser(c.userLevel)
  return LECTURE_META.map(meta => ({
    ...meta,
    unlocked: meta.level <= maxUnlocked,
    isCurrent: meta.level === current,
    isViewing: meta.level === viewingLevel,
    done: meta.level < current,
  }))
}

/** Ревизия контента в FALLBACK; явный маркер в БД (CMS) */
export const LECTURE_CONTENT_REVISION = 5

/** @deprecated Коллегия читает только FALLBACK */
export function resolveLecture(levelNum: number, _fromDb?: Lecture | null): Lecture {
  return FALLBACK_LECTURES[levelNum] || FALLBACK_LECTURES[1]
}
