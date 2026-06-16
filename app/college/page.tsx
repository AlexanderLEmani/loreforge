'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { navUnlockFromUser, USER_NAV_SELECT } from '@/lib/nav-unlock'
import {
  FALLBACK_LECTURES,
  getLectureForLevel,
  getLectureList,
  isLectureUnlocked,
  lectureLevelForUser,
  LECTURE_NUMS,
  maxUnlockedLectureLevel,
  type Lecture,
  type LectureUnlockContext,
} from '@/lib/college-lectures'
import { canTakeExam, isV1Graduate, V1_COMPLETE_DESC, V1_COMPLETE_TITLE } from '@/lib/v1-cap'
import { layout } from '@/lib/layout-classes'
import { xpProgress } from '@/lib/economy'
import { pickLoadingMessage } from '@/lib/loading-flavor'
import { LectureActions } from '@/components/LectureActions'
import type { LectureActionContext } from '@/lib/lecture-actions'
import {
  isLectureCompleteForSpells,
  maxLectureLevelFromLearnedSpells,
  maxLectureLevelFromSkillNodes,
  parseCompletedLectures,
  parseLearnedSpells,
} from '@/lib/battle-spell-scrolls'
import { LoadingScreen } from '@/components/LoadingScreen'

const LEVEL_SPELLS: Record<number, [string, string, string][]> = {
  1: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a']],
  2: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a'], ['✕', 'Умножение', '#a99fff'], ['÷', 'Деление', '#a99fff']],
  3: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a'], ['✕', 'Умножение', '#a99fff'], ['÷', 'Деление', '#a99fff'], ['½', 'Дроби', '#e0bc6a']],
  4: [['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a'], ['✕', 'Умножение', '#a99fff'], ['÷', 'Деление', '#a99fff'], ['½', 'Дроби', '#e0bc6a'], ['%', 'Проценты', '#e0bc6a']],
}

const NEXT_TOPIC: Record<number, string> = {
  1: 'Данжи ур.1 → откроется Лекция II и умножение.',
  2: 'Данжи ур.2 → Лекция III и дроби.',
  3: 'Данжи ур.3 → Лекция IV и проценты.',
  4: 'Финал курса: тренировка на %, Рынок процентов, экзамен IV.',
}

