'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  MOBILE_BOTTOM_NAV,
  MOBILE_MORE_NAV,
  showMobileBottomNav,
} from '@/lib/mobile-nav'
import { isNavItemUnlocked, navUnlockFromUser } from '@/lib/nav-unlock'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const [navState, setNavState] = useState(navUnlockFromUser(null))

  const visible = showMobileBottomNav(pathname)

  useEffect(() => {
    if (!visible) return
    document.body.classList.add('lf-mobile-nav-active')
    return () => document.body.classList.remove('lf-mobile-nav-active')
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('onboarding_step, level, visited_college, visited_training, visited_guild, visited_grimoire, visited_shop, visited_skills, quest_first_dungeon')
        .eq('id', user.id)
        .single()
      if (data) setNavState(navUnlockFromUser(data))
    })
  }, [visible, pathname])

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  if (!visible) return null

  function go(href: string) {
    setMoreOpen(false)
    router.push(href)
  }

  const moreActive = MOBILE_MORE_NAV.some(item => pathname === item.href)

  return (
    <>
      {moreOpen && (
        <div
          className="lf-mobile-more-backdrop"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="lf-mobile-more-sheet">
          <div className="lf-mobile-more-title">Ещё</div>
          {MOBILE_MORE_NAV.map(item => {
            const unlocked = isNavItemUnlocked(item, navState, pathname)
            const active = pathname === item.href
            return (
              <button
                key={item.href}
                type="button"
                disabled={!unlocked}
                className={`lf-mobile-more-item${active ? ' lf-mobile-more-item--active' : ''}${!unlocked ? ' lf-mobile-more-item--locked' : ''}`}
                onClick={() => unlocked && go(item.href)}
              >
                <span className="lf-mobile-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {!unlocked && <span className="lf-mobile-nav-lock">🔒</span>}
              </button>
            )
          })}
        </div>
      )}

      <nav className="lf-mobile-bottom-nav" aria-label="Навигация">
        {MOBILE_BOTTOM_NAV.map(item => {
          const unlocked = isNavItemUnlocked(item, navState, pathname)
          const active = pathname === item.href
          return (
            <button
              key={item.href}
              type="button"
              disabled={!unlocked}
              className={`lf-mobile-nav-item${active ? ' lf-mobile-nav-item--active' : ''}${!unlocked ? ' lf-mobile-nav-item--locked' : ''}`}
              onClick={() => unlocked && go(item.href)}
            >
              <span className="lf-mobile-nav-icon">{item.icon}</span>
              <span className="lf-mobile-nav-label">{item.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          className={`lf-mobile-nav-item${moreActive ? ' lf-mobile-nav-item--active' : ''}${moreOpen ? ' lf-mobile-nav-item--open' : ''}`}
          onClick={() => setMoreOpen(v => !v)}
        >
          <span className="lf-mobile-nav-icon">☰</span>
          <span className="lf-mobile-nav-label">Ещё</span>
        </button>
      </nav>
    </>
  )
}
