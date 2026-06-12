/**
 * Единая экономика LoreForge — награды и прогрессия.
 * Слава → данжи · Золото → лавка и шмот · XP → экзамен
 */

export const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500]

export const XP_TO_NEXT = [100, 150, 250, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]

export function xpProgress(xp: number, level: number) {
  const base = XP_THRESHOLDS[level - 1] ?? 0
  const next = XP_TO_NEXT[level - 1] ?? 100
  return { current: Math.max(0, xp - base), next, base }
}

/** Множитель золота по сложности данжа */
export const DUNGEON_GOLD_MULT: Record<string, number> = {
  'Пещера сложения': 1,
  'Пещера вычитания': 1,
  'Башня умножения': 1.3,
  'Пещера деления': 1.3,
  'Храм дробей': 1.6,
}

export function dungeonGoldMultiplier(dungeonName: string): number {
  return DUNGEON_GOLD_MULT[dungeonName] ?? 1
}

const BATTLE_GOLD_PER_CORRECT = 8
const BATTLE_GOLD_WIN_BONUS = 30

export function battleGoldReward(
  score: number,
  won: boolean,
  hard: boolean,
  dungeonName: string,
): number {
  const hardMult = hard ? 2 : 1
  const base = score * BATTLE_GOLD_PER_CORRECT * hardMult + (won ? BATTLE_GOLD_WIN_BONUS * hardMult : 0)
  return Math.round(base * dungeonGoldMultiplier(dungeonName))
}

export function battleDebriefRewards(
  score: number,
  won: boolean,
  hard: boolean,
  dungeonName: string,
) {
  const hardMult = hard ? 2 : 1
  return {
    xpGained: score * 10 * hardMult,
    goldGained: battleGoldReward(score, won, hard, dungeonName),
    gloryGained: won ? Math.max(10, score * 8) : 0,
  }
}

export const HUB_QUEST_REWARDS: Record<string, { xp: number; gold: number }> = {
  login: { xp: 10, gold: 8 },
  answers: { xp: 30, gold: 25 },
  dungeon: { xp: 50, gold: 45 },
}

export const GUILD_QUEST_GOLD: Record<string, number> = {
  wins: 35,
  perfect: 50,
  daily: 25,
  spells: 0,
}

export function formatQuestReward(xp: number, gold: number): string {
  const parts: string[] = []
  if (xp > 0) parts.push(`+${xp} XP`)
  if (gold > 0) parts.push(`+${gold} 💰`)
  return parts.join(' · ')
}

export function trainingGoldPerCorrect(mode: 'guided' | 'clean' | 'speed'): number {
  if (mode === 'guided') return 1
  if (mode === 'clean') return 2
  if (mode === 'speed') return 1
  return 0
}

export function trainingXpPerCorrect(mode: 'guided' | 'clean' | 'speed'): number {
  if (mode === 'guided') return 3
  if (mode === 'clean') return 5
  return 0
}
