export type LectureSection = {
  type: string
  text?: string
  hint?: string
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
      { type: 'professor', text: 'Сложение и вычитание — не детские игры. Это первые заклинания любого мага. Без них ты даже дверь в данж не откроешь.' },
      { type: 'heading', text: 'Сложение' },
      { type: 'text', text: 'Сложение объединяет числа в одну сумму. В бою быстрый счёт даёт дополнительный урон — монстр не ждёт, пока ты считаешь на пальцах.' },
      { type: 'formula', text: 'a + b = c', hint: 'Складываем разряды: единицы, десятки, сотни.' },
      { type: 'heading', text: 'Вычитание' },
      { type: 'text', text: 'Вычитание находит разницу. Правильный ответ может снять урон врага или укрепить твою защиту.' },
      { type: 'outro', text: 'Прочитал? Хорошо. Теперь иди в тренировочный зал и покажи, что хоть что-то понял.' },
    ],
  },
  2: {
    title: 'Умножение и деление',
    sections: [
      { type: 'professor', text: 'Умножение — серия сложений. Деление — обратная операция. Освоишь — откроешь башню и пещеры уровня II.' },
      { type: 'heading', text: 'Умножение' },
      { type: 'text', text: 'Таблица умножения должна сидеть в голове. В Башне умножения скорость решает всё.' },
      { type: 'formula', text: 'a × b = c', hint: 'Умножение — повторное сложение одного числа.' },
      { type: 'heading', text: 'Деление' },
      { type: 'text', text: 'Деление разбивает число на равные части. Остатки — отдельная головная боль, но и отдельная сила.' },
      { type: 'outro', text: 'Не зевай. Следующий экзамен не прощает медлительности.' },
    ],
  },
  3: {
    title: 'Дроби',
    sections: [
      { type: 'professor', text: 'Дроби — числа между целыми. Половина, треть, четверть. Без них ты не понимаешь половину магии этого мира.' },
      { type: 'text', text: 'Дробь показывает часть целого. Числитель — сколько частей взяли, знаменатель — на сколько делили.' },
      { type: 'formula', text: '½ + ¼ = ¾', hint: 'Сначала общий знаменатель, потом складываем.' },
      { type: 'outro', text: 'Дроби в бою появятся скоро. Пока — тренируйся и копи опыт.' },
    ],
  },
  4: {
    title: 'Проценты',
    sections: [
      { type: 'professor', text: 'Процент — дробь со знаменателем сто. Скидки в лавке, бонусы урона, шансы крита — всё это проценты.' },
      { type: 'text', text: '10% от 200 — это 20. Считай в голове: делишь на сто, умножаешь на процент.' },
      { type: 'formula', text: 'n% от X = X × n ÷ 100', hint: 'Процент — часть от целого.' },
      { type: 'outro', text: 'Это последняя лекция текущего курса. Дальше — только практика и экзамены.' },
    ],
  },
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

/** Максимальный номер лекции, доступный для чтения */
export function maxUnlockedLectureLevel(userLevel: number): number {
  return lectureLevelForUser(userLevel)
}

export function isLectureUnlocked(lectureLevel: number, userLevel: number): boolean {
  return lectureLevel >= 1 && lectureLevel <= maxUnlockedLectureLevel(userLevel)
}

export function getLectureList(userLevel: number, viewingLevel: number) {
  const maxUnlocked = maxUnlockedLectureLevel(userLevel)
  const current = lectureLevelForUser(userLevel)
  return LECTURE_META.map(meta => ({
    ...meta,
    unlocked: meta.level <= maxUnlocked,
    isCurrent: meta.level === current,
    isViewing: meta.level === viewingLevel,
    done: meta.level < current,
  }))
}

export function resolveLecture(levelNum: number, fromDb: Lecture | null | undefined): Lecture {
  if (fromDb?.sections?.length) return fromDb
  return FALLBACK_LECTURES[levelNum] || FALLBACK_LECTURES[1]
}
