import type { LectureActionDef } from '@/lib/lecture-actions'

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
  3: {
    title: 'Дроби',
    sections: [
      {
        type: 'professor',
        text: 'Дроби. Здесь в детстве ломается половина людей. Остальные просто молчат. Если ты здесь — мозг уже проснулся. Не пугайся.',
      },
      {
        type: 'heading',
        text: 'Целое не всегда целое',
      },
      {
        type: 'text',
        text: 'Половина яблока, треть хлеба, четверть дня. Дробь говорит правду: мир не из кирпичей. 3/4 — три куски из четырёх. Не символ. Куски.',
      },
      {
        type: 'formula',
        text: 'a/b — a числитель, b знаменатель',
        hint: 'Знаменатель внизу держит дробь. Числитель сверху считает.',
      },
      {
        type: 'heading',
        text: 'Сложить и умножить',
      },
      {
        type: 'text',
        text: 'Сложить 1/2 и 1/3 напрямую — как яблоки плюс километры. Нужен общий знаменатель. Умножение честнее: числитель на числитель, знаменатель на знаменатель. Деление — умножить на перевёрнутую дробь.',
      },
      {
        type: 'formula',
        text: '1/2 + 1/3 = 5/6   ·   (a/b) × (c/d) = (a×c)/(b×d)',
        hint: 'Сокращение — костюм на дробь, не новое число.',
      },
      {
        type: 'quote',
        text: '«Бог создал целые числа. Всё остальное — рук человеческих.» Кронекер не доверял дробям. Пирамиды строили без его разрешения.',
      },
      {
        type: 'heading',
        text: 'Храм дробей',
      },
      {
        type: 'text',
        text: 'Таймер длиннее, ошибка дороже. Записать шаг в Гримуаре — не слабость. Чемпионы проверяют дроби под давлением.',
      },
      {
        type: 'actions',
        text: 'Куда дальше',
        actions: [
          { kind: 'training', topics: ['frac'], variant: 'primary' },
          { kind: 'grimoire' },
          { kind: 'dungeon', dungeonId: 'frac' },
          { kind: 'exam' },
        ],
      },
      {
        type: 'outro',
        text: 'Один пример в зале. Потом Храм. Кронекер был неправ. Яблоко — ещё нет.',
      },
    ],
  },
  4: {
    title: 'Проценты и пропорции',
    sections: [
      {
        type: 'professor',
        text: 'Четвёртая лекция. Впервые без угроз в начале. Ты дошёл сюда. Большинство сдаётся на дробях или на таблице умножения, думая, что это вершина мироздания.',
      },
      {
        type: 'heading',
        text: 'Процент в костюме',
      },
      {
        type: 'text',
        text: '25% — не новая магия. Это 25/100, то есть 1/4 в парадном костюме. Проценты в новостях, банках и скидках — та же дробь, другой галстук.',
      },
      {
        type: 'formula',
        text: 'n% = n/100',
        hint: 'часть = (процент / 100) × целое',
      },
      {
        type: 'heading',
        text: '10% — ключ',
      },
      {
        type: 'text',
        text: '10% от числа — сдвиг запятой на разряд. 20% — удвоенные 10%. 5% — половина от 10%. Скидка 20% и наценка 20% не возвращают цену. Это не теория. На этом обманывают каждый день.',
      },
      {
        type: 'formula',
        text: '10% от X = X ÷ 10',
        hint: 'Пропорция: a/b = c/d → a × d = b × c',
      },
      {
        type: 'quote',
        text: '«Кто понимает проценты — понимает банки и скидки. Кто не понимает — платит за них.» Стена Академии. Автор неизвестен. Счёт верный.',
      },
      {
        type: 'heading',
        text: 'Рынок и бой',
      },
      {
        type: 'text',
        text: 'В бою модификаторы — урон +25%, защита −10% — это твоя тема. Экзамен IV закрывает курс арифметики v1.',
      },
      {
        type: 'actions',
        text: 'Куда дальше',
        actions: [
          { kind: 'training', topics: ['pct'], variant: 'primary' },
          { kind: 'dungeon', dungeonId: 'market' },
          { kind: 'exam' },
        ],
      },
      {
        type: 'outro',
        text: 'Последняя лекция курса. Зал, Рынок, экзамен. Гримуар не выбрасывай.',
      },
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
  const fallback = FALLBACK_LECTURES[levelNum] || FALLBACK_LECTURES[1]
  if (!fromDb?.sections?.length) return fallback

  const hasActions = fromDb.sections.some(s => s.type === 'actions')
  if (hasActions) return fromDb

  const actionsBlock = fallback.sections.find(s => s.type === 'actions')
  if (!actionsBlock) return fromDb

  const sections = [...fromDb.sections]
  const outroIdx = sections.findIndex(s => s.type === 'outro')
  if (outroIdx >= 0) sections.splice(outroIdx, 0, actionsBlock)
  else sections.push(actionsBlock)

  return { title: fromDb.title || fallback.title, sections }
}
