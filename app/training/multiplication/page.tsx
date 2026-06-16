'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import MulTableGrid from '@/components/MulTableGrid'
import { navUnlockFromUser } from '@/lib/nav-unlock'
import { layout } from '@/lib/layout-classes'
import { xpProgress } from '@/lib/economy'
import { LoadingScreen } from '@/components/LoadingScreen'
import { answersMatch, sanitizeAnswerInput } from '@/lib/scroll-display'
import { keepInputFocusOnPress, scheduleInputRefocus } from '@/lib/refocus-input'
import { recordTrainingAttempt } from '@/lib/training-stats'
import { useStudyTimer } from '@/lib/use-study-timer'
import StudyProgressChip from '@/components/StudyProgressChip'
import { checkTrainingMastery, type MasteryDef } from '@/lib/mastery-achievements'
import { playSound, soundOnAnswerInput, soundOnEnterKey } from '@/lib/sounds'
import SoundToggle from '@/components/SoundToggle'
import MulTrainerHelpModal from '@/components/MulTrainerHelpModal'
import {
  buildSession,
  loadMulStats,
  loadMulSprintRecord,
  MUL_SPRINT_ACHIEVEMENT_CORRECT,
  MUL_SPRINT_SECONDS,
  MUL_TABLE_MODES,
  MUL_TIERS,
  makePair,
  recordMulStat,
  rowLifehack,
  rowProgress,
  saveMulSprintResult,
  tierConfig,
  tierProgress,
  tierSpan,
  tipForPair,
  type CellStat,
  type MulPair,
  type MulSprintRecord,
  type MulTableModeId,
  type MulTierId,
} from '@/lib/mul-table'

type Phase = 'setup' | 'drill' | 'done'

