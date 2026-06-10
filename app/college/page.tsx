'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const SECTIONS = [
  { type: 'professor', text: 'Садитесь. Я не буду повторять дважды — последний кто попросил повторить, сейчас удобряет картошку на заднем дворе Академии.' },
  { type: 'heading', text: 'Откуда взялась математика' },
  { type: 'text', text: 'В 2300 году до нашей эры вавилонский торговец Эн-Зу хотел знать сколько баранов он продал и не хотел считать по одному — воняли. Так появилась математика. Запомните: всё великое рождается из лени и запаха.' },
  { type: 'text', text: 'Египтяне строили пирамиды без калькуляторов. Греки доказывали теоремы на песке. Персидские астрономы считали движение звёзд. Все они знали одно: кто умеет считать — тот управляет миром. Кто не умеет — копает канавы для тех кто умеет.' },
  { type: 'heading', text: 'Что математика делает с мозгом' },
  { type: 'text', text: 'Каждый раз когда вы решаете задачу — в мозге формируется новая связь. Не метафорически. Буквально. Нейроны срастаются. Это называется нейропластичность и это единственная магия которая работает по-настоящему.' },
  { type: 'quote', text: '"Числа управляют Вселенной." — Пифагор, примерно 500 лет до н.э., незадолго до того как его ученики основали тайное общество и начали поклоняться треугольникам.' },
  { type: 'text', text: 'Пифагор был странным человеком. Он запрещал есть бобы — считал что в них живут души умерших. Но в математике он разбирался. Его теорема пережила две с половиной тысячи лет и переживёт ещё столько же.' },
  { type: 'heading', text: 'Сложение и вычитание' },
  { type: 'text', text: 'Первые заклинания каждого мага. Примитивные? Да. Бесполезные? Нет. Без сложения нет умножения. Без умножения нет алгебры. Без алгебры нет тригонометрии. Без тригонометрии — нет тёмной магии. Нет тёмной магии — вы просто крестьянин с палкой.' },
  { type: 'formula', text: 'a + b = b + a', hint: 'Переместительный закон. Порядок слагаемых не меняет суммы.' },
  { type: 'formula', text: 'a − b ≠ b − a', hint: 'А вот с вычитанием так не работает. Запомните это.' },
  { type: 'text', text: 'Именно здесь большинство магов делают первую ошибку. Они думают что математика симметрична. Она не симметрична. Она жестокая, точная и не прощает небрежности. Как я.' },
  { type: 'outro', text: 'На этом первая лекция окончена. Идите в данж. Убейте что-нибудь с помощью сложения. Вернитесь живыми. Тогда поговорим об умножении.' },
]

const LECTURES = [
  { num: 'I',   title: 'Введение в арифметику', active: true,  done: false },
  { num: 'II',  title: 'Умножение и деление',   active: false, done: false },
  { num: 'III', title: 'Дроби',                 active: false, done: false },
  { num: 'IV',  title: 'Проценты',              active: false, done: false },
]

export default function CollegePage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('users').select('xp, level, gold, glory, streak, onboarding_step').eq('id', user.id).single()
      setUserData(data)
      if (data && (data.onboarding_step || 0) < 1) {
        await supabase.from('users').update({ onboarding_step: 1 }).eq('id', user.id)
        setUserData({ ...data, onboarding_step: 1 })
      }
    }
    load()
  }, [])

  const level = userData?.level || 1
  const xpThresholds = [0, 100, 250, 500, 900, 1400]
  const xpToNext = [100, 150, 250, 400, 500, 600]
  const xpBase = xpThresholds[level - 1] || 0
  const xpNext = xpToNext[level - 1] || 100
  const xpCurrent = Math.max(0, (userData?.xp || 0) - xpBase)

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
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Лекция I</div>
              <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '6px' }}>Введение в Арифметику</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff' }}>Профессор Горус · Архимаг Арифметики</div>
            </div>

            {SECTIONS.map((s, i) => {
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

            {/* Кнопка */}
            <div style={{ marginTop: '2.5rem' }}>
              <div onClick={() => setShowNext(true)}
                style={{ width: '100%', padding: '16px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '18px', color: '#e0bc6a', cursor: 'pointer' }}>
                Ознакомился →
              </div>
            </div>

          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Лекции</div>
            {LECTURES.map(l => (
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
              {[['➕', 'Сложение', '#3db87a'], ['➖', 'Вычитание', '#3db87a']].map(([icon, name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#9590a8' }}>
                  <span>{icon}</span>
                  <span style={{ flex: 1 }}>{name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: color }}>✓</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}></div>

            <div style={{ background: 'rgba(123,108,255,0.06)', border: '1px solid rgba(123,108,255,0.2)', borderRadius: '9px', padding: '10px 12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>Далее</div>
              <div style={{ fontSize: '12px', color: '#5a5670', lineHeight: 1.5 }}>Пройди данжи уровня 1 чтобы открыть Лекцию II и получить заклинания умножения.</div>
            </div>

          </div>
        </div>
      </div>

      {/* МОДАЛКА */}
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
