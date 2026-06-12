'use client'

import AppNav from '@/components/AppNav'

type Props = {
  level?: number
  xp?: number
  xpNext?: number
  gold?: number
  step?: number
}

export default function Sidebar({ level = 1, xp = 0, xpNext = 100, gold = 0, step = 0 }: Props) {
  const xpPct = Math.min((xp / xpNext) * 100, 100)

  return (
    <div style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 'calc(100vh - 56px)' }}>

      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', marginBottom: '4px' }}>
          <span>УРОВЕНЬ {level}</span><span>{xp} / {xpNext}</span>
        </div>
        <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#7b6cff', width: `${xpPct}%`, transition: 'width 0.4s' }}></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '7px', fontFamily: 'monospace', fontSize: '11px' }}>
        <span style={{ color: '#5a5670' }}>💰 Золото</span>
        <span style={{ color: '#e0bc6a' }}>{gold}</span>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}></div>

      <AppNav step={step} />
    </div>
  )
}
