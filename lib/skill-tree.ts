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

/** Прототип ветки сложения — показывается если в БД ещё нет узлов */
export const PROTOTYPE_NODES: SkillTreeNode[] = [
  {
    id: 1, branch: 'add', name: 'Корень сложения', type: 'passive',
    description: 'Базовый узел ветки. Открывает путь к атакам и защитам сложения.',
    effect: { kind: 'xp_bonus', value: 5, topic: 'add', detail: '+5% XP за задачи на сложение' },
    cost: 0, requires: null, position_x: 400, position_y: 300, icon: '➕',
  },
  {
    id: 2, branch: 'add', name: 'Удар сложением', type: 'attack',
    description: 'Правильный ответ на пример «два однозначных числа» наносит дополнительный урон.',
    effect: { kind: 'damage_bonus', value: 15, topic: 'add', detail: '+15% урона при сложении до 18' },
    cost: 1, requires: 1, position_x: 260, position_y: 220, icon: '⚔',
  },
  {
    id: 3, branch: 'add', name: 'Двузначный разряд', type: 'attack',
    description: 'Усилённая атака для примеров с двузначными числами.',
    effect: { kind: 'damage_bonus', value: 25, topic: 'add', detail: '+25% урона при сложении двузначных' },
    cost: 2, requires: 2, position_x: 160, position_y: 140, icon: '⚔',
  },
  {
    id: 4, branch: 'add', name: 'Тройной удар', type: 'attack',
    description: 'Мощный удар при сложении трёх чисел в одном примере.',
    effect: { kind: 'damage_bonus', value: 35, topic: 'add', detail: '+35% урона на тройные суммы' },
    cost: 2, requires: 3, position_x: 80, position_y: 60, icon: '⚔',
  },
  {
    id: 5, branch: 'add', name: 'Щит суммы', type: 'defense',
    description: 'Правильный ответ на пример сложения даёт щит, поглощающий следующий удар.',
    effect: { kind: 'shield', value: 1, topic: 'add', detail: 'Щит после верного сложения' },
    cost: 1, requires: 1, position_x: 540, position_y: 220, icon: '🛡',
  },
  {
    id: 6, branch: 'add', name: 'Стойкость счёта', type: 'defense',
    description: 'Снижает входящий урон, если последний верный ответ был на сложение.',
    effect: { kind: 'damage_reduction', value: 20, topic: 'add', detail: '−20% урона после верного сложения' },
    cost: 2, requires: 5, position_x: 640, position_y: 140, icon: '🛡',
  },
  {
    id: 7, branch: 'add', name: 'Мастер прибавления', type: 'passive',
    description: 'Бонус XP и скидка на свитки сложения в Лавке.',
    effect: { kind: 'shop_discount', value: 10, topic: 'add', detail: '−10% на свитки сложения, +8% XP' },
    cost: 2, requires: 1, position_x: 400, position_y: 180, icon: '✦',
  },
]

export const DEMO_SKILL_POINTS = 5
export const DEMO_STORAGE_KEY = 'loreforge_skill_demo'

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
