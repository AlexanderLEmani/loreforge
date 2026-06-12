/**
 * Единый план обучения LoreForge.
 * Отсюда в будущем: гейты данжей, экзамены, skill tree, UI «путь ученика».
 *
 * Принципы (исследования обучения):
 * - Active recall: бой и тренировка = доставать из памяти, не перечитывать
 * - Mastery learning: экзамен 80% перед новым уровнем
 * - Desirable difficulties: таймер в бою, без подсказок в «чистом» режиме
 * - Interleaving: комбо-заклинания смешивают темы после базовой прокачки
 * - Spaced practice: серия дней, квесты, возврат к старым данжам
 * - Dual coding: лекция (слова) + тетрадь (ручной счёт) + бой (действие)
 */

export type TopicId = 'add' | 'sub' | 'mul' | 'div' | 'frac' | 'pct' | 'mixed' | 'order'

export type TopicMeta = {
  id: TopicId
  icon: string
  name: string
  minLevel: number
  dungeon?: string
}

export type LevelPlan = {
  level: number
  title: string
  /** Новые темы, открывающиеся на этом уровне */
  topics: TopicId[]
  /** Что ученик должен уметь — критерий для экзамена и самопроверки */
  competencies: string[]
  /** Что открывается в игре */
  gameUnlocks: string[]
  /** Минимум верных на экзамене (из 10) */
  examPassRatio: number
}

export const TOPICS: TopicMeta[] = [
  { id: 'add', icon: '➕', name: 'Сложение', minLevel: 1, dungeon: 'Пещера сложения' },
  { id: 'sub', icon: '➖', name: 'Вычитание', minLevel: 1, dungeon: 'Пещера вычитания' },
  { id: 'mul', icon: '✕', name: 'Умножение', minLevel: 2, dungeon: 'Башня умножения' },
  { id: 'div', icon: '÷', name: 'Деление', minLevel: 2, dungeon: 'Пещера деления' },
  { id: 'frac', icon: '½', name: 'Дроби', minLevel: 3, dungeon: 'Храм дробей' },
  { id: 'pct', icon: '%', name: 'Проценты', minLevel: 4, dungeon: 'Рынок процентов' },
  { id: 'mixed', icon: '🌀', name: 'Смешанные действия', minLevel: 5, dungeon: 'Лабиринт порядка' },
  { id: 'order', icon: '()', name: 'Скобки и порядок', minLevel: 5, dungeon: 'Лабиринт порядка' },
]

/** План уровней 1–6 (арифметика). Дальше — алгебра, отдельная ветка. */
export const LEVEL_PLAN: LevelPlan[] = [
  {
    level: 1,
    title: 'Основа счёта',
    topics: ['add', 'sub'],
    competencies: [
      'Сложать и вычитать в уме до 20 без ошибок',
      'Сложение и вычитание до 100 (с переходом через десяток)',
      'Понимать, что «минус» — это разность, не «знак зла»',
    ],
    gameUnlocks: ['Коллегия I', 'Тренировка ➕➖', 'Данжи сложения и вычитания', 'Заклинание «Двойной удар»'],
    examPassRatio: 0.8,
  },
  {
    level: 2,
    title: 'Таблица и деление',
    topics: ['mul', 'div'],
    competencies: [
      'Таблица умножения 2–10 (автоматизм)',
      'Делить без остатка в пределах 100',
      'Связь умножения и деления: 7×8 и 56÷7 — одна семья',
    ],
    gameUnlocks: ['Коллегия II', 'Башня умножения', 'Пещера деления', 'Огненный шар', 'Штормовой ланс'],
    examPassRatio: 0.8,
  },
  {
    level: 3,
    title: 'Дроби',
    topics: ['frac'],
    competencies: [
      'Половина, четверть, треть — на пицце и в примерах',
      'Сложение дробей с одинаковым знаменателем',
      'Простые случаи: ½ + ¼, 1 − ⅓',
    ],
    gameUnlocks: ['Коллегия III', 'Храм дробей', 'Ветка дробей в skill tree', 'Арканический взрыв'],
    examPassRatio: 0.8,
  },
  {
    level: 4,
    title: 'Проценты и пропорции',
    topics: ['pct'],
    competencies: [
      '10%, 50%, 25% от числа в уме',
      'Скидка и наценка: «−20%» = умножить на 0,8',
      'Процент как дробь со знаменателем 100',
    ],
    gameUnlocks: ['Коллегия IV', 'Рынок процентов', 'Ветка процентов в skill tree'],
    examPassRatio: 0.8,
  },
  {
    level: 5,
    title: 'Смешанные действия',
    topics: ['mixed', 'order'],
    competencies: [
      'Примеры с 2–3 действиями без скобок (слева направо / приоритет ×÷)',
      'Скобки: сначала внутри, потом снаружи',
      'Проверка ответа оценкой «разумности»',
    ],
    gameUnlocks: ['Лабиринт порядка', 'Комбо-заклинания всех пройденных тем'],
    examPassRatio: 0.8,
  },
  {
    level: 6,
    title: 'Мастер арифметики',
    topics: [],
    competencies: [
      'Стабильно 80%+ в любом базовом данже',
      'Смешанные примеры под лёгким давлением времени',
      'Готовность к ветке «Алгебра» (скоро)',
    ],
    gameUnlocks: ['Ранг «Мастер» в гильдии', 'Физика (планируется)'],
    examPassRatio: 0.85,
  },
]

export const LEARNING_LOOP = [
  { step: 1, icon: '📓', label: 'Тетрадь', desc: 'Выпиши правило и 3–5 примеров ручкой. Без тетради — только иллюзия знания.' },
  { step: 2, icon: '🏛️', label: 'Теория', desc: 'Коллегия — короткая лекция: зачем тема и один рабочий метод.' },
  { step: 3, icon: '🏋️', label: 'Тренировка', desc: 'Зал без HP: active recall, можно с подсказками.' },
  { step: 4, icon: '⚔️', label: 'Бой', desc: 'Данж с таймером: desirable difficulty, ошибка бьёт.' },
  { step: 5, icon: '🎓', label: 'Экзамен', desc: '80% верных — мастерство, открытие следующего уровня.' },
  { step: 6, icon: '✦', label: 'Способности', desc: 'Выбор в skill tree — закрепление и билд.' },
]

export function topicMeta(id: TopicId): TopicMeta | undefined {
  return TOPICS.find(t => t.id === id)
}

export function topicsUnlockedAtLevel(userLevel: number): TopicId[] {
  return TOPICS.filter(t => t.minLevel <= userLevel).map(t => t.id)
}

export function levelPlan(level: number): LevelPlan | undefined {
  return LEVEL_PLAN.find(l => l.level === level)
}

export function currentLevelPlan(userLevel: number): LevelPlan {
  return levelPlan(userLevel) ?? LEVEL_PLAN[0]
}

export function nextLevelPlan(userLevel: number): LevelPlan | undefined {
  return levelPlan(userLevel + 1)
}

/** Для синхронизации с battle-config */
export const TOPIC_UNLOCK_LEVEL: Record<TopicId, number> = Object.fromEntries(
  TOPICS.map(t => [t.id, t.minLevel]),
) as Record<TopicId, number>
