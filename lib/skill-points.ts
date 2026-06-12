/** Очки способностей при повышении уровня (экзамен) */
export const SKILL_POINTS_PER_LEVEL = 3

export function skillPointsForLevelGain(levelsGained = 1): number {
  return SKILL_POINTS_PER_LEVEL * levelsGained
}
