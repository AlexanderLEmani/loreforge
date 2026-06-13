export type GuildRank = {
  name: string
  min: number
  max: number
  color: string
  /** Предмет в сумку при первом достижении ранга */
  rewardItemId?: string
  rewardLabel?: string
  /** Данжи становятся бесплатными (id из guild-dungeons) */
  freeDungeonIds?: string[]
  /** Скидка на остальные данжи с этим рангом и выше, % */
  dungeonDiscountPct?: number
  perkText?: string
}

/** Ранги по суммарной репутации (glory_total) — не уменьшается при входе в данжи */
export const GUILD_RANKS: GuildRank[] = [
  {
    name: '🗡️ Новичок',
    min: 0,
    max: 200,
    color: '#9590a8',
    perkText: 'Пещеры сложения и вычитания — бесплатно',
  },
  {
    name: '⚔️ Боец',
    min: 200,
    max: 600,
    color: '#3db87a',
    rewardItemId: 'hands_leather',
    rewardLabel: 'Кожаные перчатки',
    freeDungeonIds: ['mul', 'div'],
    perkText: 'Умножение и деление — бесплатно · награда: перчатки',
  },
  {
    name: '🔮 Чародей',
    min: 600,
    max: 1500,
    color: '#a99fff',
    rewardItemId: 'weapon_iron',
    rewardLabel: 'Железный жезл',
    freeDungeonIds: ['frac'],
    dungeonDiscountPct: 25,
    perkText: 'Храм дробей — бесплатно · −25% на остальные',
  },
  {
    name: '🌟 Мастер',
    min: 1500,
    max: 4000,
    color: '#e0bc6a',
    rewardItemId: 'body_runed',
    rewardLabel: 'Рунная мантия',
    freeDungeonIds: ['market'],
    dungeonDiscountPct: 40,
    perkText: 'Рынок процентов — бесплатно · −40% на остальные',
  },
  {
    name: '💀 Архимаг',
    min: 4000,
    max: 99999,
    color: '#e05555',
    rewardItemId: 'head_crown',
    rewardLabel: 'Диадема архимага',
    dungeonDiscountPct: 100,
    perkText: 'Все данжи бесплатно',
  },
]

export function guildRankIndex(reputation: number): number {
  const idx = GUILD_RANKS.findIndex(r => reputation >= r.min && reputation < r.max)
  return idx >= 0 ? idx : GUILD_RANKS.length - 1
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

export function cumulativeFreeDungeonIds(rankIdx: number): Set<string> {
  const ids = new Set<string>()
  for (let i = 0; i <= rankIdx; i++) {
    GUILD_RANKS[i].freeDungeonIds?.forEach(id => ids.add(id))
  }
  return ids
}

export function maxDungeonDiscountPct(rankIdx: number): number {
  let max = 0
  for (let i = 0; i <= rankIdx; i++) {
    max = Math.max(max, GUILD_RANKS[i].dungeonDiscountPct ?? 0)
  }
  return max
}
