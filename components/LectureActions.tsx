'use client'

import { useRouter } from 'next/navigation'
import {
  resolveLectureActions,
  type LectureActionContext,
  type LectureActionDef,
} from '@/lib/lecture-actions'

type Props = {
  defs: LectureActionDef[]
  ctx: LectureActionContext
  title?: string
  compact?: boolean
}

export function LectureActions({ defs, ctx, title, compact }: Props) {
  const router = useRouter()
  const actions = resolveLectureActions(defs, ctx)

  if (!actions.length) return null

  return (
    <div className={compact ? 'lf-lecture-actions lf-lecture-actions--compact' : 'lf-lecture-actions'}>
      {title && <div className="lf-lecture-actions-title">{title}</div>}
      {actions.map(action => (
        <button
          key={`${action.href}-${action.label}`}
          type="button"
          className={`lf-lecture-action lf-lecture-action--${action.variant}`}
          disabled={action.disabled}
          title={action.disabled ? action.disabledReason : undefined}
          onClick={() => !action.disabled && router.push(action.href)}
        >
          <span className="lf-lecture-action-icon">{action.icon}</span>
          <span className="lf-lecture-action-body">
            <span className="lf-lecture-action-label">{action.label}</span>
            {action.sub && !compact && (
              <span className="lf-lecture-action-sub">{action.sub}</span>
            )}
            {action.disabled && action.disabledReason && (
              <span className="lf-lecture-action-lock">{action.disabledReason}</span>
            )}
          </span>
          <span className="lf-lecture-action-arrow">→</span>
        </button>
      ))}
    </div>
  )
}
