'use client'

import { useState } from 'react'
import type { GuideSection } from '@/lib/hub-guide'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  subtitle: string
  sections: GuideSection[]
  icon?: string
}

export default function GuideModal({ open, onClose, title, subtitle, sections, icon = '📖' }: Props) {
  const [tab, setTab] = useState(sections[0]?.id ?? '')

  if (!open) return null

  const active = sections.find(s => s.id === tab) ?? sections[0]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250, padding: '1.5rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '36px' }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a' }}>{title}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.15em', marginTop: '4px' }}>{subtitle}</div>
            </div>
            <div onClick={onClose} style={{ fontSize: '20px', color: '#5a5670', cursor: 'pointer', padding: '4px 8px' }}>✕</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
            {sections.map(s => (
              <div
                key={s.id}
                onClick={() => setTab(s.id)}
                style={{
                  padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer',
                  background: tab === s.id ? 'rgba(201,168,76,0.12)' : 'transparent',
                  border: `1px solid ${tab === s.id ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: tab === s.id ? '#e0bc6a' : '#5a5670',
                }}
              >
                {s.icon} {s.title}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {active && (
            <>
              <div style={{ fontFamily: 'serif', fontSize: '17px', color: '#e6e2f0', marginBottom: '12px' }}>
                {active.icon} {active.title}
              </div>
              {active.paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.75, marginBottom: '12px' }}>{p}</p>
              ))}
              {active.bullets && (
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '13px', color: '#9590a8', lineHeight: 1.8 }}>
                  {active.bullets.map((b, i) => (
                    <li key={i} style={{ marginBottom: '6px' }}>{b}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            onClick={onClose}
            style={{ width: '100%', padding: '12px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '15px', color: '#e0bc6a', cursor: 'pointer' }}
          >
            Понял, в бой →
          </div>
        </div>
      </div>
    </div>
  )
}
