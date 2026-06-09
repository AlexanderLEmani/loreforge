'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const RACES = [
  { id: 'human',   icon: '🧙', label: 'Человек',   desc: 'Универсальный. +10% к XP за все предметы.' },
  { id: 'elf',     icon: '🧝', label: 'Эльф',      desc: 'Мудрый. +20% к XP за магию и теорию.' },
  { id: 'dwarf',   icon: '⛏️', label: 'Дварф',     desc: 'Упорный. Таймер защиты +5 секунд.' },
  { id: 'orc',     icon: '👹', label: 'Орк',        desc: 'Сильный. Кулак наносит +5 урона.' },
  { id: 'undead',  icon: '💀', label: 'Нежить',    desc: 'Тёмный. Тёмная магия кулдаун -1 ход.' },
]

export default function CreateCharacter() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [race, setRace] = useState('human')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Дай имя персонажу'); return }
    if (name.trim().length < 2) { setError('Имя слишком короткое'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { error: err } = await supabase.from('characters').insert({
      user_id: user.id,
      name: name.trim(),
      race,
    })

    if (err) {
      setError('Ошибка сохранения. Попробуй ещё раз.')
      setSaving(false)
      return
    }

    router.push('/hub')
  }

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '580px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.3em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>LoreForge · Начало пути</div>
          <div style={{ fontFamily: 'serif', fontSize: '36px', color: '#e0bc6a', marginBottom: '8px' }}>Создай персонажа</div>
          <div style={{ fontSize: '14px', color: '#5a5670', fontStyle: 'italic' }}>Имя и раса — навсегда. Выбирай осознанно.</div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>Имя персонажа</div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Введи имя..." maxLength={20}
            style={{ width: '100%', background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '14px 16px', fontSize: '20px', color: '#e6e2f0', fontFamily: 'serif', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>Раса</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {RACES.slice(0, 3).map(r => (
              <div key={r.id} onClick={() => setRace(r.id)} style={{ background: race === r.id ? 'rgba(201,168,76,0.1)' : '#1c1f2a', border: `1px solid ${race === r.id ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
                {race === r.id && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#c9a84c' }}></div>}
                <div style={{ fontSize: '30px', marginBottom: '6px' }}>{r.icon}</div>
                <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0', marginBottom: '4px' }}>{r.label}</div>
                <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.3 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {RACES.slice(3).map(r => (
              <div key={r.id} onClick={() => setRace(r.id)} style={{ background: race === r.id ? 'rgba(201,168,76,0.1)' : '#1c1f2a', border: `1px solid ${race === r.id ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
                {race === r.id && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#c9a84c' }}></div>}
                <div style={{ fontSize: '30px', marginBottom: '6px' }}>{r.icon}</div>
                <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0', marginBottom: '4px' }}>{r.label}</div>
                <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.3 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#e05555', marginBottom: '1rem' }}>{error}</div>
        )}

        <div onClick={handleCreate} style={{ width: '100%', padding: '16px', background: saving ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '18px', color: saving ? '#5a5670' : '#e0bc6a', cursor: saving ? 'default' : 'pointer', boxSizing: 'border-box' }}>
          {saving ? 'Создаём персонажа...' : 'Начать путь →'}
        </div>

      </div>
    </div>
  )
}
