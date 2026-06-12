'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { navUnlockFromUser, USER_NAV_SELECT } from '@/lib/nav-unlock'

const levelColors: Record<number, { border: string; accent: string; bg: string; tag: string }> = {
  1: { border: '#5a3e2b', accent: '#c9a45a', bg: '#1a1008', tag: '#3d2a14' },
  2: { border: '#2b3a5a', accent: '#5a8fc9', bg: '#080e1a', tag: '#142240' },
  3: { border: '#3a5a3a', accent: '#7ac98f', bg: '#08140e', tag: '#1a3a2a' },
  4: { border: '#5a2b4a', accent: '#c95a9f', bg: '#1a0814', tag: '#3a142a' },
}

export default function ShopPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [scrolls, setScrolls] = useState<any[]>([])
  const [owned, setOwned] = useState<number[]>([])
  const [buying, setBuying] = useState<number | null>(null)
  const [filterLevel, setFilterLevel] = useState(1)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)


  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data } = await supabase.from('users').select(USER_NAV_SELECT).eq('id', user.id).single()
      setUserData({ ...data, id: user.id })
      if (data && !data.visited_shop) {
        setShowHelp(true)
        await supabase.from('users').update({ visited_shop: true }).eq('id', user.id)
      }
      setFilterLevel(data?.level || 1)

      const { data: all } = await supabase.from('scrolls').select('*').order('level').order('cost')
      setScrolls(all || [])

      const { data: us } = await supabase.from('user_scrolls').select('scroll_id').eq('user_id', user.id)
      setOwned((us || []).map((r: any) => r.scroll_id))

      setLoading(false)
    }
    load()
  }, [])

  async function buyScroll(scroll: any) {
    if (!userData || buying) return
    if ((userData.gold || 0) < scroll.cost) {
      setToast('Недостаточно золота')
      setTimeout(() => setToast(null), 2000)
      return
    }
    setBuying(scroll.id)
    const newGold = userData.gold - scroll.cost
    await supabase.from('users').update({ gold: newGold }).eq('id', userData.id)
    await supabase.from('user_scrolls').insert({ user_id: userData.id, scroll_id: scroll.id })
    setUserData({ ...userData, gold: newGold })
    setOwned(prev => [...prev, scroll.id])
    setBuying(null)
    setToast(`Свиток «${scroll.title}» добавлен в Гримуар`)
    setTimeout(() => setToast(null), 2500)
  }

  if (loading) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Загрузка...
    </div>
  )

  const level = userData?.level || 1
  const xpThresholds = [0, 100, 250, 500, 900, 1400]
  const xpToNext = [100, 150, 250, 400, 500, 600]
  const xpBase = xpThresholds[level - 1] || 0
  const xpNext = xpToNext[level - 1] || 100
  const xpCurrent = Math.max(0, (userData?.xp || 0) - xpBase)

  const filtered = scrolls.filter(s => s.level === filterLevel)
  const availableLevels = [...new Set(scrolls.map(s => s.level))].sort()

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', display: 'flex', alignItems: 'center', gap: '6px' }}>
            💰 <span style={{ color: '#e0bc6a' }}>{userData?.gold || 0}</span>
          </div>
          <div onClick={() => setShowHelp(true)}
            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#5a5670', cursor: 'pointer', fontFamily: 'monospace' }}>
            ?
          </div>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr' }}>
        <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

        <div style={{ padding: '2rem', maxWidth: '900px' }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Лавка магических знаний</div>
            <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '4px' }}>Свитки техник</div>
            <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>За золото — лайфхаки и методы быстрого счёта. Знание остаётся с тобой навсегда.</div>
          </div>

          {/* Фильтр по уровням */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            {availableLevels.map(lv => {
              const locked = lv > level
              return (
                <div key={lv} onClick={() => !locked && setFilterLevel(lv)}
                  style={{ background: filterLevel === lv ? 'rgba(201,168,76,0.12)' : 'transparent', border: `1px solid ${filterLevel === lv ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`, color: locked ? '#3a3650' : filterLevel === lv ? '#e0bc6a' : '#5a5670', padding: '6px 14px', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: locked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Уровень {['', 'I', 'II', 'III', 'IV'][lv] || lv}
                  {locked && <span style={{ fontSize: '10px' }}>🔒</span>}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {filtered.map(s => {
              const c = levelColors[s.level] || levelColors[1]
              const isOwned = owned.includes(s.id)
              const canAfford = (userData?.gold || 0) >= s.cost
              return (
                <div key={s.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '16px 18px' }}>
                  <div style={{ fontSize: '9px', color: c.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.7 }}>Ур.{s.level}</div>
                  <div style={{ color: c.accent, fontSize: '15px', fontWeight: 'bold', marginBottom: '3px' }}>{s.title}</div>
                  <div style={{ color: '#6b5a45', fontSize: '11px', fontStyle: 'italic', marginBottom: '12px' }}>{s.subtitle}</div>
                  <div style={{ fontSize: '12px', color: '#8a7a6a', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '12px', minHeight: '36px' }}>«{s.gorus}»</div>

                  {isOwned ? (
                    <div style={{ width: '100%', padding: '8px', background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.3)', borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#3db87a' }}>
                      ✓ Изучено
                    </div>
                  ) : (
                    <div onClick={() => buyScroll(s)}
                      style={{ width: '100%', padding: '8px', background: canAfford ? `${c.accent}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${canAfford ? c.accent + '60' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: canAfford ? c.accent : '#3a3650', cursor: canAfford ? 'pointer' : 'default', opacity: buying === s.id ? 0.5 : 1 }}>
                      {buying === s.id ? '...' : `💰 Купить за ${s.cost}`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#5a5670', fontSize: '13px', fontStyle: 'italic', padding: '3rem 0' }}>
              Свитков для этого уровня пока нет.
            </div>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', padding: '12px 24px', fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
