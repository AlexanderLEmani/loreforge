/** Побед в данже до первого шанса на чемпиона */
export const CHAMPION_UNLOCK_WINS = 10

export function championUnlockedForDungeon(dungeonWins: number): boolean {
  return dungeonWins >= CHAMPION_UNLOCK_WINS
}

export function championUnlockProgress(dungeonWins: number) {
  const wins = Math.max(0, dungeonWins)
  return {
    wins: Math.min(wins, CHAMPION_UNLOCK_WINS),
    needed: CHAMPION_UNLOCK_WINS,
    unlocked: wins >= CHAMPION_UNLOCK_WINS,
  }
}

import { dungeonIdFromRef } from '@/lib/dungeons'

export function countDungeonWins(
  runs: { result?: string; dungeon_name?: string | null }[],
  dungeonRef: string,
): number {
  const id = dungeonIdFromRef(dungeonRef)
  return runs.filter(r => r.result === 'win' && dungeonIdFromRef(r.dungeon_name) === id).length
}

export function championWinsByDungeon(
  runs: { result?: string; dungeon_name?: string | null }[],
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of runs) {
    if (r.result !== 'win' || !r.dungeon_name) continue
    const id = dungeonIdFromRef(r.dungeon_name)
    map[id] = (map[id] ?? 0) + 1
  }
  return map
}