export default function MultiplicationTrainerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [phase, setPhase] = useState<Phase>('setup')
  const [tier, setTier] = useState<MulTierId>('basic')
  const [mode, setMode] = useState<MulTableModeId>('easy')
  const [selectedRow, setSelectedRow] = useState(7)
  const [stats, setStats] = useState<Record<string, CellStat>>({})
  const [queue, setQueue] = useState<MulPair[]>([])
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const [showTip, setShowTip] = useState(false)
  const [timer, setTimer] = useState(MUL_SPRINT_SECONDS)
  const [timerActive, setTimerActive] = useState(false)
  const [newMastery, setNewMastery] = useState<MasteryDef[]>([])
  const [sprintRecord, setSprintRecord] = useState<MulSprintRecord | null>(null)
  const [sprintNewBest, setSprintNewBest] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef(0)
  const correctRef = useRef(0)
  const totalRef = useRef(0)
  const timerRef = useRef(MUL_SPRINT_SECONDS)
  const inputRef = useRef<HTMLInputElement>(null)

  useStudyTimer(phase === 'drill')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase
        .from('users')
        .select('xp, level, gold, onboarding_step, visited_college, visited_training, visited_guild, visited_grimoire, visited_shop, visited_skills, quest_first_dungeon')
        .eq('id', user.id)
        .single()
      setUserData({ ...data, id: user.id })
      setStats(loadMulStats(user.id, tier))
      setSprintRecord(loadMulSprintRecord(user.id, tier))
      setLoading(false)
    }
    load()
  }, [])

  function switchTier(next: MulTierId) {
    if (!userData?.id || next === tier) return
    setTier(next)
    setStats(loadMulStats(userData.id, next))
    setSprintRecord(loadMulSprintRecord(userData.id, next))
    setSelectedRow(next === 'teens' ? 12 : 7)
    setPhase('setup')
  }

  useEffect(() => {
    if (!timerActive) return
    timerRef.current = timer
    if (timer <= 0) {
      finishDrill()
      return
    }
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, timerActive])

  useEffect(() => {
    if (phase !== 'drill') return
    const t = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [phase, index, feedback])

  function startDrill(cell?: MulPair) {
    if (!userData?.id) return
    const pairs = buildSession(mode, stats, {
      tier,
      row: mode === 'row' ? selectedRow : undefined,
      cell: cell ?? (mode === 'cell' ? cell : undefined),
    })
    sessionIdRef.current = crypto.randomUUID()
    sessionStartRef.current = Date.now()
    correctRef.current = 0
    totalRef.current = 0
    setQueue(pairs)
    setIndex(0)
    setCorrect(0)
    setTotal(0)
    setInput('')
    setFeedback(null)
    setShowTip(false)
    setNewMastery([])
    setSprintNewBest(false)
    setPhase('drill')
    if (mode === 'sprint') {
      setTimer(MUL_SPRINT_SECONDS)
      timerRef.current = MUL_SPRINT_SECONDS
      setTimerActive(true)
    } else {
      setTimerActive(false)
    }
  }

  function finishDrill() {
    setTimerActive(false)
    if (mode === 'sprint' && userData?.id) {
      const { record, isNewBest } = saveMulSprintResult(
        userData.id,
        correctRef.current,
        totalRef.current,
        tier,
      )
      setSprintRecord(record)
      setSprintNewBest(isNewBest)
    } else {
      setSprintNewBest(false)
    }
    setPhase('done')
    void evaluateMastery()
  }

  async function evaluateMastery() {
    if (!userData?.id) return
    const elapsed =
      mode === 'sprint'
        ? MUL_SPRINT_SECONDS - timerRef.current
        : Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 1000))
    const granted = await checkTrainingMastery(supabase, userData.id, {
      mode: mode === 'sprint' ? 'speed' : 'clean',
      topics: ['mul'],
      setupSource: 'topics',
      correct: correctRef.current,
      total: totalRef.current,
      elapsedSeconds: elapsed,
    })
    if (granted.length) setNewMastery(granted)
  }

  async function submitAnswer() {
    if (!input.trim() || feedback !== null || !userData?.id) return
    const pair = queue[index]
    if (!pair) return

    const isCorrect = answersMatch(input, String(pair.product))
    playSound(isCorrect ? 'correct' : 'wrong')
    setFeedback(isCorrect ? 'ok' : 'bad')
    scheduleInputRefocus(inputRef.current)
    setTotal(t => {
      const n = t + 1
      totalRef.current = n
      return n
    })
    if (isCorrect) {
      setCorrect(c => {
        const n = c + 1
        correctRef.current = n
        return n
      })
    } else {
      setShowTip(true)
    }

    setStats(recordMulStat(userData.id, pair.a, pair.b, isCorrect, tier))

    if (sessionIdRef.current) {
      await recordTrainingAttempt(supabase, {
        userId: userData.id,
        questionId: `${pair.a}x${pair.b}`,
        isCorrect,
        sessionId: sessionIdRef.current,
        dungeonName: 'Башня умножения',
      })
    }

    const delay = isCorrect ? (mode === 'sprint' ? 180 : 400) : 1400
    setTimeout(() => {
      setInput('')
      setFeedback(null)
      if (mode === 'sprint') {
        if (index + 1 >= queue.length) {
          setQueue(q => [...q, ...buildSession('full', stats, { tier }).slice(0, 20)])
        }
        setIndex(i => i + 1)
      } else if (index + 1 >= queue.length) {
        finishDrill()
      } else {
        setIndex(i => i + 1)
      }
      scheduleInputRefocus(inputRef.current)
    }, delay)
  }

  if (loading) return <LoadingScreen />

  const level = userData?.level || 1
  const { current: xpCurrent, next: xpNext } = xpProgress(userData?.xp || 0, level)
  const pair = queue[index]
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const tierMeta = tierConfig(tier)
  const currentTip = pair ? tipForPair(pair.a, pair.b, tier) : ''
  const rowHack = rowLifehack(selectedRow, tier)
  const gridProgress = tierProgress(stats, tier)
  const tierLifehacks = tier === 'teens'
    ? [
        '×11 — 7×11 = 77 (цифра дважды)',
        '×12 — ×10 + ×2',
        '×15 — ×10 + ×5',
        '×19 — ×20 − число',
        '×20 — ×10 ×2',
        'Разбей: 14×13 = 14×10 + 14×3',
      ]
    : [
        '×2 — удвой число',
        '×5 — половина от ×10',
        '×9 — ×10 минус число',
        '×4 — ×2 два раза',
        'Диагональ — квадраты n²',
        'Зеркало: 3×7 = 7×3',
      ]

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>
      <nav className={layout.navBar} style={{ height: '56px', background: 'rgba(11,12,16,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a' }}>✕ Таблица умножения</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            title="Справка по тренажёру"
            aria-label="Справка по тренажёру"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '1px solid rgba(169,159,255,0.35)', background: 'rgba(123,108,255,0.08)',
              color: '#a99fff', fontFamily: 'monospace', fontSize: '14px', cursor: 'pointer',
            }}
          >
            ?
          </button>
          <button type="button" onClick={() => router.push('/training')} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9590a8', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
            ← Зал тренировок
          </button>
        </div>
      </nav>

      <div className={layout.threeCol}>
        <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

        <div className={`${layout.main} lf-main`} style={{ background: '#0b0c10' }}>
          {phase === 'setup' && (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', marginBottom: '4px' }}>СПЕЦТРЕНАЖЁР</div>
                <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '6px' }}>Таблица Пифагора</div>
                <div style={{ fontSize: '13px', color: '#9590a8', lineHeight: 1.6, marginBottom: '8px' }}>
                  Кликни ячейку — тренируй пару. Оранжевая диагональ — квадраты. Зелёные — уже в памяти.
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  style={{
                    fontFamily: 'monospace', fontSize: '11px', color: '#a99fff',
                    background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline',
                    textUnderlineOffset: '3px', marginBottom: '14px',
                  }}
                >
                  Как пользоваться и как быстрее выучить →
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
                  {(Object.keys(MUL_TIERS) as MulTierId[]).map(id => {
                    const t = MUL_TIERS[id]
                    const active = tier === id
                    const prog = id === tier ? gridProgress : tierProgress(loadMulStats(userData?.id ?? '', id), id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => switchTier(id)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: `1px solid ${active ? 'rgba(201,168,76,0.55)' : 'rgba(255,255,255,0.08)'}`,
                          background: active ? 'rgba(201,168,76,0.1)' : '#141820',
                          cursor: 'pointer',
                          color: '#e6e2f0',
                        }}
                      >
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: active ? '#e0bc6a' : '#5a5670', letterSpacing: '0.12em', marginBottom: '4px' }}>
                          УРОВЕНЬ {id === 'basic' ? 'I' : 'II'}
                        </div>
                        <div style={{ fontSize: '18px', color: active ? '#e0bc6a' : '#c8c0d8', marginBottom: '2px' }}>{t.label}</div>
                        <div style={{ fontSize: '11px', color: '#5a5670', lineHeight: 1.4 }}>{t.subtitle}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3db87a', marginTop: '6px' }}>{prog}% сетки в памяти</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ background: '#141820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.15em', marginBottom: '8px' }}>
                  КАРТА · {tierSpan(tier)}
                </div>
                <MulTableGrid
                  tier={tier}
                  stats={stats}
                  highlightRow={mode === 'row' ? selectedRow : null}
                  onCellClick={(a, b) => {
                    setMode('cell')
                    startDrill(makePair(a, b))
                  }}
                />
              </div>

              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.15em', marginBottom: '8px' }}>РЕЖИМЫ</div>

              {sprintRecord && (
                <div style={{ background: 'rgba(224,188,106,0.08)', border: '1px solid rgba(224,188,106,0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#c8c0d8' }}>
                  🏆 Рекорд спидрана ({tierSpan(tier)}): <span style={{ color: '#e0bc6a' }}>{sprintRecord.bestCorrect}</span> верных
                  <span style={{ color: '#5a5670' }}> · {sprintRecord.accuracy}%</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '1rem' }}>
                {MUL_TABLE_MODES.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${mode === m.id ? 'rgba(169,159,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
                      background: mode === m.id ? 'rgba(123,108,255,0.1)' : '#1c1f2a',
                      cursor: 'pointer',
                      color: '#e6e2f0',
                    }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{m.icon}</div>
                    <div style={{ fontSize: '14px', marginBottom: '2px' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#5a5670', lineHeight: 1.4 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {mode === 'row' && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '11px', color: '#5a5670', marginBottom: '8px' }}>Выбери ряд:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {Array.from({ length: tierMeta.max - tierMeta.min + 1 }, (_, i) => i + tierMeta.min).map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSelectedRow(n)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${selectedRow === n ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          background: selectedRow === n ? 'rgba(201,168,76,0.1)' : '#1c1f2a',
                          color: selectedRow === n ? '#e0bc6a' : '#9590a8',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                        }}
                      >
                        ×{n} · {rowProgress(stats, n, tier)}%
                      </button>
                    ))}
                  </div>
                  {rowHack && (
                    <div className="lf-mul-tip-banner" style={{ marginTop: '10px' }}>
                      <strong>ЛАЙФХАК ×{selectedRow}</strong><br />{rowHack}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => startDrill()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(61,184,122,0.45)',
                  background: 'rgba(61,184,122,0.12)',
                  color: '#3db87a',
                  fontFamily: 'serif',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                Начать · {tierSpan(tier)} · {MUL_TABLE_MODES.find(m => m.id === mode)?.sessionLabel}
              </button>
            </>
          )}

          {phase === 'drill' && pair && (
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
              <StudyProgressChip />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '11px' }}>
                <span style={{ color: '#9590a8' }}>{MUL_TABLE_MODES.find(m => m.id === mode)?.name} · {tierSpan(tier)}</span>
                {mode === 'sprint' ? (
                  <span style={{ color: timer > 30 ? '#3db87a' : '#e05555', fontSize: '18px' }}>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
                ) : (
                  <span style={{ color: '#5a5670' }}>{index + 1} / {queue.length}</span>
                )}
                <span style={{ color: '#3db87a' }}>✓ {correct}{mode === 'sprint' && sprintRecord ? ` · рек. ${sprintRecord.bestCorrect}` : ''}</span>
              </div>

              {(showTip || mode === 'easy') && currentTip && (
                <div className="lf-mul-tip-banner">
                  <strong>ПОДСКАЗКА</strong><br />{currentTip}
                </div>
              )}

              <div style={{ background: '#1c1f2a', border: `1px solid ${feedback === 'ok' ? 'rgba(61,184,122,0.4)' : feedback === 'bad' ? 'rgba(224,85,85,0.4)' : 'rgba(169,159,255,0.25)'}`, borderRadius: '14px', padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'serif', fontSize: '48px', color: '#e6e2f0' }}>{pair.a} × {pair.b}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', marginTop: '8px' }}>= ?</div>
              </div>

              <form
                className="lf-sprint-answer-form"
                onSubmit={e => {
                  e.preventDefault()
                  submitAnswer()
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  enterKeyHint="go"
                  value={input}
                  onChange={e => {
                    if (feedback !== null) return
                    const next = sanitizeAnswerInput(e.target.value)
                    soundOnAnswerInput(input, next)
                    setInput(next)
                  }}
                  onKeyDown={soundOnEnterKey}
                  autoComplete="off"
                  style={{
                    flex: 1,
                    background: '#1c1f2a',
                    border: '1px solid rgba(169,159,255,0.35)',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '28px',
                    color: '#e6e2f0',
                    fontFamily: 'serif',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="lf-sprint-submit-btn"
                  onMouseDown={keepInputFocusOnPress}
                  onTouchStart={keepInputFocusOnPress}
                  disabled={feedback !== null || !input.trim()}
                  style={{ padding: '14px 20px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.1)', color: '#e0bc6a', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✓
                </button>
              </form>
              <div className="lf-sprint-enter-only">
                Готово на клавиатуре — без кнопки ✓
              </div>

              <button type="button" onClick={() => { setTimerActive(false); setPhase('setup') }} style={{ marginTop: '1rem', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Выйти
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏁</div>
              <div style={{ fontFamily: 'serif', fontSize: '24px', color: '#e0bc6a', marginBottom: '1rem' }}>Раунд · {tierSpan(tier)}</div>
              <div style={{ background: '#1c1f2a', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', fontFamily: 'monospace' }}>
                <div style={{ color: '#3db87a', fontSize: '20px' }}>{correct} / {total} · {accuracy}%</div>
                {mode === 'sprint' && sprintRecord && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#9590a8' }}>
                    {sprintNewBest ? (
                      <span style={{ color: '#e0bc6a' }}>🏆 Новый рекорд! {sprintRecord.bestCorrect} верных</span>
                    ) : (
                      <span>Рекорд: {sprintRecord.bestCorrect} верных · {sprintRecord.accuracy}%</span>
                    )}
                    {correct >= MUL_SPRINT_ACHIEVEMENT_CORRECT && accuracy >= 90 && (
                      <div style={{ color: '#a99fff', marginTop: '4px' }}>Цель ачивки ({MUL_SPRINT_ACHIEVEMENT_CORRECT}) — достигнута</div>
                    )}
                  </div>
                )}
              </div>
              {newMastery.length > 0 && (
                <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '10px', padding: '12px', marginBottom: '1rem' }}>
                  {newMastery.map(m => (
                    <div key={m.id} style={{ color: '#e0bc6a', marginBottom: '4px' }}>{m.icon} {m.title}</div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" onClick={() => startDrill()} style={{ padding: '12px', borderRadius: '10px', border: '1px solid rgba(61,184,122,0.4)', background: 'rgba(61,184,122,0.1)', color: '#3db87a', cursor: 'pointer' }}>Ещё раунд</button>
                <button type="button" onClick={() => setPhase('setup')} style={{ padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#9590a8', cursor: 'pointer' }}>К карте</button>
              </div>
            </div>
          )}
        </div>

        <div className={layout.sidebarR} style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <SoundToggle />
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.2em', marginBottom: '10px' }}>СПИДРАН · {tierSpan(tier)}</div>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(224,188,106,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '1.25rem' }}>
            {sprintRecord ? (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: '28px', color: '#e0bc6a', lineHeight: 1 }}>{sprintRecord.bestCorrect}</div>
                <div style={{ fontSize: '11px', color: '#5a5670', marginTop: '4px' }}>лучший результат · {sprintRecord.accuracy}%</div>
              </>
            ) : (
              <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>Пройди спидран — рекорд появится здесь</div>
            )}
            <div style={{ fontSize: '10px', color: '#7b6cff', marginTop: '8px', lineHeight: 1.45 }}>
              Ачивка «Спринтер»: {MUL_SPRINT_ACHIEVEMENT_CORRECT}+ верных за 3 мин
            </div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.2em', marginBottom: '10px' }}>ЛАЙФХАКИ · {tierSpan(tier)}</div>
          {tierLifehacks.map(t => (
            <div key={t} style={{ fontSize: '12px', color: '#9590a8', marginBottom: '8px', lineHeight: 1.45 }}>· {t}</div>
          ))}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            style={{
              marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid rgba(169,159,255,0.3)', background: 'rgba(123,108,255,0.06)',
              fontFamily: 'monospace', fontSize: '11px', color: '#a99fff', cursor: 'pointer',
            }}
          >
            📖 Справка
          </button>
        </div>
      </div>

      {showHelp && <MulTrainerHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
