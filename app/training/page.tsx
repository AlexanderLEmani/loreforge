'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const TOPICS = [
  { id: 'add', icon: '➕', name: 'Сложение',   level: 1, dungeon: 'Пещера сложения' },
  { id: 'sub', icon: '➖', name: 'Вычитание',  level: 1, dungeon: 'Пещера вычитания' },
  { id: 'mul', icon: '✕',  name: 'Умножение',  level: 2, dungeon: 'Башня умножения' },
  { id: 'div', icon: '÷',  name: 'Деление',    level: 2, dungeon: 'Пещера деления' },
  { id: 'frac',icon: '½',  name: 'Дроби',      level: 3, dungeon: null },
  { id: 'pct', icon: '%',  name: 'Проценты',   level: 4, dungeon: null },
]

const MODES = [
  { id: 'guided', icon: '📖', name: 'С подсказками',  desc: 'После каждой ошибки — объяснение. Для изучения новой темы.', color: '#3db87a', xpMod: '-50% XP' },
  { id: 'clean',  icon: '⚡', name: 'Без подсказок',  desc: 'Как настоящий бой, но без потери HP и ресурсов.', color: '#a99fff', xpMod: '-25% XP' },
  { id: 'speed',  icon: '⏱️', name: 'Спидран',        desc: 'Максимум задач за 3 минуты. Только скорость.', color: '#e0bc6a', xpMod: 'Нет XP' },
]

