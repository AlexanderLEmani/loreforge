'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

function getLectures(level: number) {
  const titles = ['Введение в арифметику', 'Умножение и деление', 'Дроби', 'Проценты']
  return titles.map((title, i) => ({
    num: ['I', 'II', 'III', 'IV'][i],
    title,
    active: i + 1 === level,
    done: i + 1 < level,
  }))
}

const LEVEL_SPELLS: Record<number, [string, string, string][]> = {
  1: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a']],
  2: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a'], ['✕', 'Умножение', '#a99fff'], ['÷', 'Деление', '#a99fff']],
  3: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a'], ['✕', 'Умножение', '#a99fff'], ['÷', 'Деление', '#a99fff'], ['½', 'Дроби', '#e0bc6a']],
  4: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a'], ['✕', 'Умножение', '#a99fff'], ['÷', 'Деление', '#a99fff'], ['½', 'Дроби', '#e0bc6a'], ['%', 'Проценты', '#e0bc6a']],
}

const NEXT_TOPIC: Record<number, string> = {
  1: 'Пройди данжи уровня 1 чтобы открыть Лекцию II и получить заклинания умножения.',
  2: 'Пройди данжи уровня 2 чтобы открыть Лекцию III и получить заклинания дробей.',
  3: 'Пройди данжи уровня 3 чтобы открыть Лекцию IV и получить заклинания процентов.',
  4: 'Это последняя доступная лекция. Скоро здесь появится больше.',
}

