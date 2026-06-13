'use client'

import { BRANCHES, type SkillTreeNode } from '@/lib/skill-tree'

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
  )
}
