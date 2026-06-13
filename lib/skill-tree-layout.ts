import type { SkillBranch, SkillTreeNode } from '@/lib/skill-tree'

const BRANCH_ORDER: SkillBranch[] = ['add', 'sub', 'mul', 'div', 'frac', 'pct']

export const BRANCH_ROOT_IDS = [1, 8, 15, 22, 29, 36] as const
export const BRANCH_PASSIVE_IDS = [7, 14, 21, 28, 35, 42] as const

export const SKILL_TREE_CENTER: SkillTreeNode = {
  id: 0,
  branch: 'add',
  name: 'Единство',
  type: 'passive',
  icon: '◎',
  description:
    'Корень древа: в математике всё выходит из одного и переходит в другое — сложение ведёт к вычитанию, умножение к делению, дроби к процентам.',
  effect: {
    kind: 'hub',
    detail: 'Начало пути · все темы связаны',
  },
  cost: 0,
  requires: null,
  position_x: 500,
  position_y: 420,
}

const CX = 500
const CY = 420

function polar(angle: number, dist: number) {
  return {
    x: Math.round(CX + Math.cos(angle) * dist),
    y: Math.round(CY + Math.sin(angle) * dist),
  }
}

/** Десктоп: полное древо, узлы веером внутри сектора (без наслоения на соседние лучи). */
function layoutBranchFull(nodes: SkillTreeNode[], branchIndex: number): SkillTreeNode[] {
  const angle = -Math.PI / 2 + branchIndex * (Math.PI / 3)
  const branch = BRANCH_ORDER[branchIndex]
  const branchNodes = nodes.filter(n => n.branch === branch && n.id !== 0)
  if (branchNodes.length === 0) return []

  const ids = branchNodes.map(n => n.id).sort((a, b) => a - b)
  const baseId = ids[0]
  const fan = 0.26

  const passiveAngle = angle + Math.PI / 6 - 0.2

  const pos: Record<number, { x: number; y: number }> = {
    [baseId]: polar(angle, 125),
    [baseId + 6]: polar(passiveAngle, 245),
    [baseId + 1]: polar(angle - fan, 165),
    [baseId + 2]: polar(angle - fan * 0.62, 205),
    [baseId + 3]: polar(angle - fan * 0.35, 250),
    [baseId + 4]: polar(angle + fan * 0.35, 165),
    [baseId + 5]: polar(angle + fan * 0.62, 205),
  }

  return branchNodes.map(n => {
    const p = pos[n.id]
    return p ? { ...n, position_x: p.x, position_y: p.y } : n
  })
}

/** Мобилка: обзор — центр, 6 корней, 6 «мастеров» на внешнем кольце. */
function layoutCompactOverview(nodes: SkillTreeNode[]): SkillTreeNode[] {
  const ROOT_R = 88
  const PASSIVE_R = 148

  return nodes.map(n => {
    if (n.id === 0) return { ...n, position_x: CX, position_y: CY }
    const rootIdx = BRANCH_ROOT_IDS.indexOf(n.id as typeof BRANCH_ROOT_IDS[number])
    if (rootIdx >= 0) {
      const a = -Math.PI / 2 + rootIdx * (Math.PI / 3)
      const p = polar(a, ROOT_R)
      return { ...n, position_x: p.x, position_y: p.y }
    }
    const passIdx = BRANCH_PASSIVE_IDS.indexOf(n.id as typeof BRANCH_PASSIVE_IDS[number])
    if (passIdx >= 0) {
      const a = -Math.PI / 2 + passIdx * (Math.PI / 3) + Math.PI / 6
      const p = polar(a, PASSIVE_R)
      return { ...n, position_x: p.x, position_y: p.y }
    }
    return n
  })
}

/** Мобилка: одна тема — вертикальная лестница, атаки слева, защиты справа. */
function layoutBranchDetail(nodes: SkillTreeNode[], branch: SkillBranch): SkillTreeNode[] {
  const branchIndex = BRANCH_ORDER.indexOf(branch)
  const baseId = BRANCH_ROOT_IDS[branchIndex]
  const yBase = CY + 20

  const pos: Record<number, { x: number; y: number }> = {
    [baseId]: { x: CX, y: yBase - 70 },
    [baseId + 6]: { x: CX, y: yBase - 285 },
    [baseId + 1]: { x: CX - 88, y: yBase - 130 },
    [baseId + 2]: { x: CX - 100, y: yBase - 175 },
    [baseId + 3]: { x: CX - 108, y: yBase - 220 },
    [baseId + 4]: { x: CX + 88, y: yBase - 130 },
    [baseId + 5]: { x: CX + 100, y: yBase - 175 },
  }

  const prevPassiveId = branchIndex > 0 ? BRANCH_PASSIVE_IDS[branchIndex - 1] : null

  return nodes.map(n => {
    if (n.id === 0) return { ...n, position_x: CX, position_y: yBase + 55 }
    if (prevPassiveId !== null && n.id === prevPassiveId) {
      return { ...n, position_x: CX, position_y: yBase + 10 }
    }
    const p = pos[n.id]
    if (p) return { ...n, position_x: p.x, position_y: p.y }
    return n
  })
}

