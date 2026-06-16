import type { LectureActionDef } from '@/lib/lecture-actions'
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

/** Локальный fallback если в БД нет строки для уровня */
export const FALLBACK_LECTURES: Record<number, Lecture> = {
  1: {
    title: 'Введение в арифметику',
    sections: [
      {
        type: 'professor',
        text: 'Садись. Меня зовут Горус. Имена не спрашиваю: если ты в этой аудитории, ты уже решил, что считать лучше, чем жаловаться.',
      },
      {
        type: 'heading',
        text: 'Число старше колеса',
      },
      {
        type: 'text',
        text: 'Вавилон считал зерно. Индия придумала ноль. Математику не изобрели скучные люди в кабинетах. Её изобрели налоги, хлеб и скука. Ты здесь не за музеем. Но знай: числа — не наказание. Это язык, который работает.',
      },
      {
        type: 'heading',
        text: 'Сложение',
      },
      {
        type: 'text',
        text: 'Объединяешь группы в одну сумму. В бою заклинание сложения живёт от темпа: считаешь медленно — бьёшь медленно.',
      },
      {
        type: 'formula',
        text: 'a + b = b + a',
        hint: 'В сложении порядок не важен. В жизни — обычно важен.',
      },
      {
        type: 'heading',
        text: 'Вычитание',
      },
      {
        type: 'text',
        text: 'Находишь разницу. Здесь порядок уже не шутит: пять минус три и три минус пять — разные истории.',
      },
      {
        type: 'formula',
        text: 'a − b ≠ b − a',
        hint: 'Не хватает в разряде — занимаем из старшего.',
      },
      {
        type: 'quote',
        text: '«Математика — единственная наука, где можно быть правым, и всё равно никому не интересно.» Надпись на стене Академии. Автор неизвестен. Смысл — ясен.',
      },
      {
        type: 'heading',
        text: 'Зал, потом данж',
      },
      {
        type: 'text',
        text: 'Двадцать задач без HP. Потом данжи с таймером и чемпионами. Экзамен I откроет умножение.',
      },
      {
        type: 'actions',
        text: 'Куда дальше',
        actions: [
          { kind: 'training', topics: ['add', 'sub'], variant: 'primary' },
          { kind: 'dungeon', dungeonId: 'add' },
          { kind: 'dungeon', dungeonId: 'sub' },
          { kind: 'exam' },
        ],
      },
      {
        type: 'outro',
        text: 'Лекция кончилась. Один короткий раунд в зале — и выходишь. Горус домашку не проверяет. Данж проверяет.',
      },
    ],
  },
  2: {
    title: 'Умножение и деление',
    sections: [
      {
        type: 'professor',
        text: 'Ты вернулся. Это уже статистика: большинство останавливается после первой лекции и называет это «не моё». Ты — ещё нет.',
      },
      {
        type: 'heading',
        text: 'Умножение не зубрёжка',
      },
      {
        type: 'text',
        text: 'В школе говорят: умножение — сложение по кругу. Это полуправда. Умножение — масштаб: сколько раз группа повторилась. Таблица не стихотворение «семь восемь пятьдесят шесть». Таблица — карта, чтобы не блуждать.',
      },
      {
        type: 'formula',
        text: 'a × b = b × a',
        hint: '7 × 8 и 8 × 7 — одно число. Порядок снова не важен.',
      },
      {
        type: 'heading',
        text: 'Деление',
      },
      {
        type: 'text',
        text: 'Вопрос «сколько раз вмещается». Не всё делится поровну — остаток не ошибка математики, это честность реальности.',
      },
      {
        type: 'formula',
        text: 'a × b = c  →  c ÷ a = b',
        hint: 'Знаешь таблицу — деление уже в памяти.',
      },
      {
        type: 'quote',
        text: '«Дай мне точку опоры — переверну Землю.» Архимед не перевернул Землю. Он считал песчинки. Иногда математика выглядит как магия, пока не начинаешь считать.',
      },
      {
        type: 'heading',
        text: 'Башня, пещера, таблица',
      },
      {
        type: 'text',
        text: '× и ÷ бьют сильнее, чем + и −. Таблица в голове — или в сетке до мастерства.',
      },
      {
        type: 'actions',
        text: 'Куда дальше',
        actions: [
          { kind: 'training', topics: ['mul', 'div'], variant: 'primary' },
          { kind: 'mul_table' },
          { kind: 'dungeon', dungeonId: 'mul' },
          { kind: 'dungeon', dungeonId: 'div' },
          { kind: 'exam' },
        ],
      },
      {
        type: 'outro',
        text: 'Достаточно теории. Зал, башня или пещера — сегодня, не в понедельник.',
      },
    ],
  },
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
export const LECTURE_CONTENT_REVISION = 2

/** @deprecated Коллегия читает только FALLBACK */
export function resolveLecture(levelNum: number, _fromDb?: Lecture | null): Lecture {
  return FALLBACK_LECTURES[levelNum] || FALLBACK_LECTURES[1]
}
