'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PixelCharacter from '@/components/PixelCharacter'

const RACE_ICONS: Record<string, string> = {
  human: '🧙', elf: '🧝', dwarf: '⛏️', orc: '👹', undead: '💀'
}

const RACE_LABELS: Record<string, string> = {
  human: 'Странствующий маг', elf: 'Архивист', dwarf: 'Рунный кузнец', orc: 'Боевой учёный', undead: 'Некромант знаний'
}

const EQUIP_SLOTS = [
  { id: 'head',    icon: '🎩', label: 'Голова' },
  { id: 'body',    icon: '👕', label: 'Тело' },
  { id: 'weapon',  icon: '🪄', label: 'Оружие' },
  { id: 'belt',    icon: '💎', label: 'Пояс' },
  { id: 'hands',   icon: '🧤', label: 'Руки' },
  { id: 'feet',    icon: '👢', label: 'Ноги' },
  { id: 'ring',    icon: '💍', label: 'Кольцо' },
  { id: 'pet',     icon: '🐾', label: 'Питомец' },
]

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400]
const XP_TO_NEXT =    [100, 150, 250, 400, 500, 600, 700, 800, 900, 1000, 1100]

export default function CharacterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [character, setCharacter] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const { data: ud } = await supabase
        .from('users')
        .select('xp, level, gold, streak, total_answers')
        .eq('id', user.id)
        .single()
      setUserData(ud)

      const { data: ch } = await supabase
        .from('characters')
        .select('name, race, skin_color, hair_style, hair_color, cloak_color')
        .eq('user_id', user.id)
        .single()
      if (!ch) { router.push('/create-character'); return }
      setCharacter(ch)
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
  const xp = userData?.xp || 0
  const xpBase = XP_THRESHOLDS[level - 1] || 0
  const xpNext = XP_TO_NEXT[level - 1] || 100
  const xpCurrent = Math.max(0, xp - xpBase)
  const xpPct = Math.min((xpCurrent / xpNext) * 100, 100)

  // Характеристики на основе уровня и расы
  const race = character?.race || 'human'
  const stats = {
    attack:  10 + level * 4 + (race === 'orc' ? 8 : 0),
    defense: 5  + level * 2 + (race === 'dwarf' ? 5 : 0),
    speed:   8  + level * 3 + (race === 'elf' ? 4 : 0),
    intel:   10 + level * 6 + (race === 'elf' ? 10 : 0) + (race === 'human' ? 4 : 0),
  }

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      {/* НАВБАР */}
      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e0bc6a', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', border: '1.5px solid #c9a84c', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
          <div style={{ width: '28px', height: '28px', border: '1px solid #c9a84c', borderRadius: '50%', background: '#1c1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
            {RACE_ICONS[race]}
          </div>
          {character?.name} · Ур.{level}
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', minHeight: 'calc(100vh - 56px)' }}>

        {/* ЛЕВЫЙ САЙДБАР */}
        <div style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Персонаж</div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', marginBottom: '4px' }}>
              <span>УРОВЕНЬ {level}</span><span>{xpCurrent} / {xpNext}</span>
            </div>
            <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#7b6cff', borderRadius: '2px', width: `${xpPct}%` }}></div>
            </div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Характеристики</div>

          {[
            ['⚔️', 'Сила атаки', stats.attack, '#e6e2f0'],
            ['🛡️', 'Защита',    stats.defense, '#e6e2f0'],
            ['⚡', 'Скорость',  stats.speed,   '#a99fff'],
            ['🧠', 'Интеллект', stats.intel,   '#2dd9b8'],
            ['💰', 'Золото',    userData?.gold || 0, '#e0bc6a'],
          ].map(([icon, name, val, color]) => (
            <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon as string}</span>{name as string}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: color as string }}>{val as number}</div>
            </div>
          ))}

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>Навигация</div>

          {[
            ['🏰', 'Хаб', '/hub', false],
            ['👤', 'Персонаж', '/character', true],
            ['⚔️', 'В данж', '/hub', false],
            ['📖', 'Гримуар', '/hub', false],
            ['🛒', 'Лавка', '/hub', false],
          ].map(([icon, label, href, active]) => (
            <div key={label as string} onClick={() => router.push(href as string)}
              style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '7px', fontSize: '14px', color: active ? '#a99fff' : '#5a5670', background: active ? 'rgba(123,108,255,0.13)' : 'transparent', borderLeft: `2px solid ${active ? '#7b6cff' : 'transparent'}`, cursor: 'pointer', marginBottom: '3px' }}>
              <span style={{ width: '18px', textAlign: 'center' }}>{icon as string}</span>{label as string}
            </div>
          ))}
        </div>

        {/* ЦЕНТР */}
        <div style={{ padding: '2rem', background: '#0b0c10', overflowY: 'auto' }}>
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Снаряжение и внешность</div>
            <div style={{ fontFamily: 'monospace', fontSize: '26px', color: '#e0bc6a' }}>Твой персонаж</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Карточка персонажа */}
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e0bc6a', marginBottom: '4px' }}>{character?.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#a99fff', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>
                {RACE_LABELS[race]?.toUpperCase()} · УР. {level}
              </div>

             {/* Аватар */}
              <div style={{ background: '#0d0f14', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.15)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PixelCharacter
                  race={race}
                  skinColor={character?.skin_color || '#c8a882'}
                  hairStyle={character?.hair_style || 'a1'}
                  hairColor={character?.hair_color || '#3d2b1f'}
                  cloakColor={character?.cloak_color || '#4a1f6e'}
                  size={200}
                />
              </div>
 
              {/* Слоты снаряжения */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', width: '100%' }}>
                {EQUIP_SLOTS.map(slot => (
                  <div key={slot.id} style={{ aspectRatio: '1', background: '#171920', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', opacity: 0.4 }}>
                    <span style={{ fontSize: '18px' }}>{slot.icon}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670' }}>{slot.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Статистика */}
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#e0bc6a', marginBottom: '1rem', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                Статистика
              </div>

              {[
                ['📚', 'Ответов дано', userData?.total_answers || 0],
                ['🔥', 'Дней подряд', userData?.streak || 0],
                ['⚗️', 'Данжей пройдено', '—'],
                ['📖', 'Тем изучено', '—'],
                ['⏱️', 'Часов в игре', '—'],
              ].map(([icon, label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9590a8' }}>
                    <span>{icon as string}</span>{label as string}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e0bc6a' }}>{val as any}</div>
                </div>
              ))}

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>Раса</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#171920', borderRadius: '8px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '28px' }}>{RACE_ICONS[race]}</span>
                  <div>
                    <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0' }}>{['human','elf','dwarf','orc','undead'].includes(race) ? ['Человек','Эльф','Дварф','Орк','Нежить'][['human','elf','dwarf','orc','undead'].indexOf(race)] : race}</div>
                    <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginTop: '2px' }}>
                      {race === 'human' && '+10% к XP за все предметы'}
                      {race === 'elf'   && '+20% к XP за магию и теорию'}
                      {race === 'dwarf' && 'Таймер защиты +5 секунд'}
                      {race === 'orc'   && 'Кулак наносит +5 урона'}
                      {race === 'undead' && 'Тёмная магия кулдаун -1 ход'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>Ветки знаний</div>
                <div style={{ background: '#171920', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#9590a8' }}>
                    <span>∑</span> Математика
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c9a84c' }}>Ур. {level}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ПРАВЫЙ САЙДБАР — Инвентарь */}
        <div style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Инвентарь</div>

          {/* Сетка инвентаря */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '1rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '1', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#5a5670', opacity: 0.3 }}>
                ·
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Предметы</div>

          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.5 }}>
              Предметы открываются за прокачку веток знаний. Изучи математику — получи снаряжение мага. Изучи физику — получи инженерный пояс.
            </div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Расходники</div>

          {[
            ['🧪', 'Зелья HP', '0'],
            ['📜', 'Свитки', '0'],
            ['⚡', 'Двойная атака', '0'],
          ].map(([icon, name, count]) => (
            <div key={name as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', marginBottom: '5px', opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9590a8' }}>
                <span>{icon as string}</span>{name as string}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#5a5670' }}>{count as string}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
