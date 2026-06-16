import type { SupabaseClient } from '@supabase/supabase-js'

export async function resetUserProgress(supabase: SupabaseClient, userId: string) {
  const tables = ['question_attempts', 'dungeon_runs', 'user_scrolls', 'user_skills', 'user_equipment', 'characters'] as const
  const errors: string[] = []

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) errors.push(`${table}: ${error.message}`)
  }

  const { error: userError } = await supabase.from('users').update({
    xp: 0,
    level: 1,
    gold: 0,
    glory: 0,
    glory_total: 0,
    streak: 0,
    last_visit: null,
    total_answers: 0,
    quest_first_dungeon: false,
    onboarding_done: false,
    onboarding_step: 0,
    visited_college: false,
    visited_training: false,
    visited_guild: false,
    visited_character: false,
    visited_grimoire: false,
    visited_shop: false,
    visited_skills: false,
    skill_points: 0,
    quest_claims: {},
    consumables: { hint: 0, power: 0, shield: 0, heal: 0 },
    spell_scrolls: {
      scroll_twin_strike: 0,
      scroll_fireball: 0,
      scroll_storm_lance: 0,
      scroll_arcane_burst: 0,
      scroll_dark_sigil: 0,
    },
    guild_rank_rewards: 0,
    daily_study_seconds: 0,
    daily_study_date: null,
    mastery_unlocks: {},
  }).eq('id', userId)

  if (userError) errors.push(`users: ${userError.message}`)

  return { ok: errors.length === 0, errors }
}