export default function TrainingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState('guided')
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['add'])
  const [questions, setQuestions] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<'setup' | 'battle'>('setup')
  const [selected, setSelected] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [timer, setTimer] = useState(180)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('users').select('xp, level, gold, streak').eq('id', user.id).single()
      setUserData({ ...data, id: user.id })
      setLoading(false)
    }
    load()
  }, [])

  // Таймер спидрана
  useEffect(() => {
    if (!timerActive) return
    if (timer <= 0) { setPhase('setup'); setTimerActive(false); return }
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, timerActive])

  async function startTraining() {
    if (selectedTopics.length === 0) return
    const dungeons = selectedTopics.map(id => TOPICS.find(t => t.id === id)?.dungeon).filter(Boolean) as string[]
    let allQ: any[] = []
    for (const d of [...new Set(dungeons)]) {
      const { data } = await supabase.from('questions').select('*').eq('dungeon_name', d).limit(20)
      if (data) allQ = [...allQ, ...data]
    }
    const shuffled = allQ.sort(() => Math.random() - 0.5).slice(0, 20)
    setQuestions(shuffled)
    setCurrent(0)
    setCorrect(0)
    setTotal(0)
    setSelected(null)
    setShowHint(false)
    setPhase('battle')
    if (selectedMode === 'speed') { setTimer(180); setTimerActive(true) }
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const q = questions[current]
    const isCorrect = idx === q.correct_index
    setTotal(t => t + 1)
    if (isCorrect) setCorrect(c => c + 1)
    if (!isCorrect && selectedMode === 'guided') setShowHint(true)

    if (isCorrect || selectedMode !== 'guided') {
      setTimeout(() => {
        setSelected(null)
        setShowHint(false)
        if (current + 1 >= questions.length) {
          const reshuffled = questions.sort(() => Math.random() - 0.5)
          setQuestions(reshuffled)
          setCurrent(0)
        } else {
          setCurrent(c => c + 1)
        }
      }, isCorrect ? 600 : 1200)
    }
  }

  function dismissHint() {
    setSelected(null)
    setShowHint(false)
    if (current + 1 >= questions.length) {
      setQuestions(q => [...q].sort(() => Math.random() - 0.5))
      setCurrent(0)
    } else {
      setCurrent(c => c + 1)
    }
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
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
          Тренировочный лагерь · Без потерь
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px' }}>

        <Sidebar active="Тренировка" level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} />

        {/* ЦЕНТР */}
        <div style={{ padding: '1.75rem 2rem', background: '#0b0c10' }}>

          {phase === 'setup' && <>
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Тренировочный лагерь</div>
              <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '4px' }}>Зал тренировок</div>
              <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>Здесь ошибки не убивают. Только учат.</div>
            </div>

            {/* ТРЕНЕР */}
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '44px', flexShrink: 0, lineHeight: 1 }}>🪖</div>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3db87a', letterSpacing: '0.1em', marginBottom: '6px' }}>СЕРЖАНТ ВАРГ · МАСТЕР ТРЕНИРОВОК</div>
                <div style={{ fontSize: '14px', color: '#c8c0d8', fontStyle: 'italic', lineHeight: 1.6 }}>
                  "Данжи — не место для учёбы. Там учёба заканчивается и начинается выживание. Здесь ты можешь ошибаться сколько угодно. Никто не смотрит. Выбирай режим."
                </div>
              </div>
            </div>

            {/* РЕЖИМЫ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>
              <span>Режим тренировки</span><div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
              {MODES.map(m => (
                <div key={m.id} onClick={() => setSelectedMode(m.id)}
                  style={{ background: selectedMode === m.id ? `rgba(${m.color === '#3db87a' ? '61,184,122' : m.color === '#a99fff' ? '123,108,255' : '224,188,106'},0.08)` : '#1c1f2a', border: `1px solid ${selectedMode === m.id ? m.color + '80' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all 0.15s' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: selectedMode === m.id ? m.color : 'transparent' }}></div>
                  <div style={{ fontSize: '26px', marginBottom: '8px' }}>{m.icon}</div>
                  <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0', marginBottom: '4px' }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.4, marginBottom: '8px' }}>{m.desc}</div>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.08)', color: '#5a5670' }}>{m.xpMod}</span>
                </div>
              ))}
            </div>

            {/* ТЕМЫ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>
              <span>Выбери тему</span><div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.5rem' }}>
              {TOPICS.map(t => {
                const locked = t.level > level || !t.dungeon
                const sel = selectedTopics.includes(t.id)
                return (
                  <div key={t.id} onClick={() => {
                    if (locked) return
                    setSelectedTopics(prev => sel ? prev.filter(x => x !== t.id) : [...prev, t.id])
                  }}
                    style={{ background: sel ? 'rgba(61,184,122,0.06)' : '#1c1f2a', border: `1px solid ${sel ? 'rgba(61,184,122,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '9px', padding: '10px 14px', cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.35 : 1, display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '20px', flexShrink: 0 }}>{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#e6e2f0', marginBottom: '2px' }}>{t.name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>Ур.{t.level}{locked && !t.dungeon ? ' · Скоро' : locked ? ' · Требует Ур.' + t.level : ''}</div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#3db87a', opacity: sel ? 1 : 0 }}>✓</div>
                  </div>
                )
              })}
            </div>

            <div onClick={startTraining} style={{ width: '100%', padding: '16px', background: selectedTopics.length > 0 ? 'rgba(61,184,122,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedTopics.length > 0 ? 'rgba(61,184,122,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', textAlign: 'center', fontFamily: 'serif', fontSize: '20px', color: selectedTopics.length > 0 ? '#3db87a' : '#3a3650', cursor: selectedTopics.length > 0 ? 'pointer' : 'default', marginBottom: '8px' }}>
              🏋️ Начать тренировку →
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', fontStyle: 'italic' }}>
              Ошибки не влияют на HP, золото и очки славы
            </div>
          </>}

          {phase === 'battle' && questions.length > 0 && (() => {
            const q = questions[current]
            return (
              <div>
                {/* Шапка боя */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div onClick={() => { setPhase('setup'); setTimerActive(false) }} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', cursor: 'pointer' }}>← Выйти</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                    <span style={{ color: '#3db87a' }}>✓ {correct}</span>
                    <span style={{ color: '#5a5670' }}>/{total}</span>
                    {selectedMode === 'speed' && (
                      <span style={{ color: timer > 60 ? '#3db87a' : timer > 30 ? '#e0bc6a' : '#e05555', fontSize: '14px', fontWeight: 'bold' }}>
                        ⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
                    {accuracy}% точность
                  </div>
                </div>

                {/* Режим-бейдж */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.2)', color: '#3db87a' }}>
                    🏋️ Тренировка
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#5a5670' }}>
                    {MODES.find(m => m.id === selectedMode)?.name}
                  </span>
                </div>

                {/* Вопрос */}
                <div style={{ background: '#1c1f2a', border: '1px solid rgba(61,184,122,0.2)', borderRadius: '14px', padding: '2rem', marginBottom: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, rgba(61,184,122,0.4), transparent)' }}></div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginBottom: '12px', letterSpacing: '0.15em' }}>ТРЕНИРОВКА · {q.dungeon_name?.toUpperCase()}</div>
                  <div style={{ fontFamily: 'serif', fontSize: '48px', color: '#e6e2f0', lineHeight: 1.1 }}>{q.question}</div>
                </div>

                {/* Подсказка */}
                {showHint && (
                  <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '20px', flexShrink: 0 }}>💡</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', marginBottom: '4px' }}>ПРАВИЛЬНЫЙ ОТВЕТ</div>
                      <div style={{ fontSize: '24px', color: '#3db87a', fontFamily: 'serif', marginBottom: '4px' }}>{q.answers[q.correct_index]}</div>
                      <div style={{ fontSize: '12px', color: '#9590a8', fontStyle: 'italic' }}>Запомни и двигайся дальше.</div>
                    </div>
                    <div onClick={dismissHint} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', cursor: 'pointer', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                      Понял →
                    </div>
                  </div>
                )}

                {/* Ответы */}
                {!showHint && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                    {q.answers.map((ans: string, idx: number) => {
                      let bg = '#1c1f2a', border = 'rgba(255,255,255,0.07)', color = '#e6e2f0'
                      if (selected !== null) {
                        if (idx === q.correct_index) { bg = 'rgba(61,184,122,0.08)'; border = 'rgba(61,184,122,0.4)'; color = '#3db87a' }
                        else if (idx === selected) { bg = 'rgba(224,85,85,0.06)'; border = 'rgba(224,85,85,0.35)'; color = '#e05555' }
                      }
                      return (
                        <div key={idx} onClick={() => handleAnswer(idx)}
                          style={{ background: bg, border: `1px solid ${border}`, borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '24px', color, cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.18s' }}>
                          {ans}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', color: '#3db87a', marginTop: '12px', opacity: 0.6 }}>
                  ⚠️ Ошибка не убьёт — только покажет правильный ответ
                </div>
              </div>
            )
          })()}
        </div>

        {/* ПРАВЫЙ САЙДБАР */}
        <div style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>

          <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#c9a84c', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>Совет дня</div>
            <div style={{ fontSize: '13px', color: '#b8b0c8', lineHeight: 1.6, fontStyle: 'italic' }}>
              "Сначала тренировочный зал, потом данж. Мышцы качают в зале, а не на ринге."
            </div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
            Статистика
          </div>

          {phase === 'battle' ? (
            <>
              {[
                ['✅', 'Точность', `${accuracy}%`, accuracy >= 80 ? '#3db87a' : accuracy >= 60 ? '#e0bc6a' : '#e05555'],
                ['📝', 'Задач решено', total, '#e0bc6a'],
                ['✓', 'Правильных', correct, '#3db87a'],
                ['✗', 'Ошибок', total - correct, '#e05555'],
              ].map(([icon, name, val, color]) => (
                <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon as string}</span>{name as string}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: color as string }}>{val as any}</div>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                ['🏋️', 'Сессий сегодня', '2'],
                ['📝', 'Задач решено', '47'],
                ['✅', 'Точность', '84%'],
                ['🔥', 'Лучшая серия', '12'],
              ].map(([icon, name, val]) => (
                <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon as string}</span>{name as string}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a' }}>{val as string}</div>
                </div>
              ))}
            </>
          )}

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>
            Прогресс по темам
          </div>

          {[
            ['➕', 'Сложение',  88, '#3db87a'],
            ['➖', 'Вычитание', 71, '#e0bc6a'],
            ['✕',  'Умножение', 0,  '#a99fff'],
          ].map(([icon, name, pct, color]) => (
            <div key={name as string} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9590a8', marginBottom: '4px' }}>
                <span>{icon as string} {name as string}</span>
                <span style={{ fontFamily: 'monospace', color: pct as number > 0 ? color as string : '#3a3650' }}>{pct as number > 0 ? `${pct}%` : '—'}</span>
              </div>
              <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: color as string, width: `${pct}%`, transition: 'width 0.4s' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