export default function CollegePage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [lecture, setLecture] = useState<any>(null)
  const [showNext, setShowNext] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('users').select('xp, level, gold, glory, streak, onboarding_step, visited_college').eq('id', user.id).single()
      setUserData(data)

      const level = data?.level || 1
      const { data: lec } = await supabase.from('lectures').select('title, sections').eq('level', level).single()
      setLecture(lec)

      if (data && !data.visited_college) {
        setShowWelcome(true)
      }
      if (data && (data.onboarding_step || 0) < 1) {
        await supabase.from('users').update({ onboarding_step: 1 }).eq('id', user.id)
        setUserData((prev: any) => ({ ...prev, onboarding_step: 1 }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const level = userData?.level || 1
  const xpThresholds = [0, 100, 250, 500, 900, 1400]
  const xpToNext = [100, 150, 250, 400, 500, 600]
  const xpBase = xpThresholds[level - 1] || 0
  const xpNext = xpToNext[level - 1] || 100
  const xpCurrent = Math.max(0, (userData?.xp || 0) - xpBase)

  if (loading) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Загрузка...
    </div>
  )

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
          Коллегия магов · Математика · Ур. {level}
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr' }}>

        <Sidebar active="Коллегия" level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} />

        {/* ОСНОВНАЯ ОБЛАСТЬ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', minHeight: 'calc(100vh - 56px)' }}>

          {/* ТЕКСТ ЛЕКЦИИ */}
          <div style={{ padding: '2rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

            <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Лекция {['I','II','III','IV'][level-1] || 'I'}</div>
              <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '6px' }}>{lecture?.title || 'Загрузка...'}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff' }}>Профессор Горус · Архимаг Арифметики</div>
            </div>

            {(lecture?.sections || []).map((s: any, i: number) => {
              if (s.type === 'professor') return (
                <div key={i} style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '40px', flexShrink: 0, lineHeight: 1 }}>🧙‍♂️</div>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', letterSpacing: '0.1em', marginBottom: '6px' }}>ПРОФЕССОР ГОРУС</div>
                    <div style={{ fontSize: '15px', color: '#c8c0d8', lineHeight: 1.7, fontStyle: 'italic' }}>"{s.text}"</div>
                  </div>
                </div>
              )
              if (s.type === 'heading') return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2rem 0 1rem' }}>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(201,168,76,0.2)' }}></div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s.text}</div>
                  <div style={{ height: '1px', flex: 1, background: 'rgba(201,168,76,0.2)' }}></div>
                </div>
              )
              if (s.type === 'text') return (
                <p key={i} style={{ fontSize: '15px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1rem' }}>{s.text}</p>
              )
              if (s.type === 'quote') return (
                <div key={i} style={{ borderLeft: '3px solid rgba(201,168,76,0.4)', padding: '1rem 1.25rem', margin: '1.5rem 0', background: 'rgba(201,168,76,0.04)', borderRadius: '0 8px 8px 0' }}>
                  <p style={{ fontSize: '14px', color: '#e0bc6a', fontStyle: 'italic', lineHeight: 1.7 }}>{s.text}</p>
                </div>
              )
              if (s.type === 'formula') return (
                <div key={i} style={{ background: '#171920', border: '1px solid rgba(123,108,255,0.25)', borderRadius: '10px', padding: '1rem 1.25rem', margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '24px', color: '#a99fff', whiteSpace: 'nowrap' }}>{s.text}</div>
                  <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.5 }}>{s.hint}</div>
                </div>
              )
              if (s.type === 'outro') return (
                <div key={i} style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '12px', padding: '1.25rem', margin: '2rem 0 0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>🧙‍♂️</div>
                  <p style={{ fontSize: '15px', color: '#c8b0b0', lineHeight: 1.7, fontStyle: 'italic' }}>"{s.text}"</p>
                </div>
              )
              return null
            })}

            {!userData?.visited_college && (
              <div style={{ marginTop: '2.5rem' }}>
                <div onClick={async () => {
                  setShowNext(true)
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) await supabase.from('users').update({ visited_college: true }).eq('id', user.id)
                  setUserData((prev: any) => ({ ...prev, visited_college: true }))
                }}
                  style={{ width: '100%', padding: '16px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '18px', color: '#e0bc6a', cursor: 'pointer' }}>
                  Ознакомился →
                </div>
              </div>
            )}

          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Лекции</div>
            {getLectures(level).map(l => (
              <div key={l.num} style={{ background: l.active ? 'rgba(123,108,255,0.1)' : '#1c1f2a', border: `1px solid ${l.active ? 'rgba(123,108,255,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '9px', padding: '10px 12px', opacity: l.active || l.done ? 1 : 0.4, cursor: l.active || l.done ? 'pointer' : 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: l.active ? '#a99fff' : '#5a5670', width: '16px', flexShrink: 0 }}>{l.num}</div>
                  <div style={{ fontSize: '12px', color: l.active ? '#e6e2f0' : '#5a5670', flex: 1, lineHeight: 1.3 }}>{l.title}</div>
                  {l.done && <span style={{ color: '#3db87a', fontSize: '11px' }}>✓</span>}
                  {l.active && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', flexShrink: 0 }}>сейчас</span>}
                  {!l.active && !l.done && <span style={{ fontSize: '11px', color: '#3a3650' }}>🔒</span>}
                </div>
              </div>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}></div>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Заклинания</div>
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '9px', padding: '10px 12px' }}>
              {(LEVEL_SPELLS[level] || LEVEL_SPELLS[1]).map(([icon, name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#9590a8' }}>
                  <span>{icon}</span>
                  <span style={{ flex: 1 }}>{name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: color }}>✓</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}></div>

            <div style={{ background: 'rgba(123,108,255,0.06)', border: '1px solid rgba(123,108,255,0.2)', borderRadius: '9px', padding: '10px 12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Прогресс к экзамену</div>
              <div style={{ height: '4px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '5px' }}>
                <div style={{ height: '100%', background: xpCurrent >= xpNext ? '#e0bc6a' : '#7b6cff', width: `${Math.min((xpCurrent / xpNext) * 100, 100)}%`, transition: 'width 0.4s' }}></div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginBottom: '8px' }}>{xpCurrent} / {xpNext} XP</div>
              {xpCurrent >= xpNext ? (
                <div onClick={() => router.push(`/exam?level=${level}`)}
                  style={{ padding: '8px', background: 'rgba(224,188,106,0.12)', border: '1px solid rgba(224,188,106,0.4)', borderRadius: '7px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', cursor: 'pointer' }}>
                  🎓 Сдать экзамен
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#5a5670', lineHeight: 1.5 }}>
                  {NEXT_TOPIC[level] || 'Пройди данжи чтобы набрать XP и открыть экзамен.'}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ОНБОРДИНГ КОЛЛЕГИИ */}
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '460px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>🏛️</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '6px' }}>Коллегия Магов</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>ПРОФЕССОР ГОРУС</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Здесь ты получаешь <span style={{ color: '#e0bc6a' }}>теоретическую базу</span> — без неё в данжах делать нечего.
              <br/><br/>
              <span style={{ color: '#e6e2f0' }}>📖 Лекции</span> — читай теорию перед каждым новым уровнем.
              <br/>
              <span style={{ color: '#e6e2f0' }}>🎓 Экзамен</span> — сдай когда наберёшь достаточно опыта. Только так открывается следующий уровень.
              <br/>
              <span style={{ color: '#e6e2f0' }}>⚡ Заклинания</span> — каждый уровень даёт новые атаки для боя.
              <br/><br/>
              Прочитай лекцию и нажми <span style={{ color: '#e0bc6a' }}>"Ознакомился"</span>.
            </div>
            <div onClick={() => setShowWelcome(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#e0bc6a', cursor: 'pointer' }}>
              Понял, читаю →
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА КУДА ДАЛЬШЕ */}
      {showNext && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🧙‍♂️</div>
              <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#e0bc6a', marginBottom: '6px' }}>Первый шаг сделан</div>
              <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.6 }}>
                Теория без практики — пустой звук. Куда идёшь дальше?
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
              <div onClick={() => router.push('/training')}
                style={{ background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.3)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>🏋️</div>
                <div>
                  <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '3px' }}>Тренировочный зал</div>
                  <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>Попрактикуйся без риска. Рекомендуется новичкам.</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#3db87a', marginLeft: 'auto' }}>→</div>
              </div>

              <div onClick={() => (userData?.onboarding_step || 0) >= 2 && router.push('/guild')}
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: (userData?.onboarding_step || 0) >= 2 ? 'pointer' : 'default', opacity: (userData?.onboarding_step || 0) >= 2 ? 1 : 0.4 }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>⚔️</div>
                <div>
                  <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '3px' }}>Гильдия авантюристов</div>
                  <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>
                    {(userData?.onboarding_step || 0) >= 2 ? 'Иди в бой.' : 'Сначала потренируйся.'}
                  </div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', marginLeft: 'auto' }}>→</div>
              </div>
            </div>

            <div onClick={() => { setShowNext(false); router.push('/hub') }}
              style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', cursor: 'pointer', padding: '8px' }}>
              ← Вернуться в хаб
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
