'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PixelCharacter from '@/components/PixelCharacter'
import { DEFAULT_EQUIPMENT } from '@/lib/equipment'
import { saveEquippedLocal, saveOwnedLocal } from '@/lib/equipment-storage'

const RACES = [
  { id: 'human',  icon: '🧙', label: 'Человек',  desc: '+10% XP за всё' },
  { id: 'elf',    icon: '🧝', label: 'Эльф',     desc: '+20% XP за магию' },
  { id: 'dwarf',  icon: '⛏️', label: 'Дварф',    desc: 'Таймер защиты +5с' },
  { id: 'orc',    icon: '👹', label: 'Орк',       desc: 'Кулак +5 урона' },
  { id: 'undead', icon: '💀', label: 'Нежить',   desc: 'Кулдаун магии -1' },
]

const HAIR_STYLES = ['a1', 'a2', 'a3', 'a4', 'a5']
const HAIR_LABELS: Record<string, string> = { a1: 'Короткие', a2: 'Длинные', a3: 'Хвост', a4: 'Бритый', a5: 'Дикие' }

const SKIN_COLORS = ['#f5d5a8', '#e8b88a', '#c8a882', '#a0785a', '#7a5240', '#4a3020']
const HAIR_COLORS = ['#f5e6c0', '#e0bc6a', '#c8860a', '#8B4513', '#3d2b1f', '#1a1a2e', '#e05555', '#7b6cff', '#2dd9b8']
const CLOAK_COLORS = ['#4a1f6e', '#1f3a6e', '#1f6e3a', '#6e1f1f', '#3a3a3a', '#1a1a2e', '#6e4a1f', '#2a1f4e']

export default function CreateCharacter() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [race, setRace] = useState('human')
  const [skinColor, setSkinColor] = useState('#c8a882')
  const [hairStyle, setHairStyle] = useState('a1')
  const [hairColor, setHairColor] = useState('#3d2b1f')
  const [cloakColor, setCloakColor] = useState('#4a1f6e')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: ch } = await supabase.from('characters').select('user_id').eq('user_id', user.id).maybeSingle()
      if (ch) router.push('/character')
    }
    checkExisting()
  }, [])

  async function handleCreate() {
    if (!name.trim()) { setError('Дай имя персонажу'); return }
    if (name.trim().length < 2) { setError('Имя слишком короткое'); return }
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { error: err } = await supabase.from('characters').insert({
      user_id: user.id,
      name: name.trim(),
      race,
      skin_color: skinColor,
      hair_style: hairStyle,
      hair_color: hairColor,
      cloak_color: cloakColor,
    })

    if (err) { setError('Ошибка сохранения. Попробуй ещё раз.'); setSaving(false); return }
    saveEquippedLocal(user.id, DEFAULT_EQUIPMENT)
    saveOwnedLocal(user.id, Object.values(DEFAULT_EQUIPMENT))
    router.push('/hub')
  }

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      {/* Хедер */}
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.3em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '6px' }}>LoreForge · Начало пути</div>
        <div style={{ fontFamily: 'serif', fontSize: '28px', color: '#e0bc6a' }}>Создай персонажа</div>
        <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic', marginTop: '4px' }}>Имя и раса — навсегда. Внешность можно менять.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', maxWidth: '1000px', margin: '0 auto', padding: '2rem', gap: '2rem' }}>

        {/* ПРЕВЬЮ ПЕРСОНАЖА */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '1rem' }}>Предпросмотр</div>
            <div style={{ background: '#0d0f14', borderRadius: '12px', border: '1px solid rgba(201,168,76,0.1)', padding: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PixelCharacter
                race={race}
                skinColor={skinColor}
                hairStyle={hairStyle}
                hairColor={hairColor}
                cloakColor={cloakColor}
                size={220}
              />
            </div>
            <div style={{ fontFamily: 'serif', fontSize: '18px', color: '#e0bc6a' }}>{name || 'Имя персонажа'}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#a99fff', marginTop: '4px' }}>
              {RACES.find(r => r.id === race)?.label.toUpperCase()} · УР. 1
            </div>
          </div>
        </div>

        {/* РЕДАКТОР */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Имя */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Имя персонажа</div>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Введи имя..." maxLength={20}
              style={{ width: '100%', background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '18px', color: '#e6e2f0', fontFamily: 'serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Раса */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Раса</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {RACES.map(r => (
                <div key={r.id} onClick={() => setRace(r.id)}
                  style={{ flex: 1, background: race === r.id ? 'rgba(201,168,76,0.1)' : '#1c1f2a', border: `1px solid ${race === r.id ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', padding: '10px 6px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  {race === r.id && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#c9a84c' }}></div>}
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{r.icon}</div>
                  <div style={{ fontFamily: 'serif', fontSize: '12px', color: '#e6e2f0', marginBottom: '2px' }}>{r.label}</div>
                  <div style={{ fontSize: '10px', color: '#5a5670', fontStyle: 'italic' }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Причёска */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Причёска</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {HAIR_STYLES.map(s => (
                <div key={s} onClick={() => setHairStyle(s)}
                  style={{ flex: 1, padding: '8px', background: hairStyle === s ? 'rgba(201,168,76,0.1)' : '#1c1f2a', border: `1px solid ${hairStyle === s ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: hairStyle === s ? '#e0bc6a' : '#5a5670' }}>{s.toUpperCase()}</div>
                  <div style={{ fontSize: '10px', color: '#5a5670', marginTop: '2px' }}>{HAIR_LABELS[s]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Цвет волос */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Цвет волос</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {HAIR_COLORS.map(c => (
                <div key={c} onClick={() => setHairColor(c)}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', background: c, border: `2px solid ${hairColor === c ? '#e0bc6a' : 'transparent'}`, cursor: 'pointer', boxShadow: hairColor === c ? '0 0 0 2px #0b0c10' : 'none', transition: 'all 0.15s' }}/>
              ))}
            </div>
          </div>

          {/* Цвет кожи */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Цвет кожи</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {SKIN_COLORS.map(c => (
                <div key={c} onClick={() => setSkinColor(c)}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', background: c, border: `2px solid ${skinColor === c ? '#e0bc6a' : 'transparent'}`, cursor: 'pointer', boxShadow: skinColor === c ? '0 0 0 2px #0b0c10' : 'none', transition: 'all 0.15s' }}/>
              ))}
            </div>
          </div>

          {/* Цвет мантии */}
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Цвет мантии</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CLOAK_COLORS.map(c => (
                <div key={c} onClick={() => setCloakColor(c)}
                  style={{ width: '30px', height: '30px', borderRadius: '8px', background: c, border: `2px solid ${cloakColor === c ? '#e0bc6a' : 'transparent'}`, cursor: 'pointer', boxShadow: cloakColor === c ? '0 0 0 2px #0b0c10' : 'none', transition: 'all 0.15s' }}/>
              ))}
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e05555' }}>{error}</div>
          )}

          {/* Кнопка */}
          <div onClick={handleCreate}
            style={{ padding: '16px', background: saving ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '18px', color: saving ? '#5a5670' : '#e0bc6a', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Создаём персонажа...' : 'Начать путь →'}
          </div>

        </div>
      </div>
    </div>
  )
}
