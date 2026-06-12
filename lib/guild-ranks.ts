export type GuildRank = {
  name: string
  min: number
  max: number
  color: string
}

/** Ранги по суммарной репутации (glory_total) — не уменьшается при входе в данжи */
export const GUILD_RANKS: GuildRank[] = [
  { name: '🗡️ Новичок', min: 0, max: 500, color: '#9590a8' },
  { name: '⚔️ Боец', min: 500, max: 1500, color: '#3db87a' },
  { name: '🔮 Чародей', min: 1500, max: 3500, color: '#a99fff' },
  { name: '🌟 Мастер', min: 3500, max: 8000, color: '#e0bc6a' },
  { name: '💀 Архимаг', min: 8000, max: 99999, color: '#e05555' },
]

export function guildRankIndex(reputation: number): number {
  return GUILD_RANKS.findIndex(r => reputation >= r.min && reputation < r.max)
}

export function guildRankProgress(reputation: number) {
  const idx = guildRankIndex(reputation)
  const rank = GUILD_RANKS[idx] || GUILD_RANKS[0]
  const next = GUILD_RANKS[idx + 1]
  const pct = next
    ? Math.min(((reputation - rank.min) / (next.min - rank.min)) * 100, 100)
    : 100
  return { rank, next, idx, pct, reputation }
}
