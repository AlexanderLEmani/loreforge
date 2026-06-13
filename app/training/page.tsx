'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { loadTrainingStats, loadTopicProgress, recordTrainingAttempt, type TrainingStats, type TopicProgressMap } from '@/lib/training-stats'
import { shuffleQuestions } from '@/lib/shuffle-question'
import Sidebar from '@/components/Sidebar'
import { navUnlockFromUser } from '@/lib/nav-unlock'
import { trainingGoldPerCorrect, trainingXpPerCorrect } from '@/lib/economy'
import { mergeWithFallback } from '@/lib/fallback-questions'
import {
  type ScrollRecord,
  loadScrollTrainingQuestions,
  parseScrollExample,
  resolveScrollTrainingTag,
  scrollSupportsTraining,
  SCROLL_TRAINING_PROFILES,
} from '@/lib/scroll-training'
import { answersMatch, sanitizeAnswerInput } from '@/lib/scroll-display'

const TOPICS = [
  { id: 'add', icon: '➕', name: 'Сложение',   level: 1, dungeon: 'Пещера сложения' },
  { id: 'sub', icon: '➖', name: 'Вычитание',  level: 1, dungeon: 'Пещера вычитания' },
  { id: 'mul', icon: '✕',  name: 'Умножение',  level: 2, dungeon: 'Башня умножения' },
  { id: 'div', icon: '÷',  name: 'Деление',    level: 2, dungeon: 'Пещера деления' },
  { id: 'frac',icon: '½',  name: 'Дроби',      level: 3, dungeon: 'Храм дробей' },
  { id: 'pct', icon: '%',  name: 'Проценты',   level: 4, dungeon: 'Рынок процентов' },
]

const TOPIC_COLORS: Record<string, string> = {
  add: '#3db87a',
  sub: '#e0bc6a',
  mul: '#a99fff',
  div: '#7b6cff',
  frac: '#e0bc6a',
  pct: '#e0bc6a',
}

const TRAINING_SESSION_QUESTIONS = 20
const TRAINING_SPEED_SECONDS = 180

const MODES = [
  { id: 'guided', icon: '📖', name: 'С подсказками',  desc: '20 задач — после каждой ошибки подсказка. Потом итог сессии.', color: '#3db87a', xpMod: '+3 XP · +1 💰', sessionLabel: '20 задач' },
  { id: 'clean',  icon: '⚡', name: 'Без подсказок',  desc: '20 задач как в бою, но без HP. Потом итог — не бесконечно.', color: '#a99fff', xpMod: '+5 XP · +2 💰', sessionLabel: '20 задач' },
  { id: 'speed',  icon: '⏱️', name: 'Спидран',        desc: '3 минуты — сколько задач успеешь. На 0:00 — стоп и итог.', color: '#e0bc6a', xpMod: '+1 💰 за ответ', sessionLabel: '3 минуты' },
]

