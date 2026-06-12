'use client'

import { usePathname, useRouter } from 'next/navigation'
import { APP_NAV } from '@/lib/app-nav'

type Props = {
  step?: number
}

export default function AppNav({ step = 0 }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>
        Навигация
      </div>
      {APP_NAV.map(item => {
        const isActive = pathname === item.href
        const locked = step < item.minStep
        return (
          <div
            key={item.href}
            onClick={() => !locked && router.push(item.href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 10px',
              borderRadius: '7px',
              fontSize: '14px',
              color: locked ? '#2a2d3a' : isActive ? '#a99fff' : '#5a5670',
              background: isActive ? 'rgba(123,108,255,0.13)' : 'transparent',
              borderLeft: `2px solid ${isActive ? '#7b6cff' : 'transparent'}`,
              cursor: locked ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!locked && !isActive) (e.currentTarget as HTMLElement).style.color = '#9590a8'
            }}
            onMouseLeave={e => {
              if (!locked && !isActive) (e.currentTarget as HTMLElement).style.color = '#5a5670'
            }}
          >
            <span style={{ width: '18px', textAlign: 'center', opacity: locked ? 0.3 : 1 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {locked && <span style={{ fontSize: '10px', color: '#2a2d3a' }}>🔒</span>}
          </div>
        )
      })}
    </>
  )
}
