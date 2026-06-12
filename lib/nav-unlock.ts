import type { AppNavItem } from '@/lib/app-nav'

/** Поля users для навигации — используй в select() */
export const USER_NAV_SELECT =
  'xp, level, gold, glory, glory_total, streak, onboarding_step, visited_college, visited_training, visited_guild, visited_grimoire, visited_shop, visited_skills, quest_first_dungeon'

export type NavUnlockState = {
  onboarding_step: number
  level?: number
  visited_college?: boolean
  visited_training?: boolean
  visited_guild?: boolean
  visited_grimoire?: boolean
  visited_shop?: boolean
  visited_skills?: boolean
  quest_first_dungeon?: boolean
}

/** Минимальный игровой уровень — fallback если onboarding_step не прогнан */
const MIN_LEVEL_BY_HREF: Record<string, number> = {
  '/training': 1,
  '/grimoire': 1,
  '/shop': 1,
  '/skills': 1,
  '/guild': 2,
}

const VISITED_KEY: Partial<Record<string, keyof NavUnlockState>> = {
  '/college': 'visited_college',
  '/training': 'visited_training',
  '/guild': 'visited_guild',
  '/grimoire': 'visited_grimoire',
  '/shop': 'visited_shop',
  '/skills': 'visited_skills',
}

export function isNavItemUnlocked(
  item: AppNavItem,
  state: NavUnlockState,
  pathname?: string,
): boolean {
  if (pathname === item.href) return true
  if (state.onboarding_step >= item.minStep) return true

  const visitedKey = VISITED_KEY[item.href]
  if (visitedKey && state[visitedKey]) return true

  if (item.href === '/guild' && state.quest_first_dungeon) return true

  const minLevel = MIN_LEVEL_BY_HREF[item.href]
  if (minLevel != null && (state.level ?? 1) >= minLevel) return true

  return false
}

export function navUnlockFromUser(ud: Record<string, unknown> | null | undefined): NavUnlockState {
  return {
    onboarding_step: (ud?.onboarding_step as number) || 0,
    level: (ud?.level as number) || 1,
    visited_college: ud?.visited_college as boolean | undefined,
    visited_training: ud?.visited_training as boolean | undefined,
    visited_guild: ud?.visited_guild as boolean | undefined,
    visited_grimoire: ud?.visited_grimoire as boolean | undefined,
    visited_shop: ud?.visited_shop as boolean | undefined,
    visited_skills: ud?.visited_skills as boolean | undefined,
    quest_first_dungeon: ud?.quest_first_dungeon as boolean | undefined,
  }
}
