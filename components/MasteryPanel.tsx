'use client'

import { MASTERY_DEFS, type MasteryUnlocks, masteryProgressHint } from '@/lib/mastery-achievements'

type Props = {
  unlocks: MasteryUnlocks
  compact?: boolean
}

export default function MasteryPanel({ unlocks, compact = false }: Props) {
  const earned = MASTERY_DEFS.filter(d => unlocks[d.id]).length

  return (
    <div style={{ marginTop: compact ? '0' : '1rem' }}>
      <div style={{
        fontSize: '10px',
        fontFamily: 'monospace',
        letterSpacing: '0.2em',
        color: '#5a5670',
        textTransform: 'uppercase',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '10px',
      }}>
        Мастерство · {earned}/{MASTERY_DEFS.length}
      </div>
      {MASTERY_DEFS.map(def => {
        const done = !!unlocks[def.id]
        return (
          <div
            key={def.id}
            style={{
              background: done ? 'rgba(201,168,76,0.08)' : '#1c1f2a',
              border: `1px solid ${done ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '8px',
              padding: '8px 10px',
              marginBottom: '6px',
              opacity: done ? 1 : 0.85,
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{done ? def.icon : '🔒'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: done ? '#e0bc6a' : '#e6e2f0', marginBottom: '2px' }}>
                  {def.title}
                </div>
                <div style={{ fontSize: '10px', color: '#5a5670', lineHeight: 1.4 }}>
                  {masteryProgressHint(def, unlocks)}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
