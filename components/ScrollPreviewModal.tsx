'use client'

import {
  scrollCombatTeaser,
  scrollEffectMeta,
  scrollPreviewExampleLine,
  scrollTeaserText,
} from '@/lib/scroll-display'

type LevelColors = { border: string; accent: string; bg: string; tag: string }

type Props = {
  scroll: any
  colors: LevelColors
  owned: boolean
  canAfford: boolean
  buying: boolean
  onClose: () => void
  onBuy: () => void
  onOpenGrimoire?: () => void
}

export default function ScrollPreviewModal({
  scroll,
  colors: c,
  owned,
  canAfford,
  buying,
  onClose,
  onBuy,
  onOpenGrimoire,
}: Props) {
  const effect = scrollEffectMeta(scroll)
  const exampleLine = scrollPreviewExampleLine(scroll)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 250,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: '14px',
          padding: '1.75rem',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '9px', color: c.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Уровень {scroll.level} · Превью
        </div>
        <h2 style={{ color: c.accent, fontSize: '22px', margin: '0 0 4px' }}>{scroll.title}</h2>
        <div style={{ color: '#6b5a45', fontSize: '13px', fontStyle: 'italic', marginBottom: '12px' }}>{scroll.subtitle}</div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(123,108,255,0.12)',
            border: '1px solid rgba(123,108,255,0.35)',
            borderRadius: '8px',
            marginBottom: '14px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#a99fff',
          }}
        >
          {effect.icon} В бою: {effect.label} — {effect.desc}
        </div>

        {scroll.body && (
          <p style={{ color: '#b8a888', fontSize: '14px', lineHeight: 1.7, marginBottom: '12px' }}>
            {scrollTeaserText(scroll.body)}
          </p>
        )}

        {exampleLine && (
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: c.accent,
            }}
          >
            Пример: {exampleLine}
          </div>
        )}

        {scroll.combat && (
          <p style={{ fontSize: '12px', color: '#8a7a6a', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '12px' }}>
            ⚔ {scrollCombatTeaser(scroll.combat)}
          </p>
        )}

        <p style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.5 }}>
          Полный разбор, все шаги и использование в бою — в Гримуаре после покупки.
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              textAlign: 'center',
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#5a5670',
              cursor: 'pointer',
            }}
          >
            Закрыть
          </div>
          {owned ? (
            <div
              onClick={onOpenGrimoire}
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                background: 'rgba(61,184,122,0.1)',
                border: '1px solid rgba(61,184,122,0.35)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#3db87a',
                cursor: 'pointer',
              }}
            >
              📖 В Гримуар
            </div>
          ) : (
            <div
              onClick={() => canAfford && !buying && onBuy()}
              style={{
                flex: 1,
                padding: '12px',
                textAlign: 'center',
                background: canAfford ? `${c.accent}22` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${canAfford ? c.accent + '60' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: canAfford ? c.accent : '#3a3650',
                cursor: canAfford && !buying ? 'pointer' : 'default',
                opacity: buying ? 0.6 : 1,
              }}
            >
              {buying ? '...' : `💰 Купить за ${scroll.cost}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
