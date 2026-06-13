'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { resetUserProgress } from '@/lib/reset-progress'
import { useRouter } from 'next/navigation'
import AppNav from '@/components/AppNav'
import {
  CORE_ONBOARDING_STEPS,
  currentCoreOnboardingStep,
  coreOnboardingProgress,
  currentOnboardingStep,
  onboardingProgress,
  ONBOARDING_STEPS,
} from '@/lib/onboarding-quest'
import { currentLevelPlan, nextLevelPlan } from '@/lib/curriculum'
import { HUB_GUIDE_SECTIONS } from '@/lib/hub-guide'
import GuideModal from '@/components/GuideModal'
import { navUnlockFromUser } from '@/lib/nav-unlock'
import { buildHubDailyQuests, type DailyQuest } from '@/lib/daily-quests'
import { todayIso } from '@/lib/guild-quests'
import { syncQuestRewards, withHubClaimed } from '@/lib/quest-rewards'
import { canTakeExam, isV1Graduate, V1_COMPLETE_DESC, V1_COMPLETE_TITLE } from '@/lib/v1-cap'
import { layout } from '@/lib/layout-classes'

export default function Hub() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [character, setCharacter] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([])
  const RACE_ICONS: Record<string, string> = {
    human: '🧙', elf: '🧝', dwarf: '⛏️', orc: '👹', undead: '💀'
  }

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      }, { onConflict: 'id' })
      setUser(user)

      const { data: ch } = await supabase.from('characters').select('name, race').eq('user_id', user.id).single()
      if (!ch) { router.push('/create-character'); return }
      setCharacter(ch)

      const { data: ud } = await supabase
        .from('users')
        .select('xp, level, gold, glory, streak, last_visit, quest_first_dungeon, total_answers, onboarding_done, onboarding_step, visited_college, visited_training, visited_guild, visited_grimoire, visited_shop, visited_skills')
        .eq('id', user.id)
        .single()
      setUserData(ud)

      if (ud && !ud.onboarding_done) setShowOnboarding(true)

      if (ud) {
        const today = todayIso()
        const lastVisit = ud.last_visit
        let freshUd = ud
        if (lastVisit !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const newStreak = lastVisit === yesterday ? (ud.streak || 0) + 1 : 1
          await supabase.from('users').update({ last_visit: today, streak: newStreak }).eq('id', user.id)
          freshUd = { ...ud, streak: newStreak, last_visit: today }
          setUserData(freshUd)
        }

        const { data: runsToday } = await supabase
          .from('dungeon_runs')
          .select('result, created_at')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)

        const { count: answersToday } = await supabase
          .from('question_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)

        const built = buildHubDailyQuests(answersToday || 0, runsToday || [], freshUd.last_visit)
        const rewards = await syncQuestRewards(supabase, user.id)
        if (rewards.xpDelta > 0) {
          freshUd = { ...freshUd, xp: (freshUd.xp ?? 0) + rewards.xpDelta }
        }
        if (rewards.gloryDelta > 0) {
          freshUd = { ...freshUd, glory: (freshUd.glory ?? 0) + rewards.gloryDelta }
        }
        if (rewards.goldDelta > 0) {
          freshUd = { ...freshUd, gold: (freshUd.gold ?? 0) + rewards.goldDelta }
        }
        if (rewards.xpDelta > 0 || rewards.gloryDelta > 0 || rewards.goldDelta > 0) {
          setUserData(freshUd)
        }
        setDailyQuests(withHubClaimed(built, rewards.claims))
      }
    }
    getUser()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Загрузка...
    </div>
  )

  const level = userData?.level || 1
  const xpThresholds = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400]
  const xpToNext = [100, 150, 250, 400, 500, 600, 700, 800, 900, 1000, 1100]
  const xpBase = xpThresholds[level - 1] || 0
  const xpNext = xpToNext[level - 1] || 100
  const xpCurrent = Math.max(0, (userData?.xp || 0) - xpBase)
  const examReady = xpCurrent >= xpNext
  const v1Done = isV1Graduate(level)
  const showExamCta = canTakeExam(level, examReady)
  const onboardCtx = {
    onboarding_step: userData?.onboarding_step || 0,
    quest_first_dungeon: !!userData?.quest_first_dungeon,
    level,
    visited_skills: !!userData?.visited_skills,
    visited_training: !!userData?.visited_training,
    visited_guild: !!userData?.visited_guild,
    visited_college: !!userData?.visited_college,
    onboarding_done: !!userData?.onboarding_done,
  }
  const nextCoreStep = currentCoreOnboardingStep(onboardCtx)
  const coreDone = coreOnboardingProgress(onboardCtx)
  const nextStep = currentOnboardingStep(onboardCtx)
  const onboardDone = onboardingProgress(onboardCtx)
  const coreQuestActive = coreDone < CORE_ONBOARDING_STEPS.length
  const levelPlan = currentLevelPlan(level)
  const nextPlan = nextLevelPlan(level)

  return (
    <div className={layout.hub}>

      {/* ЛЕВЫЙ САЙДБАР */}
      <div className={layout.sidebarL} style={{ background: '#111318', borderRight: '1px solid rgba(201,168,76,0.2)', padding: '1.5rem 1.25rem' }}>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          Персонаж
        </div>

        <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '11px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(123,108,255,0.13)', border: '1px solid rgba(123,108,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {RACE_ICONS[character?.race] || '🧙'}
            </div>
            <div>
              <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0' }}>{character?.name || 'Аркан'}</div>
              <div style={{ fontSize: '11px', color: '#a99fff', marginTop: '1px', fontFamily: 'monospace' }}>СТРАНСТВУЮЩИЙ МАГ</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', marginBottom: '4px' }}>
            <span>УРОВЕНЬ {level}</span>
            <span>{xpCurrent} / {xpNext}</span>
          </div>
          <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: examReady ? '#e0bc6a' : '#7b6cff', borderRadius: '2px', width: `${Math.min((xpCurrent / xpNext) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          Ресурсы
        </div>
        <div style={{ fontSize: '10px', color: '#5a5670', fontStyle: 'italic', marginBottom: '10px', lineHeight: 1.5 }}>
          ⭐ слава — данжи (кошелёк) · репутация — ранг · 💰 золото — лавка
        </div>
        {[['💰', 'Золото', userData?.gold || '0'], ['📜', 'Свитки', '0'], ['🧪', 'Зелья', '0'], ['⭐', 'Слава', userData?.glory || '0']].map(([icon, name, val]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon}</span>{name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a' }}>{val}</div>
          </div>
        ))}

        <div className="lf-sidebar-nav">
          <AppNav step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />
        </div>

        <div onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', fontSize: '14px', color: '#5a5670', cursor: 'pointer', marginTop: '8px' }}>
          <span>🚪</span>Выйти
        </div>
        <div onClick={async () => {
          if (!confirm('Сбросить весь прогресс? Это нельзя отменить.')) return
          if (!user?.id) return
          const { ok, errors } = await resetUserProgress(supabase, user.id)
          if (!ok) {
            alert('Не удалось полностью сбросить прогресс:\n' + errors.join('\n'))
            return
          }
          await supabase.auth.signOut()
          router.push('/')
        }} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', fontSize: '13px', color: '#3a3650', cursor: 'pointer', marginTop: '4px' }}>
          <span>🔄</span>Сбросить прогресс
        </div>
      </div>

      {/* ЦЕНТР */}
      <div className={`${layout.main} lf-main`} style={{ background: '#0b0c10' }}>
        <div style={{ marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>База</div>
              <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a' }}>Твой Хаб</div>
              <div style={{ fontSize: '14px', color: '#5a5670', marginTop: '4px' }}>
                Привет, {user.user_metadata?.full_name || user.email}
              </div>
            </div>
            <div
              onClick={() => setShowGuide(true)}
              style={{ padding: '8px 14px', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', cursor: 'pointer', background: 'rgba(201,168,76,0.08)', whiteSpace: 'nowrap' }}
            >
              📖 Справка
            </div>
          </div>
        </div>

        {coreQuestActive && nextCoreStep && (
          <div style={{ background: 'linear-gradient(135deg, rgba(123,108,255,0.12), rgba(201,168,76,0.08))', border: '1px solid rgba(123,108,255,0.35)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', letterSpacing: '0.15em', marginBottom: '10px' }}>
              СТАРТОВЫЙ КВЕСТ · {coreDone} / {CORE_ONBOARDING_STEPS.length}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {CORE_ONBOARDING_STEPS.map((step, i) => {
                const done = step.check(onboardCtx)
                const active = step.id === nextCoreStep.id
                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      border: `1px solid ${done ? 'rgba(61,184,122,0.5)' : active ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      background: done ? 'rgba(61,184,122,0.15)' : active ? 'rgba(201,168,76,0.12)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                    }}>
                      {done ? '✓' : step.icon}
                    </div>
                    {i < CORE_ONBOARDING_STEPS.length - 1 && (
                      <div style={{ width: '20px', height: '1px', background: done ? 'rgba(61,184,122,0.35)' : 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                )
              })}
            </div>
            <div onClick={() => router.push(nextCoreStep.href)}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <div style={{ fontSize: '28px' }}>{nextCoreStep.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '3px' }}>{nextCoreStep.title}</div>
                <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>{nextCoreStep.desc}</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff' }}>→</div>
            </div>
          </div>
        )}

        {!coreQuestActive && nextStep && onboardDone < ONBOARDING_STEPS.length && (
          <div onClick={() => router.push(nextStep.href)}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '24px' }}>{nextStep.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.15em', marginBottom: '4px' }}>
                ДАЛЬШЕ · {onboardDone + 1} / {ONBOARDING_STEPS.length}
              </div>
              <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0', marginBottom: '3px' }}>{nextStep.title}</div>
              <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>{nextStep.desc}</div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>→</div>
          </div>
        )}

        {/* Кнопка экзамена / финал v1 */}
        {v1Done && (
          <div style={{ background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.35)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏁</div>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#3db87a', marginBottom: '6px' }}>{V1_COMPLETE_TITLE}</div>
            <div style={{ fontSize: '12px', color: '#9590a8', lineHeight: 1.65, fontStyle: 'italic' }}>{V1_COMPLETE_DESC}</div>
          </div>
        )}

        {showExamCta && (
          <div onClick={() => router.push(`/exam?level=${level}`)}
            style={{ background: 'rgba(224,188,106,0.08)', border: '1px solid rgba(224,188,106,0.4)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '28px' }}>🎓</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e0bc6a', marginBottom: '3px' }}>Готов к экзамену!</div>
              <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>Достаточно опыта для перехода на уровень {level + 1}</div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a' }}>→</div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '12px' }}>
          Ветки знаний<div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
        </div>

        <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '8px', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#171920', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>∑</div>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '5px' }}>Математика</div>
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '7px' }}>
              {v1Done ? 'Арифметика v1 ✓ · дальше — практика и мастерство' : 'Арифметика → Алгебра (скоро)'}
            </div>
            <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
              <div style={{ height: '100%', background: '#c9a84c', borderRadius: '2px', width: `${Math.min((xpCurrent / xpNext) * 100, 100)}%` }}></div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>Ур.{level} · {userData?.total_answers || 0} ответов дано</div>
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#c9a84c', textAlign: 'right' }}>{level}<div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#5a5670' }}>уровень</div></div>
        </div>

        <div style={{ background: '#1a1610', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '12px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.15em', marginBottom: '8px' }}>ПУТЬ УРОВНЯ {level}</div>
          <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e0bc6a', marginBottom: '8px' }}>{levelPlan.title}</div>
          <div style={{ fontSize: '12px', color: '#9590a8', lineHeight: 1.65, marginBottom: '10px' }}>
            {levelPlan.competencies.slice(0, 2).map(c => (
              <div key={c} style={{ marginBottom: '4px' }}>· {c}</div>
            ))}
          </div>
          {v1Done ? (
            <div style={{ fontSize: '11px', color: '#3db87a', fontStyle: 'italic' }}>
              Курс арифметики v1 пройден. Экзамен V — в следующем обновлении.
            </div>
          ) : nextPlan && (
            <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic' }}>
              До ур. {nextPlan.level} «{nextPlan.title}»: {examReady ? 'готов к экзамену' : `${xpNext - xpCurrent} XP`}
            </div>
          )}
        </div>

        <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '20px', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '12px', alignItems: 'center', opacity: 0.4 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#171920', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚡</div>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '5px' }}>Физика</div>
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>Открывается на Ур.3 математики</div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', background: '#171920', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>🔒 Заперто</div>
        </div>
      </div>

      {/* ПРАВЫЙ САЙДБАР */}
      <div className={layout.sidebarR} style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          Серия
        </div>
        <div style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '28px' }}>🔥</div>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '36px', color: '#e0bc6a', lineHeight: 1 }}>{userData?.streak || 0}</div>
            <div style={{ fontSize: '12px', color: '#5a5670', fontFamily: 'monospace' }}>ДНЕЙ ПОДРЯД</div>
          </div>
        </div>

        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          Квесты дня
        </div>
        {dailyQuests.map((q) => (
          <div key={q.id} style={{ background: '#1c1f2a', border: `1px solid ${q.claimed ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', color: q.claimed ? '#e0bc6a' : '#e6e2f0', marginBottom: '5px' }}>
              {q.claimed ? '⭐ ' : q.done ? '✓ ' : ''}{q.title}
            </div>
            {!q.claimed && (
              <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                <div style={{ height: '100%', background: q.done ? '#c9a84c' : '#2dd9b8', borderRadius: '2px', width: `${(q.prog / q.total) * 100}%` }}></div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>
              <span>{q.claimed ? 'Награда получена' : q.done ? '✓ Выполнено' : `${q.prog} / ${q.total}`}</span>
              <span style={{ color: '#e0bc6a' }}>{q.claimed ? 'получено' : q.reward}</span>
            </div>
          </div>
        ))}
      </div>

      <GuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        title="Как учиться в LoreForge"
        subtitle="ТЕТРАДЬ · ТЕОРИЯ · ТРЕНАЖЁР"
        sections={HUB_GUIDE_SECTIONS}
        icon="📓"
      />

      {/* ОНБОРДИНГ */}
      {showOnboarding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>🏰</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '4px' }}>
                Добро пожаловать, {character?.name || 'авантюрист'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>
                ЗНАНИЕ ЕСТЬ СИЛА
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Ты в LoreForge — RPG, где математика это оружие. Начни с трёх шагов:
              <br/><br/>
              <span style={{ color: '#3db87a' }}>1. 🏋️ Тренировка</span> — разомнись без риска. Ошибки не убивают.
              <br/><br/>
              <span style={{ color: '#a99fff' }}>2. 🏛️ Гильдия</span> — выбери данж и подготовься к бою.
              <br/><br/>
              <span style={{ color: '#e0bc6a' }}>3. ⚔️ Первый данж</span> — победи монстра в Пещере сложения.
              <br/><br/>
              Коллегия и способности — когда захочешь глубже. Навигация слева.
            </div>
            <div onClick={async () => { setShowOnboarding(false); setShowGuide(true); await supabase.from('users').update({ onboarding_done: true }).eq('id', user?.id) }}
              style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#e0bc6a', cursor: 'pointer', marginBottom: '8px' }}>
              Понял, начинаем →
            </div>
            <div onClick={() => setShowGuide(true)}
              style={{ width: '100%', padding: '10px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', cursor: 'pointer' }}>
              📖 Открыть полную справку
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
