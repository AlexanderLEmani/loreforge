'use client'

import { useRouter } from 'next/navigation'

const NAV = [
  { icon: '🏰', label: 'Хаб',        href: '/hub',      minStep: 0 },
  { icon: '👤', label: 'Персонаж',   href: '/character', minStep: 0 },
  { icon: '🏛️', label: 'Коллегия',   href: '/college',  minStep: 0 },
  { icon: '🏋️', label: 'Тренировка', href: '/training', minStep: 1 },
  { icon: '⚔️', label: 'Гильдия',    href: '/guild',    minStep: 2 },
  { icon: '📖', label: 'Гримуар',    href: '/grimoire', minStep: 1 },
  { icon: '🛒', label: 'Лавка',      href: '/shop',     minStep: 1 },
]

type Props = {
  active: string
  characterName?: string
  level?: number
  xp?: number
  xpNext?: number
  gold?: number
  step?: number
}

export default function Sidebar({ active, level = 1, xp = 0, xpNext = 100, gold = 0, step = 3 }: Props) {
  const router = useRouter()
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

      <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Навигация</div>

      {NAV.map(item => {
        const isActive = item.label === active
        const locked = step < item.minStep
        return (
          <div key={item.label}
            onClick={() => !locked && router.push(item.href)}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '7px', fontSize: '14px', color: locked ? '#2a2d3a' : isActive ? '#a99fff' : '#5a5670', background: isActive ? 'rgba(123,108,255,0.13)' : 'transparent', borderLeft: `2px solid ${isActive ? '#7b6cff' : 'transparent'}`, cursor: locked ? 'default' : 'pointer', transition: 'all 0.15s', position: 'relative' }}
            onMouseEnter={e => { if (!locked && !isActive) (e.currentTarget as HTMLElement).style.color = '#9590a8' }}
            onMouseLeave={e => { if (!locked && !isActive) (e.currentTarget as HTMLElement).style.color = '#5a5670' }}
          >
            <span style={{ width: '18px', textAlign: 'center', opacity: locked ? 0.3 : 1 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {locked && <span style={{ fontSize: '10px', color: '#2a2d3a' }}>🔒</span>}
          </div>
        )
      })}
    </div>
  )
}