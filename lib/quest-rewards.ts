import type { SupabaseClient } from '@supabase/supabase-js'
import { buildHubDailyQuests, type DailyQuest } from '@/lib/daily-quests'
import { buildGuildQuests, todayIso, type GuildQuest } from '@/lib/guild-quests'

/** Ключи: `guild:wins`, `hub:login`. Дневные — под датой, lifetime — в `lifetime`. */
export type QuestClaims = {
  lifetime?: Record<string, boolean>
} & Record<string, Record<string, boolean> | undefined>

const LIFETIME_GUILD_IDS = new Set(['spells'])

const HUB_XP: Record<string, number> = {
  login: 10,
  answers: 30,
  dungeon: 50,
}

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
    claims: emptyClaims(),
    claimedGuild: [],
    claimedHub: [],
  }

  let user: {
    glory?: number
    xp?: number
    spell_kills?: number
    quest_claims?: unknown
    last_visit?: string
  } | null = null

  const { data: userFull, error: userError } = await supabase
    .from('users')
    .select('glory, xp, spell_kills, quest_claims, last_visit')
    .eq('id', userId)
    .single()

  if (userError?.message?.includes('quest_claims')) {
    const { data: userBasic } = await supabase
      .from('users')
      .select('glory, xp, spell_kills, last_visit')
      .eq('id', userId)
      .single()
    user = userBasic
  } else if (!userError && userFull) {
    user = userFull
  }

  if (!user) return result
  const canPersistClaims = userFull != null && !userError

  let claims = parseQuestClaims(user.quest_claims)
  let glory = user.glory ?? 0
  let xp = user.xp ?? 0

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

  const guildQuests = buildGuildQuests(runs || [], answersToday ?? 0, user.spell_kills ?? 0)
  const hubQuests = buildHubDailyQuests(answersToday ?? 0, runsToday, user.last_visit)

  for (const q of guildQuests) {
    if (!q.done || isClaimed(claims, 'guild', q.id, today)) continue
    glory += q.glory
    result.gloryDelta += q.glory
    result.claimedGuild.push(q.id)
    claims = markClaimed(claims, 'guild', q.id, today)
  }

  for (const q of hubQuests) {
    if (!q.done || isClaimed(claims, 'hub', q.id, today)) continue
    const xpReward = HUB_XP[q.id] ?? 0
    if (xpReward <= 0) continue
    xp += xpReward
    result.xpDelta += xpReward
    result.claimedHub.push(q.id)
    claims = markClaimed(claims, 'hub', q.id, today)
  }

  result.claims = claims

  if (result.gloryDelta === 0 && result.xpDelta === 0) return result

  const updates: Record<string, number | QuestClaims> = {}
  if (canPersistClaims) updates.quest_claims = claims
  if (result.gloryDelta > 0) updates.glory = glory
  if (result.xpDelta > 0) updates.xp = xp

  const { error: updateError } = await supabase.from('users').update(updates).eq('id', userId)
  if (updateError?.message?.includes('quest_claims') && canPersistClaims) {
    const { quest_claims: _, ...withoutClaims } = updates
    await supabase.from('users').update(withoutClaims).eq('id', userId)
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
