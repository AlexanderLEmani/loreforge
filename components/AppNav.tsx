'use client'

import { usePathname, useRouter } from 'next/navigation'
import { APP_NAV } from '@/lib/app-nav'
import { isNavItemUnlocked, type NavUnlockState } from '@/lib/nav-unlock'

type Props = {
  step?: number
  navUnlock?: NavUnlockState
}

export default function AppNav({ step = 0, navUnlock }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const state: NavUnlockState = navUnlock ?? { onboarding_step: step }

  return (
    <>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>
        Навигация
      </div>
      {APP_NAV.map(item => {
        const isActive = pathname === item.href
        const unlocked = isNavItemUnlocked(item, state, pathname)
        const locked = !unlocked
        return (
          <div
            key={item.href}
            onClick={() => unlocked && router.push(item.href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 10px',
              borderRadius: '7px',
              fontSize: '14px',
              color: locked ? '#3a3650' : isActive ? '#a99fff' : '#9590a8',
              background: isActive ? 'rgba(123,108,255,0.13)' : 'transparent',
              borderLeft: `2px solid ${isActive ? '#7b6cff' : 'transparent'}`,
              cursor: locked ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (unlocked && !isActive) (e.currentTarget as HTMLElement).style.color = '#b8b0c8'
            }}
            onMouseLeave={e => {
              if (unlocked && !isActive) (e.currentTarget as HTMLElement).style.color = '#9590a8'
            }}
          >
            <span style={{ width: '18px', textAlign: 'center', opacity: locked ? 0.35 : 1 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {locked && !isActive && <span style={{ fontSize: '10px', color: '#3a3650' }}>🔒</span>}
          </div>
        )
      })}
    </>
  )
}
