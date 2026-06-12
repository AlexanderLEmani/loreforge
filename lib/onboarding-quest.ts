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
  onboarding_done: boolean
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Лекция в Коллегии',
    desc: 'Профессор Горус объяснит зачем нужна математика.',
    href: '/college',
    icon: '🏛️',
    check: c => c.onboarding_step >= 1,
  },
  {
    id: 2,
    title: 'Тренировка в Зале',
    desc: '20 примеров без риска — разомнись перед боем.',
    href: '/training',
    icon: '🏋️',
    check: c => c.onboarding_step >= 2,
  },
  {
    id: 3,
    title: 'Первый данж',
    desc: 'Победи монстра в Гильдии.',
    href: '/guild',
    icon: '⚔️',
    check: c => c.quest_first_dungeon,
  },
  {
    id: 4,
    title: 'Экзамен на уровень 2',
    desc: 'Накопи XP в хабе и пройди экзамен.',
    href: '/exam?level=1',
    icon: '🎓',
    check: c => c.level >= 2,
  },
  {
    id: 5,
    title: 'Открой способность',
    desc: 'Потрать очки в дереве навыков.',
    href: '/skills',
    icon: '✦',
    check: c => c.visited_skills && c.level >= 2,
  },
]

export function currentOnboardingStep(ctx: OnboardingContext): OnboardingStep | null {
  return ONBOARDING_STEPS.find(s => !s.check(ctx)) ?? null
}

export function onboardingProgress(ctx: OnboardingContext): number {
  const done = ONBOARDING_STEPS.filter(s => s.check(ctx)).length
  return done
}
