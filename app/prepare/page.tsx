'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  BATTLE_CONSUMABLES,
  consumableMeta,
  parseConsumables,
  type ConsumableInventory,
} from '@/lib/battle-consumables'
import type { ScrollBattleEffect } from '@/lib/battle-config'
import {
  MAX_BATTLE_LOADOUT,
  saveBattleLoadout,
  slotsToLoadout,
  subtractInventory,
} from '@/lib/battle-loadout'

function PrepareContent() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const dungeonName = params.get('dungeon') || 'Пещера сложения'

  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<ConsumableInventory>({ hint: 0, power: 0, shield: 0, heal: 0 })
  const [slots, setSlots] = useState<ScrollBattleEffect[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserId(user.id)
      const { data } = await supabase.from('users').select('consumables').eq('id', user.id).single()
      setInventory(parseConsumables(data?.consumables))
      setLoading(false)
    }
    load()
  }, [])

  function inLoadoutCount(effect: ScrollBattleEffect) {
    return slots.filter(s => s === effect).length
  }

  function addItem(effect: ScrollBattleEffect) {
    if (slots.length >= MAX_BATTLE_LOADOUT) return
    if (inLoadoutCount(effect) >= inventory[effect]) return
    setSlots(prev => [...prev, effect])
  }

  function removeSlot(index: number) {
    setSlots(prev => prev.filter((_, i) => i !== index))
  }

  async function enterDungeon() {
    if (!userId || entering) return
    setEntering(true)
    setError('')
    const loadout = slotsToLoadout(slots)
    const newInv = subtractInventory(inventory, loadout)
    const { error: upErr } = await supabase
      .from('users')
      .update({ consumables: newInv })
      .eq('id', userId)
    if (upErr) {
      setError('Не удалось уложить рюкзак. Попробуй ещё раз.')
      setEntering(false)
      return
    }
    saveBattleLoadout({ dungeon: dungeonName, loadout })
    router.push(`/battle?dungeon=${encodeURIComponent(dungeonName)}`)
  }

  if (loading) {
    return (
      <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif' }}>
        Загрузка...
      </div>
    )
  }

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', color: '#e6e2f0' }}>
      <nav style={{ height: '56px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
        <div onClick={() => router.push('/guild')} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#5a5670', cursor: 'pointer' }}>
          ← Гильдия
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '6px' }}>
            Перед выходом
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '28px', color: '#e0bc6a', marginBottom: '6px' }}>Собери рюкзак</div>
          <div style={{ fontSize: '14px', color: '#9590a8', lineHeight: 1.6 }}>
            Данж: <span style={{ color: '#c8c0d8' }}>{dungeonName}</span>. Возьми с собой до {MAX_BATTLE_LOADOUT} расходников — свитки, зелья и руны из запаса.
          </div>
        </div>

        <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', letterSpacing: '0.15em', marginBottom: '10px' }}>
            В РЮКЗАКЕ ({slots.length}/{MAX_BATTLE_LOADOUT})
          </div>
          {slots.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>Пусто — можно войти без расходников</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {slots.map((effect, i) => {
                const meta = consumableMeta(effect)
                const item = BATTLE_CONSUMABLES.find(c => c.effect === effect)
                return (
                  <div
                    key={`${effect}-${i}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'rgba(123,108,255,0.1)', border: '1px solid rgba(169,159,255,0.35)',
                      borderRadius: '8px', padding: '8px 12px',
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span style={{ fontSize: '13px' }}>{item?.name ?? meta.label}</span>
                    <span onClick={() => removeSlot(i)} style={{ cursor: 'pointer', color: '#e05555', fontFamily: 'monospace', fontSize: '12px' }}>✕</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em', color: '#5a5670', marginBottom: '10px' }}>ЗАПАС В ЛАВКЕ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
          {BATTLE_CONSUMABLES.map(c => {
            const meta = consumableMeta(c.effect)
            const stock = inventory[c.effect]
            const taken = inLoadoutCount(c.effect)
            const canAdd = slots.length < MAX_BATTLE_LOADOUT && taken < stock
            return (
              <div
                key={c.effect}
                onClick={() => canAdd && addItem(c.effect)}
                style={{
                  background: canAdd ? '#141820' : '#121418',
                  border: `1px solid ${canAdd ? 'rgba(169,159,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '10px', padding: '14px',
                  cursor: canAdd ? 'pointer' : 'default',
                  opacity: stock === 0 ? 0.45 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff' }}>
                    ×{stock}{taken > 0 ? ` (−${taken})` : ''}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#e6e2f0', marginBottom: '4px' }}>{c.name}</div>
                <div style={{ fontSize: '11px', color: '#8a849c', lineHeight: 1.4 }}>{c.shortDesc}</div>
                {canAdd && (
                  <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '10px', color: '#3db87a' }}>+ в рюкзак</div>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', color: '#e05555', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div
          onClick={enterDungeon}
          style={{
            padding: '16px', textAlign: 'center', borderRadius: '12px',
            background: entering ? 'rgba(61,184,122,0.06)' : 'rgba(61,184,122,0.14)',
            border: '1px solid rgba(61,184,122,0.45)',
            color: entering ? '#5a5670' : '#3db87a',
            fontSize: '18px', cursor: entering ? 'default' : 'pointer',
          }}
        >
          {entering ? 'Входим...' : `Войти в данж → (${slots.length}/${MAX_BATTLE_LOADOUT} в рюкзаке)`}
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#5a5670', fontStyle: 'italic' }}>
          Взятые предметы списываются из запаса при входе
        </div>
      </div>
    </div>
  )
}

export default function PreparePage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif' }}>
        Загрузка...
      </div>
    }>
      <PrepareContent />
    </Suspense>
  )
}