export function applyRadialSkillLayout(
  nodes: SkillTreeNode[],
  mode: 'full' | 'compact-overview' | 'compact-detail' = 'full',
  detailBranch?: SkillBranch | null,
): SkillTreeNode[] {
  const withoutCenter = nodes.filter(n => n.id !== 0)

  let laid: SkillTreeNode[] = []
  if (mode === 'compact-overview') {
    laid = layoutCompactOverview(withoutCenter)
  } else if (mode === 'compact-detail' && detailBranch) {
    laid = layoutBranchDetail(withoutCenter, detailBranch)
  } else {
    for (let i = 0; i < BRANCH_ORDER.length; i++) {
      laid = [...laid, ...layoutBranchFull(withoutCenter, i)]
    }
  }

  const addRoot = laid.find(n => n.id === 1)
  if (addRoot && addRoot.requires === null) {
    laid = laid.map(n => (n.id === 1 ? { ...n, requires: 0 } : n))
  }

  return [{ ...SKILL_TREE_CENTER, position_x: CX, position_y: mode === 'compact-detail' ? CY + 75 : CY }, ...laid]
}

export function visibleSkillNodes(
  all: SkillTreeNode[],
  compact: boolean,
  branchFilter: SkillBranch | null,
): SkillTreeNode[] {
  if (!compact) return all

  if (!branchFilter) {
    const ids = new Set<number>([0, ...BRANCH_ROOT_IDS, ...BRANCH_PASSIVE_IDS])
    return all.filter(n => ids.has(n.id))
  }

  const idx = BRANCH_ORDER.indexOf(branchFilter)
  const rootId = BRANCH_ROOT_IDS[idx]
  const ids = new Set<number>([0, rootId, rootId + 1, rootId + 2, rootId + 3, rootId + 4, rootId + 5, rootId + 6])
  if (idx > 0) ids.add(BRANCH_PASSIVE_IDS[idx - 1])
  return all.filter(n => ids.has(n.id))
}

export const BRANCH_SPINE_LINKS = BRANCH_PASSIVE_IDS.slice(0, 5).map((fromId, i) => ({
  fromId,
  toId: BRANCH_ROOT_IDS[i + 1],
  fromBranch: BRANCH_ORDER[i],
  toBranch: BRANCH_ORDER[i + 1],
}))

/** Пары мостов — рисуем кривой spine, не дублируем прямой requires-линией */
export const SPINE_LINK_PAIR_KEYS = new Set(
  [...BRANCH_SPINE_LINKS.map(l => `${l.fromId}-${l.toId}`), '0-1'],
)

export function isSpineLinkPair(fromId: number, toId: number): boolean {
  return SPINE_LINK_PAIR_KEYS.has(`${fromId}-${toId}`)
}

export function isBranchMasterNode(nodeId: number): boolean {
  return (BRANCH_PASSIVE_IDS as readonly number[]).includes(nodeId)
}

export function nextBranchAfterMaster(passiveId: number): SkillBranch | null {
  const idx = BRANCH_PASSIVE_IDS.indexOf(passiveId as typeof BRANCH_PASSIVE_IDS[number])
  if (idx < 0 || idx >= BRANCH_ORDER.length - 1) return null
  return BRANCH_ORDER[idx + 1]
}

export function branchWedgeAngles(): Array<{ branch: SkillBranch; start: number; end: number; color: string }> {
  const colors: Record<SkillBranch, string> = {
    add: '#3db87a',
    sub: '#e0bc6a',
    mul: '#a99fff',
    div: '#7b6cff',
    frac: '#e8a050',
    pct: '#5ac9e8',
  }
  return BRANCH_ORDER.map((branch, i) => {
    const start = -Math.PI / 2 + i * (Math.PI / 3) - Math.PI / 6
    const end = start + Math.PI / 3
    return { branch, start, end, color: colors[branch] }
  })
}

export const SKILL_TREE_LAYOUT_RADIUS = 250