const ANSWER_FORMATS = [
  { id: 'choice', icon: '🔘', name: 'Варианты', desc: 'Выбор из четырёх ответов — удобно для изучения' },
  { id: 'typed', icon: '⌨️', name: 'Сам ввод', desc: 'Печатаешь ответ сам · Enter для подтверждения · без клика в поле' },
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
  const [phase, setPhase] = useState<'setup' | 'battle' | 'done'>('setup')
  const [selected, setSelected] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [timer, setTimer] = useState(TRAINING_SPEED_SECONDS)
  const [timerActive, setTimerActive] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [goldEarned, setGoldEarned] = useState(0)
  const [showXpFloat, setShowXpFloat] = useState(false)
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null)
  const [topicProgress, setTopicProgress] = useState<TopicProgressMap>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [setupSource, setSetupSource] = useState<'topics' | 'scroll'>('topics')
  const [ownedScrolls, setOwnedScrolls] = useState<ScrollRecord[]>([])
  const [selectedScrollId, setSelectedScrollId] = useState<number | null>(null)
  const [activeScroll, setActiveScroll] = useState<ScrollRecord | null>(null)
  const [answerFormat, setAnswerFormat] = useState<'choice' | 'typed'>('choice')
  const [inputAnswer, setInputAnswer] = useState('')
  const answerInputRef = useRef<HTMLInputElement>(null)

  async function refreshStats(userId: string) {
    const [stats, topics] = await Promise.all([
      loadTrainingStats(supabase, userId),
      loadTopicProgress(supabase, userId),
    ])
    setTrainingStats(stats)
    setTopicProgress(topics)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('users').select('xp, level, gold, glory, streak, onboarding_step, visited_college, visited_training, visited_guild, visited_grimoire, visited_shop, visited_skills, quest_first_dungeon').eq('id', user.id).single()
      setUserData({ ...data, id: user.id })
      await refreshStats(user.id)

      const { data: us } = await supabase
        .from('user_scrolls')
        .select('scroll_id, scrolls(*)')
        .eq('user_id', user.id)
      const scrollRows = (us ?? []) as unknown as Array<{ scrolls: ScrollRecord | null }>
      const scrollList = scrollRows
        .map(row => row.scrolls)
        .filter((s): s is ScrollRecord => s != null)
      const trainableScrolls = scrollList.filter(s => scrollSupportsTraining(s))
      setOwnedScrolls(trainableScrolls)

      const scrollParam = new URLSearchParams(window.location.search).get('scroll')
      if (scrollParam) {
        const id = Number(scrollParam)
        if (trainableScrolls.some(s => s.id === id)) {
          setSetupSource('scroll')
          setSelectedScrollId(id)
        }
      }

      if (data && !data.visited_training) {
        setShowWelcome(true)
        await supabase.from('users').update({ visited_training: true }).eq('id', user.id)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function exitTraining() {
    setPhase('setup')
    setTimerActive(false)
    setActiveScroll(null)
    setInputAnswer('')
    setQuestions([])
    setCurrent(0)
    setCorrect(0)
    setTotal(0)
    if (userData?.id) await refreshStats(userData.id)
  }

  function finishSession() {
    setTimerActive(false)
    setPhase('done')
  }

  // Автофокус в поле ввода — не нужно кликать мышкой
  useEffect(() => {
    if (phase !== 'battle' || answerFormat !== 'typed' || showHint || selected !== null) return
    const t = setTimeout(() => answerInputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [phase, answerFormat, showHint, selected, current])

  // Таймер спидрана
  useEffect(() => {
    if (!timerActive) return
    if (timer <= 0) { finishSession(); return }
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, timerActive])

  async function startTraining() {
    if (setupSource === 'topics' && selectedTopics.length === 0) return
    if (setupSource === 'scroll' && !selectedScrollId) return

    let allQ: any[] = []
    let scrollSession: ScrollRecord | null = null

    if (setupSource === 'scroll') {
      const scroll = ownedScrolls.find(s => s.id === selectedScrollId)
      if (!scroll) return
      const tag = resolveScrollTrainingTag(scroll)
      if (!tag) return
      allQ = await loadScrollTrainingQuestions(supabase, tag)
      scrollSession = scroll
    } else {
      const dungeons = selectedTopics.map(id => TOPICS.find(t => t.id === id)?.dungeon).filter(Boolean) as string[]
      for (const d of [...new Set(dungeons)]) {
        const { data } = await supabase.from('questions').select('*').eq('dungeon_name', d).limit(120)
        const merged = mergeWithFallback(d, data || [])
        if (merged.length) allQ = [...allQ, ...merged]
      }
    }

    if (allQ.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: ud } = await supabase.from('users').select('onboarding_step').eq('id', user.id).single()
      if (ud && (ud.onboarding_step || 0) < 2) {
        await supabase.from('users').update({ onboarding_step: 2 }).eq('id', user.id)
      }
    }

    const shuffled = shuffleQuestions(allQ).sort(() => Math.random() - 0.5).slice(0, TRAINING_SESSION_QUESTIONS)
    setActiveScroll(scrollSession)
    setSessionId(crypto.randomUUID())
    setQuestions(shuffled)
    setCurrent(0)
    setCorrect(0)
    setTotal(0)
    setXpEarned(0)
    setGoldEarned(0)
    setSelected(null)
    setShowHint(false)
    setInputAnswer('')
    setPhase('battle')
    if (selectedMode === 'speed') { setTimer(TRAINING_SPEED_SECONDS); setTimerActive(true) }
  }

  function advanceQuestion() {
    setSelected(null)
    setShowHint(false)
    setInputAnswer('')
    if (selectedMode === 'speed') {
      if (current + 1 >= questions.length) {
        setQuestions(q => shuffleQuestions([...q]).sort(() => Math.random() - 0.5))
        setCurrent(0)
      } else {
        setCurrent(c => c + 1)
      }
      return
    }
    if (current + 1 >= questions.length) {
      finishSession()
    } else {
      setCurrent(c => c + 1)
    }
  }

  async function processAnswer(isCorrect: boolean) {
    const q = questions[current]
    setTotal(t => t + 1)
    if (isCorrect) {
      setCorrect(c => c + 1)
      const mode = selectedMode as 'guided' | 'clean' | 'speed'
      const xpPerAnswer = trainingXpPerCorrect(mode)
      const goldPerAnswer = trainingGoldPerCorrect(mode)
      if (userData?.id && (xpPerAnswer > 0 || goldPerAnswer > 0)) {
        const { data: ud } = await supabase.from('users').select('xp, gold').eq('id', userData.id).single()
        if (ud) {
          await supabase.from('users').update({
            xp: (ud.xp ?? 0) + xpPerAnswer,
            gold: (ud.gold ?? 0) + goldPerAnswer,
          }).eq('id', userData.id)
          setUserData({ ...userData, xp: (ud.xp ?? 0) + xpPerAnswer, gold: (ud.gold ?? 0) + goldPerAnswer })
        }
        if (xpPerAnswer > 0) setXpEarned(x => x + xpPerAnswer)
        if (goldPerAnswer > 0) setGoldEarned(g => g + goldPerAnswer)
        setShowXpFloat(true)
        setTimeout(() => setShowXpFloat(false), 800)
      }
    }

    if (userData?.id && sessionId && q.id) {
      await recordTrainingAttempt(supabase, {
        userId: userData.id,
        questionId: q.id,
        isCorrect,
        sessionId,
        dungeonName: q.dungeon_name,
      })
    }
    if (!isCorrect && selectedMode === 'guided') setShowHint(true)

    if (isCorrect || selectedMode !== 'guided') {
      const delay = isCorrect
        ? (answerFormat === 'typed' ? 350 : 600)
        : 1200
      setTimeout(() => advanceQuestion(), delay)
    }
  }

  async function handleChoiceAnswer(idx: number) {
    if (selected !== null) return
    const q = questions[current]
    setSelected(idx)
    await processAnswer(idx === q.correct_index)
  }

  async function handleTypedSubmit() {
    if (selected !== null || !inputAnswer.trim()) return
    const q = questions[current]
    const isCorrect = answersMatch(inputAnswer, q.answers[q.correct_index])
    setSelected(isCorrect ? q.correct_index : -1)
    await processAnswer(isCorrect)
  }

  function dismissHint() {
    advanceQuestion()
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
  const canStart = setupSource === 'topics' ? selectedTopics.length > 0 : selectedScrollId !== null
  const selectedScroll = ownedScrolls.find(s => s.id === selectedScrollId)
  const selectedScrollTag = selectedScroll ? resolveScrollTrainingTag(selectedScroll) : null
  const selectedScrollProfile = selectedScrollTag ? SCROLL_TRAINING_PROFILES[selectedScrollTag] : null
  const scrollExample = selectedScroll ? parseScrollExample(selectedScroll.example) : parseScrollExample(activeScroll?.example)

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

       <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

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
                  "Данжи — не место для учёбы. Здесь ошибаться можно — но сессия не вечная: <span style={{ color: '#e0bc6a' }}>20 задач</span> или <span style={{ color: '#e0bc6a' }}>3 минуты</span> в спидране. Потом итог. Хочешь ещё — жми «ещё раунд»."
                </div>
              </div>
            </div>

            {/* ФОРМАТ ОТВЕТА */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>
              <span>Как отвечать</span><div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
              {ANSWER_FORMATS.map(f => (
                <div key={f.id} onClick={() => setAnswerFormat(f.id as 'choice' | 'typed')}
                  style={{ background: answerFormat === f.id ? 'rgba(123,108,255,0.08)' : '#1c1f2a', border: `1px solid ${answerFormat === f.id ? 'rgba(123,108,255,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
                  <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0', marginBottom: '4px' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              ))}
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
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.08)', color: '#e0bc6a' }}>{m.sessionLabel}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.08)', color: '#5a5670' }}>{m.xpMod}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ИСТОЧНИК ЗАДАНИЙ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>
              <span>Задания</span><div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              {[
                { id: 'topics' as const, label: 'По темам', icon: '📚' },
                { id: 'scroll' as const, label: 'По свитку', icon: '📜' },
              ].map(src => (
                <div key={src.id} onClick={() => setSetupSource(src.id)}
                  style={{ flex: 1, background: setupSource === src.id ? 'rgba(201,168,76,0.1)' : '#1c1f2a', border: `1px solid ${setupSource === src.id ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{src.icon}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: setupSource === src.id ? '#e0bc6a' : '#5a5670' }}>{src.label}</div>
                </div>
              ))}
            </div>

            {setupSource === 'topics' && (
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
            )}

            {setupSource === 'scroll' && (
              <div style={{ marginBottom: '1.5rem' }}>
                {ownedScrolls.length === 0 ? (
                  <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📜</div>
                    <div style={{ fontSize: '14px', color: '#9590a8', marginBottom: '8px' }}>Нет свитков для тренировки</div>
                    <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '1rem' }}>Купи учебный свиток в Лавке (уровень I) — тренировка подстроится под его тему.</div>
                    <div onClick={() => router.push('/shop')} style={{ display: 'inline-block', padding: '8px 18px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', cursor: 'pointer' }}>
                      🛒 Открыть Лавку
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {ownedScrolls.map(s => {
                        const sel = selectedScrollId === s.id
                        const tag = resolveScrollTrainingTag(s)
                        const profile = tag ? SCROLL_TRAINING_PROFILES[tag] : null
                        return (
                          <div key={s.id} onClick={() => setSelectedScrollId(s.id)}
                            style={{ background: sel ? 'rgba(201,168,76,0.08)' : '#1c1f2a', border: `1px solid ${sel ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '9px', padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#c9a45a', letterSpacing: '0.1em', marginBottom: '4px' }}>УР.I · {profile?.label ?? 'Свиток'}</div>
                            <div style={{ fontSize: '13px', color: '#e6e2f0', marginBottom: '2px' }}>{s.title}</div>
                            <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic' }}>{s.subtitle}</div>
                          </div>
                        )
                      })}
                    </div>
                    {selectedScroll && selectedScrollProfile && (
                      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#c9a84c', letterSpacing: '0.15em', marginBottom: '8px' }}>ТРЕНИРОВКА ПО СВИТКУ</div>
                        <div style={{ fontSize: '14px', color: '#d4c4a0', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '10px' }}>
                          «{selectedScroll.gorus}»
                        </div>
                        <div style={{ fontSize: '12px', color: '#9590a8', lineHeight: 1.6, marginBottom: '10px' }}>
                          Примеры: <span style={{ color: '#e0bc6a' }}>{selectedScrollProfile.label}</span> · {selectedScrollProfile.dungeon}
                        </div>
                        {scrollExample.task && (
                          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '6px', padding: '10px 12px', fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#c8b890' }}>
                            <div style={{ color: '#e0bc6a', marginBottom: '4px' }}>{scrollExample.task}</div>
                            {(scrollExample.steps || []).slice(0, 3).map((step, i) => (
                              <div key={i} style={{ lineHeight: 1.7 }}>{step}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={{ background: 'rgba(123,108,255,0.06)', border: '1px solid rgba(123,108,255,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', letterSpacing: '0.12em', marginBottom: '8px' }}>КОГДА ЗАКОНЧИТСЯ?</div>
              <div style={{ fontSize: '13px', color: '#c8c0d8', lineHeight: 1.65 }}>
                <strong style={{ color: '#e6e2f0' }}>С подсказками / Без подсказок</strong> — {TRAINING_SESSION_QUESTIONS} задач, потом экран итога.
                <br />
                <strong style={{ color: '#e6e2f0' }}>Спидран</strong> — 3 минуты, потом экран итога.
                <br />
                <span style={{ color: '#5a5670' }}>Выйти раньше: «← Выйти» в шапке во время сессии.</span>
              </div>
            </div>

            <div onClick={() => canStart && startTraining()} style={{ width: '100%', padding: '16px', background: canStart ? 'rgba(61,184,122,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${canStart ? 'rgba(61,184,122,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', textAlign: 'center', fontFamily: 'serif', fontSize: '20px', color: canStart ? '#3db87a' : '#3a3650', cursor: canStart ? 'pointer' : 'default', marginBottom: '8px' }}>
              {setupSource === 'scroll' ? '📜 Тренировать по свитку →' : '🏋️ Начать тренировку →'}
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', fontStyle: 'italic' }}>
              {MODES.find(m => m.id === selectedMode)?.sessionLabel ?? '20 задач'} · ошибки не отнимают HP
            </div>
          </>}

          {phase === 'done' && (
            <div style={{ maxWidth: '520px', margin: '0 auto', paddingTop: '1rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏁</div>
                <div style={{ fontFamily: 'serif', fontSize: '28px', color: '#e0bc6a', marginBottom: '8px' }}>Сессия завершена</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
                  {MODES.find(m => m.id === selectedMode)?.name} · {MODES.find(m => m.id === selectedMode)?.sessionLabel}
                </div>
              </div>

              <div style={{ background: '#1c1f2a', border: '1px solid rgba(61,184,122,0.25)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem' }}>
                {[
                  ['✓', 'Правильных', correct, '#3db87a'],
                  ['📝', 'Всего задач', total, '#e0bc6a'],
                  ['🎯', 'Точность', `${accuracy}%`, accuracy >= 80 ? '#3db87a' : accuracy >= 60 ? '#e0bc6a' : '#e05555'],
                  ...(xpEarned > 0 ? [['✨', 'XP за сессию', `+${xpEarned}`, '#a99fff']] as const : []),
                  ...(goldEarned > 0 ? [['💰', 'Золото', `+${goldEarned}`, '#e0bc6a']] as const : []),
                ].map(([icon, label, val, color]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '15px' }}>
                    <span style={{ color: '#9590a8' }}>{icon} {label}</span>
                    <span style={{ fontFamily: 'monospace', color: color as string, fontSize: '16px' }}>{String(val)}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem', fontSize: '13px', color: '#b8b0c8', fontStyle: 'italic', lineHeight: 1.65 }}>
                {accuracy >= 80
                  ? '«Неплохо. Гильдия ждёт — там уже без подсказок и с таймером.»'
                  : accuracy >= 60
                  ? '«Сойдёт для зала. Ещё раунд или в данж — как чувствуешь.»'
                  : '«Зал для ошибок. Ещё раунд с подсказками — или лекция в Коллегии.»'}
                <span style={{ color: '#5a5670' }}> — Варг</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div onClick={() => startTraining()} style={{ padding: '14px', background: 'rgba(61,184,122,0.12)', border: '1px solid rgba(61,184,122,0.4)', borderRadius: '12px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#3db87a', cursor: 'pointer' }}>
                  🔄 Ещё раунд
                </div>
                <div onClick={() => exitTraining()} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#9590a8', cursor: 'pointer' }}>
                  ← В зал
                </div>
              </div>
            </div>
          )}

          {phase === 'battle' && questions.length > 0 && (() => {
            const q = questions[current]
            return (
              <div>
                {/* Шапка боя */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div onClick={exitTraining} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9590a8', cursor: 'pointer', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>← Выйти</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
                    <span style={{ color: '#3db87a' }}>✓ {correct}</span>
                    <span style={{ color: '#5a5670' }}>/{total}</span>
                    {xpEarned > 0 && <span style={{ color: '#a99fff' }}>✨ +{xpEarned} XP</span>}
                    {goldEarned > 0 && (
                      <span style={{ color: '#e0bc6a', position: 'relative' }}>
                        💰 +{goldEarned}
                        {showXpFloat && trainingGoldPerCorrect(selectedMode as 'guided' | 'clean' | 'speed') > 0 && (
                          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '-20px', color: '#e0bc6a', fontSize: '12px', animation: 'fadeUp 0.8s ease-out forwards', whiteSpace: 'nowrap' }}>
                            +{trainingGoldPerCorrect(selectedMode as 'guided' | 'clean' | 'speed')}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
                    {accuracy}% точность
                  </div>
                </div>

                {/* Прогресс сессии */}
                {selectedMode !== 'speed' ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: '11px', marginBottom: '6px' }}>
                      <span style={{ color: '#e0bc6a' }}>Задача {current + 1} из {questions.length}</span>
                      <span style={{ color: '#5a5670' }}>после {questions.length} — итог</span>
                    </div>
                    <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #3db87a, #2a9d65)', width: `${Math.min((current / questions.length) * 100, 100)}%`, transition: 'width 0.35s ease' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem', background: 'rgba(224,188,106,0.08)', border: '1px solid rgba(224,188,106,0.25)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c8c0d8' }}>
                      ⏱ Спидран — когда <span style={{ color: '#e0bc6a' }}>0:00</span>, сессия закончится
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', color: timer > 60 ? '#3db87a' : timer > 30 ? '#e0bc6a' : '#e05555' }}>
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </div>
                  </div>
                )}

                {/* Режим-бейдж */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.2)', color: '#3db87a' }}>
                    🏋️ Тренировка
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#5a5670' }}>
                    {MODES.find(m => m.id === selectedMode)?.name}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(123,108,255,0.08)', border: '1px solid rgba(123,108,255,0.25)', color: '#a99fff' }}>
                    {answerFormat === 'typed' ? '⌨️ Сам ввод' : '🔘 Варианты'}
                  </span>
                  {activeScroll && (
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '4px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#e0bc6a' }}>
                      📜 {activeScroll.title}
                    </span>
                  )}
                </div>

                {activeScroll && scrollExample.task && (
                  <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#c9a84c', letterSpacing: '0.12em', marginBottom: '6px' }}>МЕТОД СВИТКА</div>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#c8b890', lineHeight: 1.7 }}>
                      <div style={{ color: '#e0bc6a' }}>{scrollExample.task}</div>
                      {(scrollExample.steps || []).map((step, i) => (
                        <div key={i}>{step}</div>
                      ))}
                    </div>
                  </div>
                )}

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
                      <div style={{ fontSize: '12px', color: '#9590a8', fontStyle: 'italic' }}>
                        {activeScroll?.combat ? activeScroll.combat : 'Запомни и двигайся дальше.'}
                      </div>
                    </div>
                    <div onClick={dismissHint} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', cursor: 'pointer', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                      Понял →
                    </div>
                  </div>
                )}

                {/* Ответы */}
                {!showHint && answerFormat === 'choice' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                    {q.answers.map((ans: string, idx: number) => {
                      let bg = '#1c1f2a', border = 'rgba(255,255,255,0.07)', color = '#e6e2f0'
                      if (selected !== null) {
                        if (idx === q.correct_index) { bg = 'rgba(61,184,122,0.08)'; border = 'rgba(61,184,122,0.4)'; color = '#3db87a' }
                        else if (idx === selected) { bg = 'rgba(224,85,85,0.06)'; border = 'rgba(224,85,85,0.35)'; color = '#e05555' }
                      }
                      return (
                        <div key={idx} onClick={() => handleChoiceAnswer(idx)}
                          style={{ background: bg, border: `1px solid ${border}`, borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '24px', color, cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.18s' }}>
                          {ans}
                        </div>
                      )
                    })}
                  </div>
                )}

                {!showHint && answerFormat === 'typed' && (() => {
                  const typedCorrect = selected !== null && selected === q.correct_index
                  const typedWrong = selected !== null && selected === -1
                  const fracInput = selectedTopics.includes('frac') || q.dungeon_name === 'Храм дробей'
                  let inputBorder = 'rgba(123,108,255,0.45)'
                  if (typedCorrect) inputBorder = 'rgba(61,184,122,0.55)'
                  if (typedWrong) inputBorder = 'rgba(224,85,85,0.55)'
                  return (
                    <div>
                      <input
                        ref={answerInputRef}
                        type="text"
                        inputMode="text"
                        value={inputAnswer}
                        onChange={e => setInputAnswer(sanitizeAnswerInput(e.target.value))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleTypedSubmit()
                          }
                        }}
                        placeholder={fracInput ? '2/3, ½ или 0…' : 'Ответ…'}
                        disabled={selected !== null}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        style={{
                          width: '100%',
                          background: typedWrong ? 'rgba(224,85,85,0.06)' : typedCorrect ? 'rgba(61,184,122,0.06)' : '#1c1f2a',
                          border: `2px solid ${inputBorder}`,
                          borderRadius: '12px',
                          padding: '16px 20px',
                          fontSize: '32px',
                          color: typedWrong ? '#e05555' : typedCorrect ? '#3db87a' : '#e6e2f0',
                          fontFamily: 'serif',
                          textAlign: 'center',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '10px' }}>
                        Enter — отправить{fracInput ? ' · дроби: 2/3 или ½' : ''}
                      </div>
                    </div>
                  )
                })()}

                <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', color: '#3db87a', marginTop: '12px', opacity: 0.6 }}>
                  {answerFormat === 'typed' ? '⌨️ Печатай и жми Enter — без клика в поле' : '⚠️ Ошибка не убьёт — только покажет правильный ответ'}
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

          {phase === 'battle' || phase === 'done' ? (
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
              {(() => {
                const acc = trainingStats?.accuracy
                const accColor = acc == null ? '#5a5670' : acc >= 80 ? '#3db87a' : acc >= 60 ? '#e0bc6a' : '#e05555'
                return [
                  ['🏋️', 'Сессий сегодня', String(trainingStats?.sessionsToday ?? 0), '#e0bc6a'],
                  ['📝', 'Задач решено', String(trainingStats?.totalSolved ?? 0), '#e0bc6a'],
                  ['✅', 'Точность', acc == null ? '—' : `${acc}%`, accColor],
                  ['🔥', 'Лучшая серия', trainingStats?.source === 'dungeon_runs' ? '—' : String(trainingStats?.bestStreak ?? 0), '#e0bc6a'],
                ] as const
              })().map(([icon, name, val, color]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon}</span>{name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color }}>{val}</div>
                </div>
              ))}
            </>
          )}

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>
            Прогресс по темам
          </div>

          {TOPICS.filter(t => t.dungeon && t.level <= level).map(t => {
            const pct = topicProgress[t.id] ?? null
            const color = TOPIC_COLORS[t.id] || '#3db87a'
            return (
              <div key={t.id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9590a8', marginBottom: '4px' }}>
                  <span>{t.icon} {t.name}</span>
                  <span style={{ fontFamily: 'monospace', color: pct !== null ? color : '#3a3650' }}>{pct !== null ? `${pct}%` : '—'}</span>
                </div>
                <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: color, width: pct !== null ? `${pct}%` : '0%', transition: 'width 0.4s' }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(61,184,122,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '460px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>🪖</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#3db87a', marginBottom: '6px' }}>Тренировочный зал</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>СЕРЖАНТ ВАРГ</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Здесь ты можешь практиковаться <span style={{ color: '#3db87a' }}>без риска</span> — ошибки не убивают и не забирают ресурсы.
              <br/><br/>
              <strong style={{ color: '#e6e2f0' }}>Сессия не бесконечная:</strong>
              <br/>• <span style={{ color: '#e6e2f0' }}>С подсказками / Без подсказок</span> — {TRAINING_SESSION_QUESTIONS} задач, потом итог
              <br/>• <span style={{ color: '#e6e2f0' }}>Спидран</span> — 3 минуты, потом итог
              <br/><br/>
              Когда будешь готов — иди в Гильдию. Там уже по-настоящему.
            </div>
            <div onClick={() => setShowWelcome(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(61,184,122,0.12)', border: '1px solid rgba(61,184,122,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#3db87a', cursor: 'pointer' }}>
              Понял, приступаю →
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
