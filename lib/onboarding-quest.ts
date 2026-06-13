export type OnboardingStep = {
  id: number
  title: string
  desc: string
  href: string
  icon: string
  check: (ctx: OnboardingContext) => boolean
}

export type OnboardingContext = {
  onboarding_step: number
  quest_first_dungeon: boolean
  level: number
  visited_skills: boolean
  visited_training: boolean
  visited_guild: boolean
  visited_college: boolean
  onboarding_done: boolean
}

/** Короткий путь новичка: тренировка → гильдия → первый данж */
export const CORE_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Тренировка в Зале',
    desc: 'Разомнись без риска — ошибки не убивают.',
    href: '/training',
    icon: '🏋️',
    check: c => c.visited_training,
  },
  {
    id: 2,
    title: 'Зайди в Гильдию',
    desc: 'Выбери данж и подготовься к первому бою.',
    href: '/guild',
    icon: '🏛️',
    check: c => c.visited_guild,
  },
  {
    id: 3,
    title: 'Первый данж',
    desc: 'Победи монстра в Пещере сложения.',
    href: '/guild',
    icon: '⚔️',
    check: c => c.quest_first_dungeon,
  },
]

/** Дополнительные шаги после старта */
export const EXTENDED_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 4,
    title: 'Лекция в Коллегии',
    desc: 'Профессор Горус объяснит зачем нужна математика.',
    href: '/college',
    icon: '📚',
    check: c => c.visited_college,
  },
  {
    id: 5,
    title: 'Экзамен на уровень 2',
    desc: 'Накопи XP в хабе и пройди экзамен.',
    href: '/exam?level=1',
    icon: '🎓',
    check: c => c.level >= 2,
  },
  {
    id: 6,
    title: 'Открой способность',
    desc: 'Потрать очки в дереве навыков.',
    href: '/skills',
    icon: '✦',
    check: c => c.visited_skills && c.level >= 2,
  },
  {
    id: 7,
    title: 'Экзамен на уровень 3',
    desc: 'Накопи XP в хабе и пройди экзамен II.',
    href: '/exam?level=2',
    icon: '🎓',
    check: c => c.level >= 3,
  },
  {
    id: 8,
    title: 'Экзамен на уровень 4',
    desc: 'Дроби в Коллегии → тренировка → экзамен III.',
    href: '/exam?level=3',
    icon: '🎓',
    check: c => c.level >= 4,
  },
  {
    id: 9,
    title: 'Финальный экзамен IV',
    desc: 'Проценты → Рынок → экзамен IV → выпускник.',
    href: '/exam?level=4',
    icon: '🏁',
    check: c => c.level >= 5,
  },
]

export const ONBOARDING_STEPS: OnboardingStep[] = [
  ...CORE_ONBOARDING_STEPS,
  ...EXTENDED_ONBOARDING_STEPS,
]

export function currentOnboardingStep(ctx: OnboardingContext): OnboardingStep | null {
  return ONBOARDING_STEPS.find(s => !s.check(ctx)) ?? null
}

export function currentCoreOnboardingStep(ctx: OnboardingContext): OnboardingStep | null {
  return CORE_ONBOARDING_STEPS.find(s => !s.check(ctx)) ?? null
}

export function onboardingProgress(ctx: OnboardingContext): number {
  return ONBOARDING_STEPS.filter(s => s.check(ctx)).length
}

export function coreOnboardingProgress(ctx: OnboardingContext): number {
  return CORE_ONBOARDING_STEPS.filter(s => s.check(ctx)).length
}

export const SKILL_TREE_PATH_HINT =
  'Сначала открой пассивку «Мастер прибавления» (сложение), затем «Мастер вычитания», потом умножение, деление, дроби… Без мастера предыдущей темы следующая не откроется.'
