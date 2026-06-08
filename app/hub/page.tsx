'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Hub() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)


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
      const { data: ud } = await supabase
        .from('users')
        .select('xp, level, gold, streak, last_visit, quest_first_dungeon, total_answers')
        .eq('id', user.id)
        .single()
    setUserData(ud)
    // Обновляем стрик
    if (ud) {
        const today = new Date().toISOString().split('T')[0]
        const lastVisit = ud.last_visit
  
    if (lastVisit !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const newStreak = lastVisit === yesterday ? (ud.streak || 0) + 1 : 1
    
        await supabase.from('users').update({
        last_visit: today,
        streak: newStreak,
    }).eq('id', user.id)

    setUserData({ ...ud, streak: newStreak, last_visit: today })
  }
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

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'grid', gridTemplateColumns: '260px 1fr 280px' }}>

      {/* ЛЕВЫЙ САЙДБАР */}
      <div style={{ background: '#111318', borderRight: '1px solid rgba(201,168,76,0.2)', padding: '1.5rem 1.25rem' }}>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          Персонаж
        </div>

        {/* Карточка персонажа */}
        <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '11px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(123,108,255,0.13)', border: '1px solid rgba(123,108,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🧙
            </div>
            <div>
              <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0' }}>Аркан</div>
              <div style={{ fontSize: '11px', color: '#a99fff', marginTop: '1px', fontFamily: 'monospace' }}>СТРАНСТВУЮЩИЙ МАГ</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', marginBottom: '4px' }}>
<span>УРОВЕНЬ {userData?.level || 1}</span>
<span>{Math.max(0, (userData?.xp || 0) - ([0,100,250,500,900,1400,2000,2700,3500,4400,5400][(userData?.level||1)-1]||0))} / {[100,150,250,400,500,600,700,800,900,1000,1100][(userData?.level||1)-1]||1100}</span>          </div>
          <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#7b6cff', borderRadius: '2px', width: `${Math.min((Math.max(0, (userData?.xp || 0) - ([0,100,250,500,900,1400,2000,2700,3500,4400][(userData?.level||1)-1]||0)) / ([100,150,250,400,500,600,700,800,900,1000,1100][(userData?.level||1)-1]||1100)) * 100, 100)}%`
 }}></div>
          </div>
        </div>

        {/* Ресурсы */}
        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          Ресурсы
        </div>
        {[['💰', 'Золото', userData?.gold || '0'], ['📜', 'Свитки', '0'], ['🧪', 'Зелья', '0'], ['⭐', 'Слава', '0']].map(([icon, name, val]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon}</span>{name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a' }}>{val}</div>
          </div>
        ))}

        {/* Навигация */}
        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>
          Навигация
        </div>
        {[['🏰', 'Хаб', true], ['⚔️', 'В данж', false], ['🗺️', 'Карта мира', false], ['📖', 'Гримуар', false], ['🛒', 'Лавка', false]].map(([icon, label, active]) => (
          <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '7px', fontSize: '14px', color: active ? '#a99fff' : '#5a5670', background: active ? 'rgba(123,108,255,0.13)' : 'transparent', borderLeft: active ? '2px solid #7b6cff' : '2px solid transparent', cursor: 'pointer', marginBottom: '3px' }}>
            <span style={{ width: '18px', textAlign: 'center' }}>{icon as string}</span>{label as string}
          </div>
        ))}

        <div onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', fontSize: '14px', color: '#5a5670', cursor: 'pointer', marginTop: '8px' }}>
          <span>🚪</span>Выйти
        </div>
      </div>

      {/* ЦЕНТР */}
      <div style={{ padding: '1.75rem 2rem', background: '#0b0c10' }}>
        <div style={{ marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>База</div>
          <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a' }}>Твой Хаб</div>
          <div style={{ fontSize: '14px', color: '#5a5670', marginTop: '4px' }}>
            Привет, {user.user_metadata?.full_name || user.email}
          </div>
        </div>

        {/* Ветки знаний */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '12px' }}>
          Ветки знаний<div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
        </div>

        {/* Математика */}
        <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '8px', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#171920', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>∑</div>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '5px' }}>Математика</div>
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '7px' }}>Арифметика → Алгебра → Тригонометрия → Мат.анализ</div>
            <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
              <div style={{ height: '100%', background: '#c9a84c', borderRadius: '2px', width: '0%' }}></div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>Ур.1 · Начало пути</div>
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#c9a84c', textAlign: 'right' }}>1<div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#5a5670' }}>уровень</div></div>
        </div>

        {/* Физика — заблокирована */}
        <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '20px', display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '12px', alignItems: 'center', opacity: 0.4 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#171920', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚡</div>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0', marginBottom: '5px' }}>Физика</div>
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>Открывается на Ур.3 математики</div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', background: '#171920', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>🔒 Заперто</div>
        </div>

        {/* Данжи */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '12px' }}>
          Данжи<div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { icon: '🔢', name: 'Пещера сложения', tag: 'Математика · Ур.1', desc: 'Сложение и вычитание до 100. Первый данж.', color: '#c9a84c' },
            { icon: '✕', name: 'Башня умножения', tag: 'Математика · Ур.2', desc: 'Таблица умножения. Открывается на Ур.2.', color: '#5a5670', locked: true },
          ].map((d) => (
            <div key={d.name} onClick={() => !d.locked && router.push('/battle')} style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem', cursor: d.locked ? 'default' : 'pointer', opacity: d.locked ? 0.4 : 1, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: d.locked ? '#5a5670' : d.color }}></div>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{d.icon}</div>
              <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0', marginBottom: '4px' }}>{d.name}</div>
              <div style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', border: `1px solid ${d.locked ? '#5a5670' : 'rgba(201,168,76,0.3)'}`, color: d.locked ? '#5a5670' : '#c9a84c', background: d.locked ? 'transparent' : 'rgba(201,168,76,0.06)', marginBottom: '6px' }}>{d.tag}</div>
              <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.4 }}>{d.desc}</div>
            </div>
          ))}
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
            <div style={{ fontFamily: 'serif', fontSize: '36px', color: '#e0bc6a', lineHeight: 1 }}>{userData?.streak || 0}
</div>
            <div style={{ fontSize: '12px', color: '#5a5670', fontFamily: 'monospace' }}>ДНЕЙ ПОДРЯД</div>
          </div>
        </div>

        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          Квесты дня
        </div>
        {[{ title: 'Пройти первый данж', prog: userData?.quest_first_dungeon ? 1 : 0, total: 1, xp: '+50 XP', done: !!userData?.quest_first_dungeon },
          
          { title: 'Ответить на 10 вопросов', prog: Math.min(userData?.total_answers || 0, 10), total: 10, xp: '+30 XP', done: (userData?.total_answers || 0) >= 10 },
          { title: 'Войти в игру', prog: 1, total: 1, xp: '+10 XP', done: true },
        ].map((q) => (
          <div key={q.title} style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', color: '#e6e2f0', marginBottom: '5px' }}>{q.title}</div>
            <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{ height: '100%', background: q.done ? '#c9a84c' : '#2dd9b8', borderRadius: '2px', width: `${(q.prog / q.total) * 100}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>
              <span>{q.done ? '✓ Выполнено' : `${q.prog} / ${q.total}`}</span>
              <span style={{ color: '#e0bc6a' }}>{q.xp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}