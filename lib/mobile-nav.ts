import type { AppNavItem } from '@/lib/app-nav'

export const MOBILE_BOTTOM_NAV: AppNavItem[] = [
  { icon: '🏰', label: 'Хаб', href: '/hub', minStep: 0 },
  { icon: '🏋️', label: 'Тренинг', href: '/training', minStep: 1 },
  { icon: '⚔️', label: 'Гильдия', href: '/guild', minStep: 2 },
  { icon: '🏛️', label: 'Коллегия', href: '/college', minStep: 0 },
]

export const MOBILE_MORE_NAV: AppNavItem[] = [
  { icon: '👤', label: 'Персонаж', href: '/character', minStep: 0 },
  { icon: '📖', label: 'Гримуар', href: '/grimoire', minStep: 1 },
  { icon: '🛒', label: 'Лавка', href: '/shop', minStep: 1 },
  { icon: '✦', label: 'Способности', href: '/skills', minStep: 1 },
]

const HIDDEN_PATHS = new Set([
  '/',
  '/battle',
  '/debrief',
  '/prepare',
  '/exam',
  '/create-character',
])

export function showMobileBottomNav(pathname: string): boolean {
  return !HIDDEN_PATHS.has(pathname)
}
