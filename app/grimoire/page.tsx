'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { navUnlockFromUser, USER_NAV_SELECT } from '@/lib/nav-unlock'
import { scrollSupportsTraining } from '@/lib/scroll-training'
import { layout } from '@/lib/layout-classes'
import { xpProgress } from '@/lib/economy'

const levelColors: Record<number, { border: string; accent: string; bg: string; tag: string }> = {
  1: { border: '#5a3e2b', accent: '#c9a45a', bg: '#1a1008', tag: '#3d2a14' },
  2: { border: '#2b3a5a', accent: '#5a8fc9', bg: '#080e1a', tag: '#142240' },
  3: { border: '#3a5a3a', accent: '#7ac98f', bg: '#08140e', tag: '#1a3a2a' },
  4: { border: '#5a2b4a', accent: '#c95a9f', bg: '#1a0814', tag: '#3a142a' },
}

export default function GrimoirePage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [scrolls, setScrolls] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [filterLevel, setFilterLevel] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data } = await supabase.from('users').select(USER_NAV_SELECT).eq('id', user.id).single()
      setUserData({ ...data, id: user.id })
      if (data && !data.visited_grimoire) {
        setShowHelp(true)
        await supabase.from('users').update({ visited_grimoire: true }).eq('id', user.id)
      }

      const { data: us } = await supabase.from('user_scrolls').select('scroll_id, scrolls(*)').eq('user_id', user.id)
      const owned = (us || []).map((row: any) => row.scrolls).filter(Boolean)
      setScrolls(owned)

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Загрузка...
    </div>
  )

  const level = userData?.level || 1
  const { current: xpCurrent, next: xpNext } = xpProgress(userData?.xp || 0, level)

  const filtered = filterLevel === 0 ? scrolls : scrolls.filter(s => s.level === filterLevel)

  // ДЕТАЛЬНЫЙ ВИД СВИТКА
  if (selected) {
    const c = levelColors[selected.level] || levelColors[1]
    return (
      <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>
        <nav className={layout.navBar} style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
            LoreForge
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>Гримуар · Свиток</div>
        </nav>

        <div className={layout.twoCol}>
          <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />
          <div className={`${layout.main} lf-main`} style={{ maxWidth: '680px' }}>
          <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '2rem', position: 'relative', boxShadow: `0 0 40px ${c.accent}18` }}>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-block', background: c.tag, border: `1px solid ${c.border}`, color: c.accent, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '3px 12px', marginBottom: '12px', borderRadius: '4px' }}>
                Уровень {selected.level} · Свиток
              </div>
              <h1 style={{ color: c.accent, fontSize: '26px', fontWeight: 'bold', margin: '0 0 4px', textShadow: `0 0 20px ${c.accent}44` }}>{selected.title}</h1>
              <div style={{ color: '#6b5a45', fontSize: '13px', fontStyle: 'italic' }}>{selected.subtitle}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', opacity: 0.5 }}>
              <div style={{ flex: 1, height: '1px', background: c.border }}></div>
              <div style={{ color: c.accent, fontSize: '12px' }}>⬡</div>
              <div style={{ flex: 1, height: '1px', background: c.border }}></div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}66`, borderLeft: `3px solid ${c.accent}`, padding: '10px 14px', marginBottom: '20px', borderRadius: '2px' }}>
              <div style={{ color: '#8a7a6a', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '5px', textTransform: 'uppercase' }}>Профессор Горус</div>
              <div style={{ color: '#d4c4a0', fontSize: '14px', fontStyle: 'italic', lineHeight: 1.6 }}>«{selected.gorus}»</div>
            </div>

            <div style={{ color: '#b8a888', fontSize: '14px', lineHeight: 1.75, marginBottom: '20px' }}>{selected.body}</div>

            <div style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${c.border}`, borderRadius: '2px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ color: c.accent, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>Пример · {selected.example.task}</div>
              <div style={{ fontFamily: "'Courier New', monospace" }}>
                {selected.example.steps.map((step: string, i: number) => (
                  <div key={i} style={{ color: step.startsWith('=') ? c.accent : step === '' ? 'transparent' : '#c8b890', fontSize: '13px', lineHeight: 1.8, paddingLeft: step.startsWith('→') ? '8px' : 0, fontWeight: step.startsWith('=') ? 'bold' : 'normal' }}>
                    {step || '·'}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', borderTop: `1px solid ${c.border}44`, paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ color: c.accent, fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚔</div>
              <div style={{ color: '#8a7a6a', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.6 }}>{selected.combat}</div>
            </div>

            {scrollSupportsTraining(selected) && (
              <div onClick={() => router.push(`/training?scroll=${selected.id}`)}
                style={{ display: 'block', width: '100%', background: 'rgba(61,184,122,0.12)', border: '1px solid rgba(61,184,122,0.45)', color: '#3db87a', padding: '12px', fontSize: '13px', letterSpacing: '0.08em', cursor: 'pointer', textAlign: 'center', borderRadius: '6px', marginBottom: '10px' }}>
                🏋️ Тренировать по этому свитку →
              </div>
            )}

            <div onClick={() => setSelected(null)}
              style={{ display: 'block', width: '100%', background: 'transparent', border: `1px solid ${c.border}`, color: c.accent, padding: '10px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center', borderRadius: '4px' }}>
              ← Вернуться в Гримуар
            </div>
          </div>
          </div>
        </div>
      </div>
    )
  }

  // СПИСОК СВИТКОВ
  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      <nav className={layout.navBar} style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>Гримуар · {scrolls.length} свитков</div>
          <div onClick={() => setShowHelp(true)}
            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#5a5670', cursor: 'pointer', fontFamily: 'monospace' }}>
            ?
          </div>
        </div>
      </nav>

      <div className={layout.twoCol}>
        <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

        <div className={`${layout.main} lf-main`} style={{ maxWidth: '900px' }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Архив знаний</div>
            <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '4px' }}>Гримуар</div>
            <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>Математика — это оружие. Свитки — это заклинания.</div>
          </div>

          {/* Фильтр */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            {[['Все', 0], ['Уровень I', 1], ['Уровень II', 2], ['Уровень III', 3], ['Уровень IV', 4]].map(([label, val]) => (
              <div key={label as string} onClick={() => setFilterLevel(val as number)}
                style={{ background: filterLevel === val ? 'rgba(201,168,76,0.12)' : 'transparent', border: `1px solid ${filterLevel === val ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`, color: filterLevel === val ? '#e0bc6a' : '#5a5670', padding: '6px 14px', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer' }}>
                {label as string}
              </div>
            ))}
          </div>

          {scrolls.length === 0 ? (
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📖</div>
              <div style={{ fontFamily: 'serif', fontSize: '18px', color: '#9590a8', marginBottom: '8px' }}>Гримуар пуст</div>
              <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic', marginBottom: '1.5rem' }}>Купи свитки в Лавке чтобы изучить техники быстрого счёта.</div>
              <div onClick={() => router.push('/shop')}
                style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a', cursor: 'pointer' }}>
                🛒 Открыть Лавку
              </div>
            </div>
          ) : (
            <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {filtered.map(s => {
                const c = levelColors[s.level] || levelColors[1]
                return (
                  <div key={s.id} onClick={() => setSelected(s)}
                    style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${c.accent}22` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ fontSize: '9px', color: c.accent, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '6px' }}>Ур.{s.level}</div>
                    <div style={{ color: c.accent, fontSize: '15px', fontWeight: 'bold', marginBottom: '3px' }}>{s.title}</div>
                    <div style={{ color: '#6b5a45', fontSize: '11px', fontStyle: 'italic' }}>{s.subtitle}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {showHelp && (
        <div className="lf-modal-overlay">
          <div className="lf-modal-panel">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>📖</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '6px' }}>Гримуар</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>АРХИВ ЗНАНИЙ</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Здесь хранятся все <span style={{ color: '#e0bc6a' }}>свитки</span>, которые ты купил в <span style={{ color: '#a99fff' }}>🛒 Лавке</span>.
              <br/><br/>
              Каждый свиток — техника быстрого счёта: метод, пример и применение в бою. Открывай любой в любой момент чтобы повторить.
              <br/><br/>
              Гримуар пуст? Зайди в Лавку и купи первый свиток за золото из данжей.
            </div>
            <div onClick={() => setShowHelp(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#e0bc6a', cursor: 'pointer' }}>
              Понял →
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
