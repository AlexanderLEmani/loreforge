import { canTakeExam } from '@/lib/v1-cap'
import { dungeonById } from '@/lib/guild-dungeons'

export type LectureActionDef = {
  kind: 'training' | 'dungeon' | 'exam' | 'grimoire' | 'mul_table' | 'guild'
  topics?: string[]
  dungeonId?: string
  variant?: 'primary' | 'secondary' | 'dungeon'
}

export type ResolvedLectureAction = {
  label: string
  sub?: string
  href: string
  icon: string
  color: string
  variant: 'primary' | 'secondary' | 'dungeon'
  disabled: boolean
  disabledReason?: string
}

const TOPIC_LABELS: Record<string, string> = {
  add: 'Сложение',
  sub: 'Вычитание',
  mul: 'Умножение',
  div: 'Деление',
  frac: 'Дроби',
  pct: 'Проценты',
}

const TOPIC_MIN_LEVEL: Record<string, number> = {
  add: 1,
  sub: 1,
  mul: 2,
  div: 2,
  frac: 3,
  pct: 4,
}

export type LectureActionContext = {
  userLevel: number
  examReady: boolean
  visitedTraining?: boolean
}

export function resolveLectureActions(
  defs: LectureActionDef[],
  ctx: LectureActionContext,
): ResolvedLectureAction[] {
  return defs.map(def => resolveOne(def, ctx))
}

function resolveOne(def: LectureActionDef, ctx: LectureActionContext): ResolvedLectureAction {
  const variant = def.variant ?? (def.kind === 'training' ? 'primary' : def.kind === 'dungeon' ? 'dungeon' : 'secondary')

  if (def.kind === 'training') {
    const topics = def.topics ?? []
    const locked = topics.some(t => (TOPIC_MIN_LEVEL[t] ?? 99) > ctx.userLevel)
    const labels = topics.map(t => TOPIC_LABELS[t] ?? t).join(' · ')
    return {
      label: 'Тренировочный зал',
      sub: labels || '20 задач без HP',
      href: `/training?topics=${topics.join(',')}`,
      icon: '🏋️',
      color: '#3db87a',
      variant,
      disabled: locked || topics.length === 0,
      disabledReason: locked ? 'Тема откроется на следующем уровне' : undefined,
    }
  }

  if (def.kind === 'mul_table') {
    const locked = ctx.userLevel < 2
    return {
      label: 'Сетка умножения',
      sub: 'Таблица до мастерства',
      href: '/training/multiplication',
      icon: '✕',
      color: '#a99fff',
      variant,
      disabled: locked,
      disabledReason: locked ? 'Нужен игровой ур. 2' : undefined,
    }
  }

  if (def.kind === 'grimoire') {
    return {
      label: 'Гримуар',
      sub: 'Записать шаги',
      href: '/grimoire',
      icon: '📖',
      color: '#e0bc6a',
      variant,
      disabled: false,
    }
  }

  if (def.kind === 'guild') {
    return {
      label: 'Гильдия',
      sub: 'Все данжи',
      href: '/guild',
      icon: '⚔️',
      color: '#e0bc6a',
      variant,
      disabled: !ctx.visitedTraining,
      disabledReason: !ctx.visitedTraining ? 'Сначала зайди в зал' : undefined,
    }
  }

  if (def.kind === 'exam') {
    const ready = canTakeExam(ctx.userLevel, ctx.examReady)
    return {
      label: `Экзамен ${ctx.userLevel}`,
      sub: ready ? 'XP полный — можно сдавать' : 'Нужен полный XP-бар',
      href: `/exam?level=${ctx.userLevel}`,
      icon: '🎓',
      color: '#e0bc6a',
      variant: ready ? 'primary' : 'secondary',
      disabled: !ready,
      disabledReason: !ready ? 'Пройди зал и данжи для XP' : undefined,
    }
  }

  if (def.kind === 'dungeon' && def.dungeonId) {
    const d = dungeonById(def.dungeonId)
    if (!d) {
      return {
        label: 'Данж',
        href: '/guild',
        icon: '⚔️',
        color: '#e0bc6a',
        variant: 'dungeon',
        disabled: true,
        disabledReason: 'Данж не найден',
      }
    }
    const locked = ctx.userLevel < d.level
    return {
      label: d.name,
      sub: d.desc.split('.')[0],
      href: `/prepare?dungeon=${encodeURIComponent(d.id)}`,
      icon: d.icon,
      color: d.color,
      variant: 'dungeon',
      disabled: locked || (!ctx.visitedTraining && d.level >= 1),
      disabledReason: locked
        ? `Нужен игровой ур. ${d.level}`
        : !ctx.visitedTraining
          ? 'Сначала зайди в зал'
          : undefined,
    }
  }

  return {
    label: 'Гильдия',
    href: '/guild',
    icon: '⚔️',
    color: '#e0bc6a',
    variant: 'secondary',
    disabled: false,
  }
}
