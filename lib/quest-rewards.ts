import type { SupabaseClient } from '@supabase/supabase-js'
import { HUB_QUEST_REWARDS } from '@/lib/economy'
import { buildHubDailyQuests, type DailyQuest } from '@/lib/daily-quests'
import { normalizeStudySeconds } from '@/lib/daily-study'
import { buildGuildQuests, todayIso, type GuildQuest } from '@/lib/guild-quests'
import { grantGlory } from '@/lib/glory-wallet'
import { fetchSpellKills, fetchUserRow } from '@/lib/user-profile'

/** Ключи: `guild:wins`, `hub:study`. Дневные — под датой, lifetime — в `lifetime`. */
export type QuestClaims = {
  lifetime?: Record<string, boolean>
} & Record<string, Record<string, boolean> | undefined>

const LIFETIME_GUILD_IDS = new Set(['spells'])

function emptyClaims(): QuestClaims {
  return { lifetime: {} }
}

export function parseQuestClaims(raw: unknown): QuestClaims {
  if (!raw || typeof raw !== 'object') return emptyClaims()
  const c = raw as QuestClaims
  if (!c.lifetime) c.lifetime = {}
  return c
}

function isClaimed(claims: QuestClaims, scope: 'guild' | 'hub', id: string, today: string): boolean {
  if (scope === 'guild' && LIFETIME_GUILD_IDS.has(id)) {
    return !!claims.lifetime?.[`guild:${id}`]
  }
  const day = claims[today] as Record<string, boolean> | undefined
  return !!day?.[`${scope}:${id}`]
}

function markClaimed(claims: QuestClaims, scope: 'guild' | 'hub', id: string, today: string): QuestClaims {
  if (scope === 'guild' && LIFETIME_GUILD_IDS.has(id)) {
    return { ...claims, lifetime: { ...claims.lifetime, [`guild:${id}`]: true } }
  }
  const day: Record<string, boolean> = { ...(claims[today] as Record<string, boolean> | undefined) }
  day[`${scope}:${id}`] = true
  return { ...claims, [today]: day }
}

export type QuestRewardResult = {
  gloryDelta: number
  xpDelta: number
  goldDelta: number
  claims: QuestClaims
  claimedGuild: string[]
  claimedHub: string[]
}

export async function syncQuestRewards(
  supabase: SupabaseClient,
  userId: string,
): Promise<QuestRewardResult> {
  const today = todayIso()
  const result: QuestRewardResult = {
    gloryDelta: 0,
    xpDelta: 0,
    goldDelta: 0,
    claims: emptyClaims(),
    claimedGuild: [],
    claimedHub: [],
  }

  const row = await fetchUserRow(supabase, userId, [
    'quest_claims',
    'last_visit',
    'daily_study_seconds',
    'daily_study_date',
  ])
  if (!row) return result

  const hasQuestClaims = row.quest_claims !== undefined
  let claims = parseQuestClaims(row.quest_claims)
  const spellKills = row.spell_kills != null ? Number(row.spell_kills) : await fetchSpellKills(supabase, userId)

  const { data: runs } = await supabase
    .from('dungeon_runs')
    .select('result, mistakes, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: answersToday } = await supabase
    .from('question_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)

  const runsToday = (runs || []).filter(r => r.created_at?.startsWith(today))

  const studySeconds = normalizeStudySeconds(
    Number(row.daily_study_seconds ?? 0),
    row.daily_study_date as string | undefined,
    today,
  )

  const guildQuests = buildGuildQuests(runs || [], answersToday ?? 0, spellKills)
  const hubQuests = buildHubDailyQuests(answersToday ?? 0, runsToday, studySeconds)

  for (const q of guildQuests) {
    if (!q.done || isClaimed(claims, 'guild', q.id, today)) continue
    result.gloryDelta += q.glory
    result.goldDelta += q.gold
    result.claimedGuild.push(q.id)
    claims = markClaimed(claims, 'guild', q.id, today)
  }

  for (const q of hubQuests) {
    if (!q.done || isClaimed(claims, 'hub', q.id, today)) continue
    const rewards = HUB_QUEST_REWARDS[q.id]
    if (!rewards) continue
    result.xpDelta += rewards.xp
    result.goldDelta += rewards.gold
    result.claimedHub.push(q.id)
    claims = markClaimed(claims, 'hub', q.id, today)
  }

  result.claims = claims

  if (result.gloryDelta === 0 && result.xpDelta === 0 && result.goldDelta === 0) return result

  if (hasQuestClaims) {
    const { error: claimsError } = await supabase
      .from('users')
      .update({ quest_claims: claims })
      .eq('id', userId)
    if (claimsError) {
      console.warn('quest_claims update failed:', claimsError.message)
    }
  }

  if (result.gloryDelta > 0) {
    await grantGlory(supabase, userId, result.gloryDelta)
  }

  if (result.xpDelta > 0) {
    const { data: fresh } = await supabase.from('users').select('xp').eq('id', userId).single()
    const base = Number(fresh?.xp ?? row.xp ?? 0)
    const { error } = await supabase
      .from('users')
      .update({ xp: base + result.xpDelta })
      .eq('id', userId)
    if (error) console.warn('xp quest reward failed:', error.message)
  }

  if (result.goldDelta > 0) {
    const { data: fresh } = await supabase.from('users').select('gold').eq('id', userId).single()
    const base = Number(fresh?.gold ?? row.gold ?? 0)
    const { error } = await supabase
      .from('users')
      .update({ gold: base + result.goldDelta })
      .eq('id', userId)
    if (error) console.warn('gold quest reward failed:', error.message)
  }

  return result
}

export function withGuildClaimed(quests: GuildQuest[], claims: QuestClaims, today = todayIso()): GuildQuest[] {
  return quests.map(q => ({
    ...q,
    claimed: isClaimed(claims, 'guild', q.id, today),
  }))
}

export function withHubClaimed(quests: DailyQuest[], claims: QuestClaims, today = todayIso()): DailyQuest[] {
  return quests.map(q => ({
    ...q,
    claimed: isClaimed(claims, 'hub', q.id, today),
  }))
}
