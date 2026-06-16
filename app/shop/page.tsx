'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import ScrollPreviewModal from '@/components/ScrollPreviewModal'
import { navUnlockFromUser, USER_NAV_SELECT } from '@/lib/nav-unlock'
import {
  BATTLE_CONSUMABLES,
  consumableMeta,
  EMPTY_CONSUMABLES,
  parseConsumables,
  type ConsumableInventory,
} from '@/lib/battle-consumables'
import { loadDemoSkillState } from '@/lib/skill-tree'
import {
  isSpellLearned,
  parseCompletedLectures,
  parseLearnedSpells,
  SPELL_SCROLL_DEFS,
  spellPurchaseGate,
  type LearnedSpells,
  type SpellScrollId,
} from '@/lib/battle-spell-scrolls'
import { layout } from '@/lib/layout-classes'
import { xpProgress } from '@/lib/economy'
import { LoadingScreen } from '@/components/LoadingScreen'

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
  const [buyingConsumable, setBuyingConsumable] = useState<string | null>(null)
  const [consumables, setConsumables] = useState<ConsumableInventory>(EMPTY_CONSUMABLES)
  const [learnedSpells, setLearnedSpells] = useState<LearnedSpells>([])
  const [completedLectures, setCompletedLectures] = useState<number[]>([])
  const [unlockedNodeIds, setUnlockedNodeIds] = useState<number[]>([])
  const [buyingSpell, setBuyingSpell] = useState<SpellScrollId | null>(null)
  const [filterLevel, setFilterLevel] = useState(1)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [previewScroll, setPreviewScroll] = useState<any | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data } = await supabase.from('users').select(`${USER_NAV_SELECT}, consumables, learned_spells, spell_scrolls, completed_lectures`).eq('id', user.id).single()
      setUserData({ ...data, id: user.id })
      setConsumables(parseConsumables(data?.consumables))
      setLearnedSpells(parseLearnedSpells(data?.learned_spells, data?.spell_scrolls))
      setCompletedLectures(parseCompletedLectures(data?.completed_lectures))

      const { data: userSkills } = await supabase.from('user_skills').select('node_id').eq('user_id', user.id)
      let unlockedIds = (userSkills || []).map(s => Number(s.node_id)).filter(n => !Number.isNaN(n))
      if (unlockedIds.length === 0) {
        unlockedIds = loadDemoSkillState().unlocked.map(id => Number(id)).filter(n => !Number.isNaN(n))
      }
      setUnlockedNodeIds(unlockedIds)
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
    setPreviewScroll(null)
    setToast(`Свиток «${scroll.title}» добавлен в Гримуар`)
    setTimeout(() => setToast(null), 2500)
  }

  async function buyConsumable(effect: string, name: string, cost: number) {
    if (!userData || buyingConsumable) return
    if ((userData.gold || 0) < cost) {
      setToast('Недостаточно золота')
      setTimeout(() => setToast(null), 2000)
      return
    }
    setBuyingConsumable(effect)
    const newGold = userData.gold - cost
    const newInv = { ...consumables, [effect]: consumables[effect as keyof ConsumableInventory] + 1 }
    await supabase.from('users').update({ gold: newGold, consumables: newInv }).eq('id', userData.id)
    setUserData({ ...userData, gold: newGold })
    setConsumables(newInv)
    setBuyingConsumable(null)
    setToast(`${name} +1 (в запасе: ${newInv[effect as keyof ConsumableInventory]})`)
    setTimeout(() => setToast(null), 2500)
  }

  async function learnSpell(def: (typeof SPELL_SCROLL_DEFS)[number]) {
    if (!userData || buyingSpell) return
    const gate = spellPurchaseGate(def, {
      learned: learnedSpells,
      unlockedNodeIds,
      completedLectures,
      userLevel: userData.level || 1,
      gold: userData.gold || 0,
    })
    if (!gate.ok) {
      setToast(gate.message)
      setTimeout(() => setToast(null), 2800)
      return
    }
    setBuyingSpell(def.id)
    const newGold = (userData.gold || 0) - def.cost
    const nextLearned = [...learnedSpells, def.id]
    await supabase.from('users').update({ gold: newGold, learned_spells: nextLearned }).eq('id', userData.id)
    setUserData({ ...userData, gold: newGold })
    setLearnedSpells(nextLearned)
    setBuyingSpell(null)
    setToast(`✦ «${def.name}» выучено — доступно в бою навсегда`)
    setTimeout(() => setToast(null), 3200)
  }

  if (loading) return <LoadingScreen />

  const level = userData?.level || 1
  const { current: xpCurrent, next: xpNext } = xpProgress(userData?.xp || 0, level)

  const filtered = scrolls.filter(s => s.level === filterLevel)
  const availableLevels = [...new Set(scrolls.map(s => s.level))].sort()

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      <nav className={layout.navBar} style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreHeim
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

      <div className={layout.twoCol}>
        <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

        <div className={`${layout.main} lf-main`} style={{ maxWidth: '900px' }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Лавка магических знаний</div>
            <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '4px' }}>Свитки техник</div>
            <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>
              Расходники — на один данж. Заклинания — навсегда после покупки. Свитки техник — в Гримуар.
            </div>
          </div>

          <div style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(123,108,255,0.08), rgba(11,12,16,0.6))', border: '1px solid rgba(169,159,255,0.25)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#a99fff', textTransform: 'uppercase', marginBottom: '6px' }}>Боевые заклинания</div>
                <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#e6e2f0', marginBottom: '4px' }}>Выучи один раз — используй всегда</div>
                <div style={{ fontSize: '12px', color: '#8a849c', lineHeight: 1.55, maxWidth: '520px' }}>
                  1) Прочитай лекцию в Коллегии · 2) Открой «Мастер …» на древе · 3) Купи здесь · 4) Заклинание появится в бою
                </div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#3db87a', background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.25)', borderRadius: '8px', padding: '8px 12px' }}>
                Выучено: {learnedSpells.length}/{SPELL_SCROLL_DEFS.length}
              </div>
            </div>
            <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {SPELL_SCROLL_DEFS.map(def => {
                const learned = isSpellLearned(learnedSpells, def.id)
                const gate = spellPurchaseGate(def, {
                  learned: learnedSpells,
                  unlockedNodeIds,
                  completedLectures,
                  userLevel: level,
                  gold: userData?.gold || 0,
                })
                const canBuy = gate.ok
                const lockReason = !gate.ok && gate.reason !== 'learned' ? gate.message : null
                return (
                  <div
                    key={def.id}
                    style={{
                      background: learned ? 'rgba(61,184,122,0.06)' : '#141820',
                      border: `1px solid ${learned ? 'rgba(61,184,122,0.35)' : canBuy ? 'rgba(169,159,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '12px',
                      padding: '16px',
                      opacity: !learned && !canBuy && lockReason ? 0.72 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '28px', lineHeight: 1 }}>{def.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', color: '#e6e2f0', fontWeight: 'bold', marginBottom: '2px' }}>{def.name}</div>
                        <div style={{ fontSize: '11px', color: '#8a849c', lineHeight: 1.45 }}>{def.shortDesc}</div>
                      </div>
                    </div>
                    {learned ? (
                      <div style={{ padding: '10px', textAlign: 'center', borderRadius: '8px', background: 'rgba(61,184,122,0.1)', border: '1px solid rgba(61,184,122,0.35)', fontFamily: 'monospace', fontSize: '11px', color: '#3db87a' }}>
                        ✦ Выучено · в бою навсегда
                      </div>
                    ) : lockReason ? (
                      <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', fontSize: '11px', color: '#c8a0a0', lineHeight: 1.45, marginBottom: canBuy ? 0 : '8px' }}>
                        🔒 {lockReason}
                      </div>
                    ) : null}
                    {!learned && (
                      <div
                        onClick={() => canBuy && learnSpell(def)}
                        style={{
                          marginTop: lockReason ? '8px' : 0,
                          padding: '10px', textAlign: 'center', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px',
                          background: canBuy ? 'rgba(169,159,255,0.14)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${canBuy ? 'rgba(169,159,255,0.45)' : 'rgba(255,255,255,0.06)'}`,
                          color: canBuy ? '#a99fff' : '#3a3650',
                          cursor: canBuy ? 'pointer' : 'default',
                          opacity: buyingSpell === def.id ? 0.5 : 1,
                        }}
                      >
                        {buyingSpell === def.id ? 'Изучаем…' : canBuy ? `Выучить · 💰 ${def.cost}` : `💰 ${def.cost}`}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>Расходники для данжа</div>
            <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {BATTLE_CONSUMABLES.map(c => {
                const meta = consumableMeta(c.effect)
                const canAfford = (userData?.gold || 0) >= c.cost
                const qty = consumables[c.effect]
                return (
                  <div key={c.effect} style={{ background: '#141820', border: '1px solid rgba(169,159,255,0.2)', borderRadius: '8px', padding: '14px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{meta.icon}</div>
                    <div style={{ fontSize: '13px', color: '#c8c0d8', marginBottom: '2px' }}>{c.name}</div>
                    <div style={{ fontSize: '10px', color: '#8a849c', marginBottom: '8px', lineHeight: 1.4 }}>{c.shortDesc}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#a99fff', marginBottom: '8px' }}>В запасе: ×{qty}</div>
                    <div
                      onClick={() => buyConsumable(c.effect, c.name, c.cost)}
                      style={{
                        padding: '8px', textAlign: 'center', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px',
                        background: canAfford ? 'rgba(169,159,255,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${canAfford ? 'rgba(169,159,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
                        color: canAfford ? '#a99fff' : '#3a3650',
                        cursor: canAfford ? 'pointer' : 'default',
                        opacity: buyingConsumable === c.effect ? 0.5 : 1,
                      }}
                    >
                      {buyingConsumable === c.effect ? '...' : `💰 ${c.cost}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#e0bc6a', marginBottom: '1rem' }}>Свитки техник</div>

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

          <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {filtered.map(s => {
              const c = levelColors[s.level] || levelColors[1]
              const isOwned = owned.includes(s.id)
              const canAfford = (userData?.gold || 0) >= s.cost
              return (
                <div key={s.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '16px 18px' }}>
                  <div style={{ fontSize: '9px', color: c.accent, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: '6px' }}>Ур.{s.level} · Гримуар</div>
                  <div style={{ color: c.accent, fontSize: '15px', fontWeight: 'bold', marginBottom: '3px' }}>{s.title}</div>
                  <div style={{ color: '#6b5a45', fontSize: '11px', fontStyle: 'italic', marginBottom: '10px' }}>{s.subtitle}</div>

                  {isOwned ? (
                    <div style={{ width: '100%', padding: '8px', background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.3)', borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#3db87a', marginBottom: '6px' }}>
                      ✓ В Гримуаре
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                      <div
                        onClick={() => setPreviewScroll(s)}
                        style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.border}`, borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', color: '#9590a8', cursor: 'pointer' }}
                      >
                        Просмотр
                      </div>
                      <div
                        onClick={() => buyScroll(s)}
                        style={{ flex: 1, padding: '8px', background: canAfford ? `${c.accent}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${canAfford ? c.accent + '60' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', color: canAfford ? c.accent : '#3a3650', cursor: canAfford ? 'pointer' : 'default', opacity: buying === s.id ? 0.5 : 1 }}
                      >
                        {buying === s.id ? '...' : `💰 ${s.cost}`}
                      </div>
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

      {previewScroll && (
        <ScrollPreviewModal
          scroll={previewScroll}
          colors={levelColors[previewScroll.level] || levelColors[1]}
          owned={owned.includes(previewScroll.id)}
          canAfford={(userData?.gold || 0) >= previewScroll.cost}
          buying={buying === previewScroll.id}
          onClose={() => setPreviewScroll(null)}
          onBuy={() => buyScroll(previewScroll)}
          onOpenGrimoire={() => router.push('/grimoire')}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', padding: '12px 24px', fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      {showHelp && (
        <div className="lf-modal-overlay">
          <div className="lf-modal-panel">
            <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '12px' }}>Лавка свитков</div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              <strong style={{ color: '#a99fff' }}>Заклинания</strong> — выучи один раз, используй в бою с кулдауном.
              <br />
              <strong style={{ color: '#e0bc6a' }}>Свитки техник</strong> — в Гримуар для учёбы.
              <br />
              <strong style={{ color: '#9590a8' }}>Расходники</strong> — одноразовые бафы, возьми в рюкзак перед данжом.
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
