'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { resetUserProgress } from '@/lib/reset-progress'
import { useRouter } from 'next/navigation'
import AppNav from '@/components/AppNav'
import { currentOnboardingStep, onboardingProgress, ONBOARDING_STEPS } from '@/lib/onboarding-quest'
import { currentLevelPlan, nextLevelPlan } from '@/lib/curriculum'
import { HUB_GUIDE_SECTIONS } from '@/lib/hub-guide'
import GuideModal from '@/components/GuideModal'
import { navUnlockFromUser } from '@/lib/nav-unlock'
import { buildHubDailyQuests, type DailyQuest } from '@/lib/daily-quests'
import { todayIso } from '@/lib/guild-quests'

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
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
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

        setDailyQuests(buildHubDailyQuests(answersToday || 0, runsToday || [], freshUd.last_visit))
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
  const onboardCtx = {
    onboarding_step: userData?.onboarding_step || 0,
    quest_first_dungeon: !!userData?.quest_first_dungeon,
    level,
    visited_skills: !!userData?.visited_skills,
    onboarding_done: !!userData?.onboarding_done,
  }
  const nextStep = currentOnboardingStep(onboardCtx)
  const onboardDone = onboardingProgress(onboardCtx)
  const levelPlan = currentLevelPlan(level)
  const nextPlan = nextLevelPlan(level)

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'grid', gridTemplateColumns: '260px 1fr 280px' }}>

      {/* ЛЕВЫЙ САЙДБАР */}
      <div style={{ background: '#111318', borderRight: '1px solid rgba(201,168,76,0.2)', padding: '1.5rem 1.25rem' }}>
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
        {[['💰', 'Золото', userData?.gold || '0'], ['📜', 'Свитки', '0'], ['🧪', 'Зелья', '0'], ['⭐', 'Слава', userData?.glory || '0']].map(([icon, name, val]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon}</span>{name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a' }}>{val}</div>
          </div>
        ))}

        <AppNav step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

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
      <div style={{ padding: '1.75rem 2rem', background: '#0b0c10' }}>
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

        {nextStep && onboardDone < ONBOARDING_STEPS.length && (
          <div onClick={() => router.push(nextStep.href)}
            style={{ background: 'linear-gradient(135deg, rgba(123,108,255,0.12), rgba(201,168,76,0.08))', border: '1px solid rgba(123,108,255,0.35)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '28px' }}>{nextStep.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', letterSpacing: '0.15em', marginBottom: '4px' }}>
                КВЕСТ {onboardDone + 1} / {ONBOARDING_STEPS.length}
              </div>
              <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '3px' }}>{nextStep.title}</div>
              <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>{nextStep.desc}</div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff' }}>→</div>
          </div>
        )}

        {/* Кнопка экзамена */}
        {examReady && (
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
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '7px' }}>Арифметика → Алгебра → Тригонометрия → Мат.анализ</div>
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
          {nextPlan && (
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
      <div style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>
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
          <div key={q.id} style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', color: '#e6e2f0', marginBottom: '5px' }}>{q.title}</div>
            <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{ height: '100%', background: q.done ? '#c9a84c' : '#2dd9b8', borderRadius: '2px', width: `${(q.prog / q.total) * 100}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>
              <span>{q.done ? '✓ Выполнено' : `${q.prog} / ${q.total}`}</span>
              <span style={{ color: '#e0bc6a' }}>{q.reward}</span>
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
              Ты попал в LoreForge — обучающий RPG где математика это твоё оружие.
              <br/><br/>
              <span style={{ color: '#a99fff' }}>🏛️ Начни с Коллегии</span> — прослушай лекцию профессора Горуса и узнай зачем вообще нужна математика.
              <br/><br/>
              <span style={{ color: '#3db87a' }}>🏋️ Потренируйся в Зале</span> — здесь можно практиковаться без риска. Ошибки не убивают.
              <br/><br/>
              <span style={{ color: '#e0bc6a' }}>⚔️ Иди в Гильдию</span> — выбери данж, сразись с монстрами и зарабатывай очки славы.
              <br/><br/>
              Навигация слева. Удачи.
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