export default function CollegePage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [lectureCache, setLectureCache] = useState<Record<number, Lecture>>({})
  const [selectedLectureLevel, setSelectedLectureLevel] = useState(1)
  const [lectureLoading, setLectureLoading] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lectureLoadingMsg, setLectureLoadingMsg] = useState('')
  const [completedLectures, setCompletedLectures] = useState<number[]>([])
  const [learnedSpellLectureMax, setLearnedSpellLectureMax] = useState(0)
  const [skillNodeLectureMax, setSkillNodeLectureMax] = useState(0)
  const [markingLecture, setMarkingLecture] = useState(false)

  useEffect(() => {
    if (lectureLoading) setLectureLoadingMsg(pickLoadingMessage('lecture'))
  }, [lectureLoading])

  async function ensureLectureInCache(levelNum: number): Promise<Lecture> {
    const resolved = lectureCache[levelNum] || FALLBACK_LECTURES[levelNum] || FALLBACK_LECTURES[1]
    if (!lectureCache[levelNum]) {
      setLectureCache(prev => ({ ...prev, [levelNum]: resolved }))
    }
    return resolved
  }

  async function openLecture(levelNum: number, unlockCtx: LectureUnlockContext) {
    if (!isLectureUnlocked(levelNum, unlockCtx)) return
    setLectureLoading(true)
    setSelectedLectureLevel(levelNum)
    await ensureLectureInCache(levelNum)
    setLectureLoading(false)
  }

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/')
          return
        }

        let { data, error: userError } = await supabase
          .from('users')
          .select(`${USER_NAV_SELECT}, completed_lectures, learned_spells, spell_scrolls`)
          .eq('id', user.id)
          .single()

        if (userError?.message?.match(/completed_lectures|learned_spells|spell_scrolls/)) {
          const fallback = await supabase
            .from('users')
            .select(USER_NAV_SELECT)
            .eq('id', user.id)
            .single()
          data = fallback.data
            ? {
                ...fallback.data,
                completed_lectures: [],
                learned_spells: [],
                spell_scrolls: null,
              }
            : null
          userError = fallback.error
        }

        if (userError || !data) {
          setLoadError('Не удалось загрузить профиль')
          return
        }

        setUserData({ ...data, id: user.id })
        const completed = parseCompletedLectures(data?.completed_lectures)
        setCompletedLectures(completed)
        const learned = parseLearnedSpells(data?.learned_spells, data?.spell_scrolls)
        const spellLectureMax = maxLectureLevelFromLearnedSpells(learned)
        setLearnedSpellLectureMax(spellLectureMax)

        const { data: skillRows } = await supabase
          .from('user_skills')
          .select('node_id')
          .eq('user_id', user.id)
        const skillLectureMax = maxLectureLevelFromSkillNodes(
          (skillRows ?? []).map(r => r.node_id as number),
        )
        setSkillNodeLectureMax(skillLectureMax)

        const level = data?.level || 1
        const unlockCtx: LectureUnlockContext = {
          userLevel: level,
          completedLectures: completed,
          learnedSpellLectureMax: spellLectureMax,
          skillNodeLectureMax: skillLectureMax,
        }
        const currentLecture = lectureLevelForUser(level)
        const maxUnlocked = maxUnlockedLectureLevel(unlockCtx)

        const cache: Record<number, Lecture> = {}
        for (let i = 1; i <= 4; i++) {
          cache[i] = FALLBACK_LECTURES[i]
        }
        setLectureCache(cache)
        setSelectedLectureLevel(Math.min(maxUnlocked, Math.max(currentLecture, 1)))

        if (!data.visited_college) setShowWelcome(true)

        if ((data.onboarding_step || 0) < 1) {
          await supabase.from('users').update({ onboarding_step: 1 }).eq('id', user.id)
          setUserData((prev: any) => ({ ...prev, onboarding_step: 1 }))
        }
      } catch (e) {
        console.error(e)
        setLoadError('Ошибка загрузки коллегии')
        setLectureCache(FALLBACK_LECTURES)
        setSelectedLectureLevel(1)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const level = userData?.level || 1
  const unlockCtx: LectureUnlockContext = {
    userLevel: level,
    completedLectures,
    learnedSpellLectureMax,
    skillNodeLectureMax,
  }
  const currentLectureLevel = lectureLevelForUser(level)
  const lecture = lectureCache[selectedLectureLevel] || getLectureForLevel(selectedLectureLevel)
  const lectureList = getLectureList(unlockCtx, selectedLectureLevel).map(l => ({
    ...l,
    done: l.done || isLectureCompleteForSpells(l.level, unlockCtx),
  }))
  const viewingArchive = selectedLectureLevel !== currentLectureLevel
  const selectedLectureComplete = isLectureCompleteForSpells(selectedLectureLevel, unlockCtx)

  async function markLectureRead() {
    if (markingLecture || selectedLectureComplete) return
    if (!isLectureUnlocked(selectedLectureLevel, unlockCtx)) return
    setMarkingLecture(true)
    const next = [...new Set([...completedLectures, selectedLectureLevel])].sort((a, b) => a - b)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ completed_lectures: next }).eq('id', user.id)
    }
    setCompletedLectures(next)
    setMarkingLecture(false)
  }

  const { current: xpCurrent, next: xpNext } = xpProgress(userData?.xp || 0, level)
  const examReady = xpCurrent >= xpNext
  const v1Done = isV1Graduate(level)
  const showExamCta = canTakeExam(level, examReady)

  const canGoPrev = selectedLectureLevel > 1 && isLectureUnlocked(selectedLectureLevel - 1, unlockCtx)
  const canGoNext = selectedLectureLevel < 4 && isLectureUnlocked(selectedLectureLevel + 1, unlockCtx)

  const actionCtx: LectureActionContext = {
    userLevel: level,
    examReady,
    visitedTraining: userData?.visited_training,
  }

  const sidebarActionDefs =
    lecture?.sections?.find(s => s.type === 'actions')?.actions
    ?? FALLBACK_LECTURES[selectedLectureLevel]?.sections?.find(s => s.type === 'actions')?.actions
    ?? []

  if (loading) return <LoadingScreen />

  if (loadError && !lecture) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8a0a0', fontFamily: 'serif', fontSize: '16px', padding: '2rem', textAlign: 'center' }}>
      {loadError}
    </div>
  )

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      <nav className={layout.navBar} style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreHeim
        </div>
        <div className="lf-nav-subtitle" style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
          Коллегия магов · Математика · Ур. {level}
        </div>
      </nav>

      <div className={layout.college}>

        <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

        <div className={layout.collegeMain}>

          <div className="lf-college-content lf-main">

            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="lf-lecture-header">
                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase' }}>
                  Лекция {LECTURE_NUMS[selectedLectureLevel - 1]}
                  {viewingArchive && <span style={{ color: '#9590a8' }}> · архив</span>}
                </div>
                <div className="lf-lecture-nav">
                  <div
                    onClick={() => canGoPrev && openLecture(selectedLectureLevel - 1, unlockCtx)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px',
                      border: '1px solid rgba(255,255,255,0.1)', color: canGoPrev ? '#9590a8' : '#3a3d4a',
                      cursor: canGoPrev ? 'pointer' : 'default', opacity: canGoPrev ? 1 : 0.4,
                    }}
                  >
                    ← Пред.
                  </div>
                  <div
                    onClick={() => canGoNext && openLecture(selectedLectureLevel + 1, unlockCtx)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px',
                      border: '1px solid rgba(255,255,255,0.1)', color: canGoNext ? '#9590a8' : '#3a3d4a',
                      cursor: canGoNext ? 'pointer' : 'default', opacity: canGoNext ? 1 : 0.4,
                    }}
                  >
                    След. →
                  </div>
                </div>
              </div>
              <div className="lf-page-title">
                {lectureLoading ? lectureLoadingMsg : lecture?.title}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff' }}>Профессор Горус · Архимаг Арифметики</div>
              {viewingArchive && (
                <div
                  onClick={() => openLecture(currentLectureLevel, unlockCtx)}
                  style={{ marginTop: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#b8aeff', cursor: 'pointer' }}
                >
                  ↑ Вернуться к текущей лекции ({LECTURE_NUMS[currentLectureLevel - 1]})
                </div>
              )}
            </div>

            {(lecture?.sections || []).map((s, i) => {
              if (s.type === 'professor') return (
                <div key={i} className="lf-professor-block">
                  <div style={{ fontSize: '40px', flexShrink: 0, lineHeight: 1 }}>🧙‍♂️</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', letterSpacing: '0.1em', marginBottom: '6px' }}>ПРОФЕССОР ГОРУС</div>
                    <div className="lf-prose" style={{ fontStyle: 'italic', marginBottom: 0 }}>"{s.text}"</div>
                  </div>
                </div>
              )
              if (s.type === 'heading') return (
                <div key={i} className="lf-section-heading-wrap">
                  <div className="lf-section-heading-line"></div>
                  <div className="lf-section-heading-text">{s.text}</div>
                  <div className="lf-section-heading-line"></div>
                </div>
              )
              if (s.type === 'text') return (
                <p key={i} className="lf-prose">{s.text}</p>
              )
              if (s.type === 'quote') return (
                <div key={i} style={{ borderLeft: '3px solid rgba(201,168,76,0.4)', padding: '1rem 1.25rem', margin: '1.5rem 0', background: 'rgba(201,168,76,0.04)', borderRadius: '0 8px 8px 0' }}>
                  <p style={{ fontSize: '14px', color: '#e0bc6a', fontStyle: 'italic', lineHeight: 1.7 }}>{s.text}</p>
                </div>
              )
              if (s.type === 'formula') return (
                <div key={i} className="lf-formula-block">
                  <div className="lf-formula-expr">{s.text}</div>
                  {s.hint && <div className="lf-formula-hint">{s.hint}</div>}
                </div>
              )
              if (s.type === 'outro') return (
                <div key={i} className="lf-professor-block" style={{ margin: '2rem 0 0' }}>
                  <div style={{ fontSize: '40px', flexShrink: 0, lineHeight: 1 }}>🧙‍♂️</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', letterSpacing: '0.1em', marginBottom: '6px' }}>ПРОФЕССОР ГОРУС</div>
                    <div className="lf-prose" style={{ fontStyle: 'italic', marginBottom: 0 }}>"{s.text}"</div>
                  </div>
                </div>
              )
              if (s.type === 'actions' && s.actions?.length) return (
                <LectureActions key={i} defs={s.actions} ctx={actionCtx} title={s.text} />
              )
              return null
            })}

            {!userData?.visited_college && selectedLectureLevel === currentLectureLevel && !viewingArchive && (
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

            {isLectureUnlocked(selectedLectureLevel, unlockCtx) && (
              <div style={{ marginTop: '2rem' }}>
                {selectedLectureComplete ? (
                  <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.35)', fontSize: '13px', color: '#3db87a', lineHeight: 1.55 }}>
                    ✓ Лекция {LECTURE_NUMS[selectedLectureLevel - 1]} прочитана — заклинания этого уровня можно покупать в лавке
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={markingLecture}
                    onClick={() => void markLectureRead()}
                    style={{ width: '100%', padding: '16px', background: 'rgba(123,108,255,0.12)', border: '1px solid rgba(169,159,255,0.45)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '17px', color: '#b8aeff', cursor: markingLecture ? 'default' : 'pointer' }}
                  >
                    {markingLecture ? 'Сохраняем…' : 'Лекцию прочитал → открыть заклинания в лавке'}
                  </button>
                )}
              </div>
            )}

          </div>

          <div className={`${layout.sidebarR} lf-college-sidebar-r`} style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '4px' }}>Лекции</div>
            {lectureList.map(l => (
              <div
                key={l.num}
                onClick={() => l.unlocked && openLecture(l.level, unlockCtx)}
                style={{
                  background: l.isViewing ? 'rgba(123,108,255,0.15)' : l.isCurrent ? 'rgba(123,108,255,0.08)' : '#1c1f2a',
                  border: `1px solid ${l.isViewing ? 'rgba(169,159,255,0.55)' : l.isCurrent ? 'rgba(123,108,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '9px',
                  padding: '10px 12px',
                  opacity: l.unlocked ? 1 : 0.45,
                  cursor: l.unlocked ? 'pointer' : 'default',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: l.isViewing ? '#b8aeff' : l.unlocked ? '#9590a8' : '#5a5670', width: '16px', flexShrink: 0 }}>{l.num}</div>
                  <div style={{ fontSize: '12px', color: l.isViewing ? '#e6e2f0' : l.unlocked ? '#b8b0c8' : '#5a5670', flex: 1, lineHeight: 1.3 }}>{l.title}</div>
                  {l.done && !l.isViewing && <span style={{ color: '#3db87a', fontSize: '11px' }}>✓</span>}
                  {l.isViewing && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#b8aeff', flexShrink: 0 }}>читаешь</span>}
                  {l.isCurrent && !l.isViewing && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', flexShrink: 0 }}>сейчас</span>}
                  {!l.unlocked && <span style={{ fontSize: '11px', color: '#5a5670' }}>🔒</span>}
                </div>
              </div>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}></div>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '4px' }}>Заклинания</div>
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', padding: '10px 12px' }}>
              {(LEVEL_SPELLS[Math.min(level, 4)] || LEVEL_SPELLS[1]).map(([icon, name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#9590a8' }}>
                  <span>{icon}</span>
                  <span style={{ flex: 1 }}>{name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: color }}>✓</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}></div>

            {sidebarActionDefs.length > 0 && (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '4px' }}>Действия</div>
                <LectureActions defs={sidebarActionDefs} ctx={actionCtx} compact />
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}></div>
              </>
            )}

            <div style={{ background: 'rgba(123,108,255,0.06)', border: '1px solid rgba(123,108,255,0.2)', borderRadius: '9px', padding: '10px 12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Прогресс к экзамену</div>
              <div style={{ height: '4px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '5px' }}>
                <div style={{ height: '100%', background: v1Done ? '#3db87a' : examReady ? '#e0bc6a' : '#7b6cff', width: `${Math.min((xpCurrent / xpNext) * 100, 100)}%`, transition: 'width 0.4s' }}></div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c', marginBottom: '8px' }}>{xpCurrent} / {xpNext} XP</div>
              {v1Done ? (
                <div style={{ fontSize: '11px', color: '#3db87a', lineHeight: 1.55 }}>
                  <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#3db87a', marginBottom: '4px' }}>{V1_COMPLETE_TITLE}</div>
                  {V1_COMPLETE_DESC}
                </div>
              ) : showExamCta ? (
                <div onClick={() => router.push(`/exam?level=${level}`)}
                  style={{ padding: '8px', background: 'rgba(224,188,106,0.12)', border: '1px solid rgba(224,188,106,0.4)', borderRadius: '7px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', cursor: 'pointer' }}>
                  🎓 Сдать экзамен
                </div>
              ) : (
                <div className="lf-college-hint" style={{ fontSize: '11px', color: '#8a849c', lineHeight: 1.5 }}>
                  {NEXT_TOPIC[Math.min(level, 4)] || 'Пройди данжи чтобы набрать XP и открыть экзамен.'}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {showWelcome && (
        <div className="lf-modal-overlay">
          <div className="lf-modal-panel" style={{ maxWidth: '460px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>🏛️</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '6px' }}>Коллегия Магов</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>ПРОФЕССОР ГОРУС</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Короткие лекции: <span style={{ color: '#e0bc6a' }}>зачем тема</span> и один рабочий метод — без воды.
              <br/><br/>
              <span style={{ color: '#e6e2f0' }}>📖 Лекции</span> — теория по уровню, архив пройденных.
              <br/>
              <span style={{ color: '#e6e2f0' }}>🎓 Экзамен</span> — когда XP-бар полный: проверка, не оценка в школе.
              <br/>
              <span style={{ color: '#e6e2f0' }}>⚡ Заклинания</span> — новые атаки открываются с уровнем.
            </div>
            <div onClick={() => setShowWelcome(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#e0bc6a', cursor: 'pointer' }}>
              Понял, читаю →
            </div>
          </div>
        </div>
      )}

      {showNext && (
        <div className="lf-modal-overlay">
          <div className="lf-modal-panel">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🧙‍♂️</div>
              <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#e0bc6a', marginBottom: '6px' }}>Первый шаг сделан</div>
              <div style={{ fontSize: '13px', color: '#8a849c', lineHeight: 1.6 }}>
                Теория без практики не держится. Куда дальше?
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
              <div onClick={() => router.push('/training')}
                style={{ background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.3)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>🏋️</div>
                <div>
                  <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '3px' }}>Тренировочный зал</div>
                  <div style={{ fontSize: '12px', color: '#8a849c' }}>Попрактикуйся без риска.</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#3db87a', marginLeft: 'auto' }}>→</div>
              </div>

              <div onClick={() => userData?.visited_training && router.push('/guild')}
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: userData?.visited_training ? 'pointer' : 'default', opacity: userData?.visited_training ? 1 : 0.4 }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>⚔️</div>
                <div>
                  <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '3px' }}>Гильдия авантюристов</div>
                  <div style={{ fontSize: '12px', color: '#8a849c' }}>
                    {userData?.visited_training ? 'Иди в бой.' : 'Сначала зайди в тренировочный зал.'}
                  </div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', marginLeft: 'auto' }}>→</div>
              </div>
            </div>

            <div onClick={() => { setShowNext(false); router.push('/hub') }}
              style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#8a849c', cursor: 'pointer', padding: '8px' }}>
              ← Вернуться в хаб
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
