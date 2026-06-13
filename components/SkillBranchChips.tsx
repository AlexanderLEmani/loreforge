'use client'

import { BRANCHES, type SkillTreeNode } from '@/lib/skill-tree'
import { BRANCH_SPINE_LINKS } from '@/lib/skill-tree-layout'

type Props = {
  nodes: SkillTreeNode[]
  unlockedIds: Set<number>
  level: number
  selectedBranch: string | null
  onSelectBranch: (branchId: string | null) => void
}

export default function SkillBranchChips({
  nodes,
  unlockedIds,
  level,
  selectedBranch,
  onSelectBranch,
}: Props) {
  return (
    <div className="lf-skill-branch-bar">
      <div className="lf-skill-branch-chips">
      <button
        type="button"
        className={`lf-skill-branch-chip${selectedBranch === null ? ' lf-skill-branch-chip--active' : ''}`}
        onClick={() => onSelectBranch(null)}
      >
        Всё древо
      </button>
      {BRANCHES.map(b => {
        const locked = level < b.minLevel
        const count = nodes.filter(n => n.branch === b.id && unlockedIds.has(n.id)).length
        return (
          <button
            key={b.id}
            type="button"
            disabled={locked}
            className={`lf-skill-branch-chip${selectedBranch === b.id ? ' lf-skill-branch-chip--active' : ''}${locked ? ' lf-skill-branch-chip--locked' : ''}`}
            onClick={() => !locked && onSelectBranch(b.id)}
          >
            <span className="lf-skill-branch-chip-dot" style={{ background: b.color }} />
            {b.icon} {b.name}
            {!locked && count > 0 ? ` · ${count}` : locked ? ` ур.${b.minLevel}` : ''}
          </button>
        )
      })}
      </div>

      <div className="lf-skill-spine-legend" aria-label="Мосты между темами">
        <span className="lf-skill-spine-legend-label">Мосты</span>
        <div className="lf-skill-spine-chain">
          {BRANCHES.map((b, i) => {
            const spine = BRANCH_SPINE_LINKS[i - 1]
            const bridgeLit = spine
              ? unlockedIds.has(spine.fromId) && unlockedIds.has(spine.toId)
              : false
            const bridgeReady = spine
              ? unlockedIds.has(spine.fromId) && !unlockedIds.has(spine.toId)
              : false
            return (
              <span key={b.id} className="lf-skill-spine-segment">
                {i > 0 && (
                  <span
                    className={`lf-skill-spine-link${bridgeLit ? ' lf-skill-spine-link--lit' : ''}${bridgeReady ? ' lf-skill-spine-link--ready' : ''}`}
                    title={
                      bridgeLit
                        ? `Мост открыт: ${BRANCHES[i - 1].name} → ${b.name}`
                        : bridgeReady
                          ? `Прокачай мастер «${BRANCHES[i - 1].name}» → откроется ${b.icon} ${b.name}`
                          : `Мост: ${BRANCHES[i - 1].name} → ${b.name}`
                    }
                  >
                    <span className="lf-skill-spine-link-gem">✦</span>
                  </span>
                )}
                <span className="lf-skill-spine-branch" style={{ color: b.color }}>{b.icon}</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
