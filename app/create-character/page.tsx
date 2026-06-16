'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ensureGuestUserRow } from '@/lib/quick-start-auth'
import PixelCharacter from '@/components/PixelCharacter'
import { layout } from '@/lib/layout-classes'
import { RACE_OPTIONS } from '@/lib/race-bonuses'
import { track } from '@/lib/analytics'

const HAIR_STYLES = ['a1', 'a2', 'a3', 'a4', 'a5'] as const
const HAIR_LABELS: Record<string, string> = {
  a1: 'Короткие', a2: 'Длинные', a3: 'Хвост', a4: 'Бритый', a5: 'Дикие',
}

const SKIN_COLORS = ['#f5d5a8', '#e8b88a', '#c8a882', '#a0785a', '#7a5240', '#4a3020']
const HAIR_COLORS = ['#f5e6c0', '#e0bc6a', '#c8860a', '#8B4513', '#3d2b1f', '#1a1a2e', '#e05555', '#7b6cff', '#2dd9b8']
const CLOAK_COLORS = ['#4a1f6e', '#1f3a6e', '#1f6e3a', '#6e1f1f', '#3a3a3a', '#1a1a2e', '#6e4a1f', '#2a1f4e']

const RACE_LOCKED_SKIN: Record<string, string> = {
  orc: '#5a8a3a',
  undead: '#8aaa7a',
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function ColorSwatch({
  color,
  active,
  round,
  onClick,
}: {
  color: string
  active: boolean
  round?: boolean
  onClick: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        width: 30,
        height: 30,
        borderRadius: round ? '50%' : 8,
        background: color,
        border: `2px solid ${active ? '#e0bc6a' : 'transparent'}`,
        boxShadow: active ? '0 0 0 2px #0b0c10' : 'none',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.15s',
      }}
    />
  )
}

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

  const skinLocked = race === 'orc' || race === 'undead'
  const previewSkin = RACE_LOCKED_SKIN[race] ?? skinColor
  const selectedRace = RACE_OPTIONS.find(r => r.id === race)

  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: ch } = await supabase.from('characters').select('user_id').eq('user_id', user.id).maybeSingle()
      if (ch) router.push('/character')
    }
    checkExisting()
  }, [])

  function randomizeAppearance() {
    setHairStyle(pickRandom(HAIR_STYLES))
    setHairColor(pickRandom(HAIR_COLORS))
    setCloakColor(pickRandom(CLOAK_COLORS))
    if (!skinLocked) setSkinColor(pickRandom(SKIN_COLORS))
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Дай имя персонажу'); return }
    if (name.trim().length < 2) { setError('Имя слишком короткое'); return }
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    await ensureGuestUserRow(supabase, user)

    const { error: err } = await supabase.from('characters').insert({
      user_id: user.id,
      name: name.trim(),
      race,
      skin_color: previewSkin,
      hair_style: hairStyle,
      hair_color: hairColor,
      cloak_color: cloakColor,
    })

    if (err) { setError('Ошибка сохранения. Попробуй ещё раз.'); setSaving(false); return }
    track('character_created', { race })
    router.push('/hub')
  }

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: '0.2em',
    color: '#5a5670',
    textTransform: 'uppercase',
    marginBottom: 8,
  }

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.3em', color: '#5a5670', textTransform: 'uppercase', marginBottom: 6 }}>
          LoreHeim · Начало пути
        </div>
        <div style={{ fontFamily: 'serif', fontSize: 28, color: '#e0bc6a' }}>Создай персонажа</div>
        <div style={{ fontSize: 13, color: '#5a5670', fontStyle: 'italic', marginTop: 4 }}>
          Имя и раса — навсегда. Внешность можно менять позже.
        </div>
      </div>

      <div className={layout.createChar}>

        {/* Превью */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: '#1c1f2a',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 16,
            padding: '1.5rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Предпросмотр
            </div>
            <div className="lf-char-portrait-frame" style={{ marginBottom: '1rem', width: '100%', minHeight: 300 }}>
              <PixelCharacter
                race={race}
                skinColor={previewSkin}
                hairStyle={hairStyle}
                hairColor={hairColor}
                cloakColor={cloakColor}
                size={220}
              />
            </div>
            <div style={{ fontFamily: 'serif', fontSize: 18, color: '#e0bc6a' }}>{name || 'Имя персонажа'}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#a99fff', marginTop: 4 }}>
              {selectedRace?.label.toUpperCase()} · УР. 1
            </div>
            {selectedRace && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#2dd9b8', fontStyle: 'italic' }}>
                {selectedRace.desc}
              </div>
            )}
            <div
              role="button"
              tabIndex={0}
              onClick={randomizeAppearance}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') randomizeAppearance() }}
              style={{
                marginTop: 14,
                padding: '8px 14px',
                background: 'rgba(123,108,255,0.1)',
                border: '1px solid rgba(123,108,255,0.35)',
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#a99fff',
                cursor: 'pointer',
              }}
            >
              🎲 Случайный вид
            </div>
          </div>
        </div>

        {/* Редактор */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

          <div>
            <div style={sectionTitle}>Имя персонажа</div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Введи имя..."
              maxLength={20}
              style={{
                width: '100%',
                background: '#1c1f2a',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 18,
                color: '#e6e2f0',
                fontFamily: 'serif',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={sectionTitle}>Раса</div>
            <div className="lf-race-picker">
              {RACE_OPTIONS.map(r => (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setRace(r.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setRace(r.id) }}
                  style={{
                    background: race === r.id ? 'rgba(201,168,76,0.1)' : '#1c1f2a',
                    border: `1px solid ${race === r.id ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10,
                    padding: '10px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: 0,
                  }}
                >
                  {race === r.id && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#c9a84c' }} />
                  )}
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
                  <div style={{ fontFamily: 'serif', fontSize: 12, color: '#e6e2f0', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: '#5a5670', fontStyle: 'italic', lineHeight: 1.3 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={sectionTitle}>Причёска</div>
            <div className="lf-hair-picker">
              {HAIR_STYLES.map(s => (
                <div
                  key={s}
                  role="button"
                  tabIndex={0}
                  onClick={() => setHairStyle(s)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setHairStyle(s) }}
                  style={{
                    padding: '8px 6px',
                    background: hairStyle === s ? 'rgba(201,168,76,0.1)' : '#1c1f2a',
                    border: `1px solid ${hairStyle === s ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8,
                    textAlign: 'center',
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: hairStyle === s ? '#e0bc6a' : '#5a5670' }}>
                    {s.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: '#5a5670', marginTop: 2 }}>{HAIR_LABELS[s]}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={sectionTitle}>Цвет волос</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {HAIR_COLORS.map(c => (
                <ColorSwatch key={c} color={c} active={hairColor === c} round onClick={() => setHairColor(c)} />
              ))}
            </div>
          </div>

          <div>
            <div style={sectionTitle}>
              Цвет кожи
              {skinLocked && (
                <span style={{ textTransform: 'none', letterSpacing: 0, fontStyle: 'italic', color: '#7a7588' }}>
                  {' '}· фиксирован для {selectedRace?.label.toLowerCase()}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {skinLocked ? (
                <ColorSwatch color={previewSkin} active round onClick={() => {}} />
              ) : (
                SKIN_COLORS.map(c => (
                  <ColorSwatch key={c} color={c} active={skinColor === c} round onClick={() => setSkinColor(c)} />
                ))
              )}
            </div>
          </div>

          <div>
            <div style={sectionTitle}>Цвет мантии</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CLOAK_COLORS.map(c => (
                <ColorSwatch key={c} color={c} active={cloakColor === c} onClick={() => setCloakColor(c)} />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e05555' }}>
              {error}
            </div>
          )}

          <div
            role="button"
            tabIndex={saving ? -1 : 0}
            onClick={saving ? undefined : handleCreate}
            onKeyDown={e => { if (!saving && (e.key === 'Enter' || e.key === ' ')) handleCreate() }}
            style={{
              padding: 16,
              background: saving ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.4)',
              borderRadius: 10,
              textAlign: 'center',
              fontFamily: 'serif',
              fontSize: 18,
              color: saving ? '#5a5670' : '#e0bc6a',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Создаём персонажа...' : 'Начать путь →'}
          </div>

        </div>
      </div>
    </div>
  )
}
