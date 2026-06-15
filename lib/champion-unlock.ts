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

export function countDungeonWins(
  runs: { result?: string; dungeon_name?: string | null }[],
  dungeonName: string,
): number {
  return runs.filter(r => r.result === 'win' && r.dungeon_name === dungeonName).length
}

export function championWinsByDungeon(
  runs: { result?: string; dungeon_name?: string | null }[],
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of runs) {
    if (r.result !== 'win' || !r.dungeon_name) continue
    map[r.dungeon_name] = (map[r.dungeon_name] ?? 0) + 1
  }
  return map
}
