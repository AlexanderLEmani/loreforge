export type AppNavItem = {
  icon: string
  label: string
  href: string
  minStep: number
}

export const APP_NAV: AppNavItem[] = [
  { icon: '🏰', label: 'Хаб',         href: '/hub',       minStep: 0 },
  { icon: '👤', label: 'Персонаж',    href: '/character', minStep: 0 },
  { icon: '🏛️', label: 'Коллегия',    href: '/college',   minStep: 0 },
  { icon: '🏋️', label: 'Тренировка',  href: '/training',  minStep: 1 },
  { icon: '⚔️', label: 'Гильдия',     href: '/guild',     minStep: 2 },
  { icon: '📖', label: 'Гримуар',     href: '/grimoire',  minStep: 1 },
  { icon: '🛒', label: 'Лавка',       href: '/shop',      minStep: 1 },
  { icon: '✦', label: 'Способности', href: '/skills',    minStep: 1 },
]
