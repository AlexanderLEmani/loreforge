'use client'

import {
  TYPE_COLORS,
  TYPE_LABELS,
  branchMeta,
  getLockReason,
  getNodeState,
  type SkillTreeNode,
} from '@/lib/skill-tree'
import { isBranchMasterNode, nextBranchAfterMaster } from '@/lib/skill-tree-layout'
import { spellsForMasteryNode } from '@/lib/battle-spell-scrolls'

type Props = {
  node: SkillTreeNode | null
  nodes: SkillTreeNode[]
  unlockedIds: Set<number>
  level: number
  skillPoints: number
  unlocking: boolean
  onUnlock: (node: SkillTreeNode) => void
  compact?: boolean
}

export default function SkillNodeDetail({
  node,
  nodes,
  unlockedIds,
  level,
  skillPoints,
  unlocking,
  onUnlock,
  compact = false,
}: Props) {
  if (!node) {
    return (
      <div className="lf-skill-detail-empty">
        <div className="lf-skill-detail-empty-icon">✦</div>
        <p>Выбери узел на древе — светящийся круг или руну.</p>
        <ul className="lf-skill-legend-mini">
          <li><span className="lf-skill-legend-dot lf-skill-legend-dot--avail" /> доступен</li>
          <li><span className="lf-skill-legend-dot lf-skill-legend-dot--open" /> открыт</li>
          <li><span className="lf-skill-legend-dot lf-skill-legend-dot--lock" /> закрыт</li>
        </ul>
      </div>
    )
  }

  const branch = branchMeta(node.branch)
  const state = getNodeState(node, unlockedIds, level, skillPoints)
  const typeColor = TYPE_COLORS[node.type]
  const nextBranch = isBranchMasterNode(node.id) ? nextBranchAfterMaster(node.id) : null
  const nextMeta = nextBranch ? branchMeta(nextBranch) : null
  const shopSpells = spellsForMasteryNode(node.id)

  return (
    <div className={`lf-skill-detail${compact ? ' lf-skill-detail--compact' : ''}`}>
      <div className="lf-skill-detail-header">
        <div className="lf-skill-detail-type" style={{ color: branch?.color ?? typeColor }}>
          {branch ? `${branch.icon} ${branch.name}` : ''} · {TYPE_LABELS[node.type]}
        </div>
        <h2 className="lf-skill-detail-name">{node.name}</h2>
      </div>

      <p className="lf-skill-detail-desc">{node.description}</p>

      {node.effect?.detail && (
        <div className="lf-skill-detail-effect">
          <span className="lf-skill-detail-effect-label">Эффект в бою</span>
          {node.effect.detail}
        </div>
      )}

      {shopSpells.length > 0 && (
        <div className="lf-skill-detail-effect" style={{ borderColor: 'rgba(169,159,255,0.35)', background: 'rgba(123,108,255,0.06)' }}>
          <span className="lf-skill-detail-effect-label">Откроет в лавке</span>
          {state === 'unlocked'
            ? shopSpells.map(s => `${s.icon} ${s.name}`).join(' · ')
            : `После прокачки: ${shopSpells.map(s => s.name).join(', ')}`}
        </div>
      )}

      {nextMeta && (
        <div className="lf-skill-detail-bridge">
          <span className="lf-skill-detail-bridge-label">Мост к следующей теме</span>
          {state === 'unlocked'
            ? `Открыт путь: ${nextMeta.icon} ${nextMeta.name}`
            : `Прокачай этот узел → откроется ${nextMeta.icon} ${nextMeta.name}`}
        </div>
      )}

      <div className="lf-skill-detail-cost">
        <span>Стоимость</span>
        <span className="lf-skill-detail-cost-val">{node.cost} очк.</span>
      </div>

      {state === 'unlocked' && (
        <div className="lf-skill-detail-status lf-skill-detail-status--open">✦ Открыто</div>
      )}
      {state === 'available' && (
        <button
          type="button"
          className="lf-skill-detail-cta lf-skill-detail-cta--unlock"
          disabled={unlocking}
          onClick={() => onUnlock(node)}
        >
          {unlocking ? 'Открываем…' : `Вложить очко (−${node.cost})`}
        </button>
      )}
      {state === 'locked' && (
        <div className="lf-skill-detail-status lf-skill-detail-status--lock">
          🔒 {getLockReason(node, nodes, unlockedIds, level, skillPoints)}
        </div>
      )}
    </div>
  )
}
