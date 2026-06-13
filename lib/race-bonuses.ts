export type RaceId = 'human' | 'elf' | 'dwarf' | 'orc' | 'undead'

export const RACE_OPTIONS: Array<{ id: RaceId; icon: string; label: string; desc: string }> = [
  { id: 'human', icon: '🧙', label: 'Человек', desc: '+10% XP за всё' },
  { id: 'elf', icon: '🧝', label: 'Эльф', desc: '+20% XP за заклинания' },
  { id: 'dwarf', icon: '⛏️', label: 'Дварф', desc: 'Таймер защиты +5с' },
  { id: 'orc', icon: '👹', label: 'Орк', desc: 'Кулак +5 урона' },
  { id: 'undead', icon: '💀', label: 'Нежить', desc: 'Кулдаун магии −1' },
]

export function normalizeRace(race: string | null | undefined): RaceId {
  if (race === 'elf' || race === 'dwarf' || race === 'orc' || race === 'undead') return race
  return 'human'
}

/** Множитель XP: человек — всё; эльф — только заклинания в бою */
export function raceXpMultiplier(race: string, context: 'all' | 'spell'): number {
  const r = normalizeRace(race)
  if (r === 'human') return 1.1
  if (r === 'elf' && context === 'spell') return 1.2
  return 1
}

export function applyRaceXp(amount: number, race: string, context: 'all' | 'spell' = 'all'): number {
  if (amount <= 0) return 0
  return Math.round(amount * raceXpMultiplier(race, context))
}

export function raceDefendTimerBonus(race: string): number {
  return normalizeRace(race) === 'dwarf' ? 5 : 0
}

export function raceBasicDamageBonus(race: string): number {
  return normalizeRace(race) === 'orc' ? 5 : 0
}

export function raceSpellCooldownReduction(race: string): number {
  return normalizeRace(race) === 'undead' ? 1 : 0
}
