/** Метаданные экзаменов по уровню (экзамен level N → переход на N+1) */

export type ExamLevelConfig = {
  examLevel: number
  title: string
  topicsLabel: string
  dungeons: string[]
  gorusIntro: string
  passHint: string
}

export const EXAM_BY_LEVEL: Record<number, ExamLevelConfig> = {
  1: {
    examLevel: 1,
    title: 'Основа счёта',
    topicsLabel: 'Сложение и вычитание',
    dungeons: ['Пещера сложения', 'Пещера вычитания'],
    gorusIntro: 'Два данжа, одна идея: считать быстро и без паники. Сложение и вычитание — база всего остального.',
    passHint: 'Потренируйся в Зале на ➕ и ➖, если слабовато.',
  },
  2: {
    examLevel: 2,
    title: 'Таблица и деление',
    topicsLabel: 'Умножение и деление',
    dungeons: ['Башня умножения', 'Пещера деления'],
    gorusIntro: 'Таблица умножения и честное деление. Без этого башня и пещера в гильдии будут кусаться.',
    passHint: 'Повтори таблицу в тренировке на ✕ и ÷.',
  },
  3: {
    examLevel: 3,
    title: 'Дроби',
    topicsLabel: 'Только Храм дробей — ½, ⅓, общий знаменатель, × и ÷',
    dungeons: ['Храм дробей'],
    gorusIntro: 'Экзамен только на дроби. Половины и трети должны говорить на одном языке — общий знаменатель. Ответы с дробями: ½, 3/4 или число.',
    passHint: 'Сначала лекция III в Коллегии, тренировка на ½, свитки дробей — потом экзамен.',
  },
  4: {
    examLevel: 4,
    title: 'Проценты',
    topicsLabel: 'Рынок процентов — часть от числа, скидки и наценки',
    dungeons: ['Рынок процентов'],
    gorusIntro: 'Процент — дробь со знаменателем сто. 10% от 80 = 8. Скидка 20% — умножь цену на 0,8 в голове или по шагам.',
    passHint: 'Лекция IV, тренировка на %, данж «Рынок процентов» в гильдии.',
  },
}

export function examConfigForLevel(examLevel: number): ExamLevelConfig | null {
  return EXAM_BY_LEVEL[examLevel] ?? null
}

export function dungeonsForExam(examLevel: number): string[] {
  return examConfigForLevel(examLevel)?.dungeons ?? []
}
