import type { Monster } from '@/lib/battle-config'

/** Визуальные id спрайтов PixelMonster */
export type MonsterVisualId =
  | 'scrib_scrib'
  | 'collector'
  | 'slime'
  | 'mimic'
  | 'fraction_golem'
  | 'goblin_appraiser'
  | 'boss_collector'
  | 'boss_mimic'
  | 'bat'
  | 'spark'
  | 'split'
  | 'shade'
  | 'pie'
  | 'half'
  | 'rat'
  | 'ogre'
  | 'leech'
  | 'bee'
  | 'cultist'
  | 'imp'
  | 'fallback'

const LEADER_VISUALS: Record<string, MonsterVisualId> = {
  slime: 'slime',
  adder: 'scrib_scrib',
  golem_add: 'fraction_golem',
  bat: 'bat',
  debt: 'collector',
  void: 'boss_collector',
  spark: 'spark',
  wizard: 'mimic',
  titan: 'boss_mimic',
  split: 'split',
  remain: 'shade',
  frac_demon: 'fraction_golem',
  pie: 'pie',
  half: 'half',
  frac_boss: 'fraction_golem',
  merchant: 'goblin_appraiser',
  tax: 'collector',
  pct_boss: 'goblin_appraiser',
  pack_rat: 'rat',
  pack_gob: 'goblin_appraiser',
  pack_ogre: 'ogre',
  pack_leech: 'leech',
  pack_bee: 'bee',
  pack_cult: 'cultist',
  imp: 'imp',
  shade: 'shade',
  brute: 'fraction_golem',
}

/** Подручные чемпионов: [вариант 0, вариант 1] */
const MINION_VISUALS: Record<string, [MonsterVisualId, MonsterVisualId]> = {
  golem_add: ['slime', 'scrib_scrib'],
  void: ['shade', 'collector'],
  titan: ['spark', 'mimic'],
  frac_demon: ['pie', 'shade'],
  frac_boss: ['pie', 'half'],
  pct_boss: ['goblin_appraiser', 'collector'],
}

function baseMonsterId(id: string): string {
  const m = id.match(/^(.+)_minion_[01]$/)
  return m ? m[1] : id
}

export function monsterVisualId(monster: Pick<Monster, 'id' | 'isBoss'>): MonsterVisualId {
  const minionMatch = monster.id.match(/^(.+)_minion_([01])$/)
  if (minionMatch) {
    const [, leaderId, variantStr] = minionMatch
    const pair = MINION_VISUALS[leaderId]
    if (pair) return pair[variantStr === '1' ? 1 : 0]
  }

  const baseId = baseMonsterId(monster.id)
  const visual = LEADER_VISUALS[baseId]
  if (visual) return visual

  return 'fallback'
}
