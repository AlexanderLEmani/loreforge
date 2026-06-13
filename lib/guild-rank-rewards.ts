import type { SupabaseClient } from '@supabase/supabase-js'
import { GUILD_RANKS, guildRankIndex } from '@/lib/guild-ranks'
import { itemById } from '@/lib/equipment'
import { addOwnedItem } from '@/lib/equipment-storage'

export type GuildRankGrant = {
  rankIdx: number
  rankName: string
  itemId: string
  label: string
}

export async function syncGuildRankRewards(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ granted: GuildRankGrant[]; claimedIdx: number }> {
  const { data, error } = await supabase
    .from('users')
    .select('glory_total, guild_rank_rewards')
    .eq('id', userId)
    .single()

  if (error || !data) return { granted: [], claimedIdx: 0 }

  const reputation = Number(data.glory_total ?? 0)
  const currentIdx = guildRankIndex(reputation)
  let claimedIdx = Number(data.guild_rank_rewards ?? 0)
  const granted: GuildRankGrant[] = []

  for (let i = 1; i <= currentIdx; i++) {
    if (i <= claimedIdx) continue
    const rank = GUILD_RANKS[i]
    if (rank.rewardItemId) {
      await addOwnedItem(userId, rank.rewardItemId)
      const item = itemById(rank.rewardItemId)
      granted.push({
        rankIdx: i,
        rankName: rank.name,
        itemId: rank.rewardItemId,
        label: rank.rewardLabel || item?.name || rank.name,
      })
    }
    claimedIdx = i
  }

  if (claimedIdx > Number(data.guild_rank_rewards ?? 0)) {
    const { error: upErr } = await supabase
      .from('users')
      .update({ guild_rank_rewards: claimedIdx })
      .eq('id', userId)
    if (upErr?.message?.includes('guild_rank_rewards')) {
      // колонка ещё не в БД — награды в localStorage через addOwnedItem
    }
  }

  return { granted, claimedIdx }
}
