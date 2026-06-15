import { ALL_SKILL_TREE_NODES } from '@/lib/skill-tree-nodes-data'
import { isBranchMasterNode } from '@/lib/skill-tree-layout'

export type SkillBranch = 'add' | 'sub' | 'mul' | 'div' | 'frac' | 'pct'
export type SkillNodeType = 'attack' | 'defense' | 'passive'

export type SkillEffect = {
  kind: string
  value?: number
  topic?: string
  detail?: string
}

export type SkillTreeNode = {
  id: number
  branch: SkillBranch
  name: string
  type: SkillNodeType
  description: string
  effect: SkillEffect
  cost: number
  requires: number | null
  position_x: number
  position_y: number
  icon?: string
}

export const BRANCHES: { id: SkillBranch; icon: string; name: string; minLevel: number; color: string }[] = [
  { id: 'add', icon: '➕', name: 'Сложение', minLevel: 1, color: '#3db87a' },
  { id: 'sub', icon: '➖', name: 'Вычитание', minLevel: 1, color: '#e0bc6a' },
  { id: 'mul', icon: '✕', name: 'Умножение', minLevel: 2, color: '#a99fff' },
  { id: 'div', icon: '÷', name: 'Деление', minLevel: 2, color: '#7b6cff' },
  { id: 'frac', icon: '½', name: 'Дроби', minLevel: 3, color: '#e0bc6a' },
  { id: 'pct', icon: '%', name: 'Проценты', minLevel: 4, color: '#e0bc6a' },
]

export const TYPE_LABELS: Record<SkillNodeType, string> = {
  attack: 'Атака',
  defense: 'Защита',
  passive: 'Пассивка',
}

export const TYPE_COLORS: Record<SkillNodeType, string> = {
  attack: '#e0bc6a',
  defense: '#a99fff',
  passive: '#3db87a',
}

export function branchUnlocked(branch: SkillBranch, userLevel: number): boolean {
  const meta = BRANCHES.find(b => b.id === branch)
  return userLevel >= (meta?.minLevel ?? 99)
}

/** Локальный fallback если в БД нет узлов */
export const PROTOTYPE_NODES: SkillTreeNode[] = ALL_SKILL_TREE_NODES

export const DEMO_SKILL_POINTS = 5
export const DEMO_STORAGE_KEY = 'loreheim_skill_demo'

export type DemoSkillState = { unlocked: number[]; points: number }

export function loadDemoSkillState(): DemoSkillState {
  if (typeof window === 'undefined') return { unlocked: [], points: DEMO_SKILL_POINTS }
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return { unlocked: [], points: DEMO_SKILL_POINTS }
    const parsed = JSON.parse(raw) as DemoSkillState
    return {
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
      points: typeof parsed.points === 'number' ? parsed.points : DEMO_SKILL_POINTS,
    }
  } catch {
    return { unlocked: [], points: DEMO_SKILL_POINTS }
  }
}

export function saveDemoSkillState(state: DemoSkillState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}

export function getNodeState(
  node: SkillTreeNode,
  unlockedIds: Set<number>,
  userLevel: number,
  skillPoints: number,
): 'unlocked' | 'available' | 'locked' {
  if (unlockedIds.has(node.id)) return 'unlocked'
  if (!branchUnlocked(node.branch, userLevel)) return 'locked'
  if (node.requires !== null && !unlockedIds.has(node.requires)) return 'locked'
  if (skillPoints < node.cost) return 'locked'
  return 'available'
}

export function getLockReason(
  node: SkillTreeNode,
  allNodes: SkillTreeNode[],
  unlockedIds: Set<number>,
  userLevel: number,
  skillPoints: number,
): string {
  if (getNodeState(node, unlockedIds, userLevel, skillPoints) !== 'locked') return ''
  const meta = BRANCHES.find(b => b.id === node.branch)
  if (!branchUnlocked(node.branch, userLevel)) {
    return `Тема «${meta?.name ?? node.branch}» открывается на ур. ${meta?.minLevel ?? '?'}`
  }
  if (node.requires !== null && !unlockedIds.has(node.requires)) {
    const parent = allNodes.find(n => n.id === node.requires)
    if (parent && isBranchMasterNode(parent.id)) {
      const meta = BRANCHES.find(b => b.id === node.branch)
      return `Сначала «${parent.name}» — ключ к теме «${meta?.name ?? node.branch}»`
    }
    return parent ? `Сначала: ${parent.name}` : 'Сначала открой предыдущий узел'
  }
  if (skillPoints < node.cost) return 'Недостаточно очков способностей'
  return 'Заблокировано'
}

export function branchMeta(branch: SkillBranch) {
  return BRANCHES.find(b => b.id === branch)
}
