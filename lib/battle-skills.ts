import { DUNGEON_TO_TOPIC } from '@/lib/battle-config'
import { PROTOTYPE_NODES, type SkillEffect, type SkillTreeNode } from '@/lib/skill-tree'

export type BattleSkillBonuses = {
  damagePct: number
  damageReductionPct: number
  shieldOnCorrect: boolean
  unlockedNames: string[]
}

function effectBonus(effect: SkillEffect, topic: string): Partial<BattleSkillBonuses> {
  if (effect.topic && effect.topic !== topic) return {}
  switch (effect.kind) {
    case 'damage_bonus':
      return { damagePct: effect.value ?? 0 }
    case 'damage_reduction':
      return { damageReductionPct: effect.value ?? 0 }
    case 'shield':
      return { shieldOnCorrect: true }
    default:
      return {}
  }
}

export function computeBattleBonuses(
  dungeonName: string,
  unlockedNodes: SkillTreeNode[],
): BattleSkillBonuses {
  const topic = DUNGEON_TO_TOPIC[dungeonName] ?? 'add'
  const result: BattleSkillBonuses = {
    damagePct: 0,
    damageReductionPct: 0,
    shieldOnCorrect: false,
    unlockedNames: [],
  }

  for (const node of unlockedNodes) {
    const bonus = effectBonus(node.effect, topic)
    if (bonus.damagePct) result.damagePct += bonus.damagePct
    if (bonus.damageReductionPct) result.damageReductionPct += bonus.damageReductionPct
    if (bonus.shieldOnCorrect) result.shieldOnCorrect = true
    if (bonus.damagePct || bonus.damageReductionPct || bonus.shieldOnCorrect) {
      result.unlockedNames.push(node.name)
    }
  }
  return result
}

export function nodesByIds(ids: number[], allNodes: SkillTreeNode[]): SkillTreeNode[] {
  const set = new Set(ids)
  return allNodes.filter(n => set.has(n.id))
}

export function defaultSkillNodes(): SkillTreeNode[] {
  return PROTOTYPE_NODES
}
