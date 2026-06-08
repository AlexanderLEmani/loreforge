'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Battle() {
  const router = useRouter()
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qIndex, setQIndex] = useState(0)
  const [playerHP, setPlayerHP] = useState(100)
  const [enemyHP, setEnemyHP] = useState(80)
  const [selected, setSelected] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState<string[]>([])

  useEffect(() => {
    async function loadQuestions() {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('dungeon_name', 'Пещера сложения')
        .order('question')
        .limit(5)
      if (data) setQuestions(data)
      setLoading(false)
    }
    loadQuestions()
  }, [])

  function answer(idx: number) {
    if (selected !== null || questions.length === 0) return
    setSelected(idx)
    const q = questions[qIndex]
    const correct = idx === q.correct_index

    let newMistakes = [...mistakes]
    let newEnemyHP = enemyHP
    let newPlayerHP = playerHP

    if (correct) {
      newEnemyHP = enemyHP - 25
      setEnemyHP(newEnemyHP)
      if (newEnemyHP <= 0) {
        const correctCount = questions.length - newMistakes.length
        router.push(`/debrief?result=win&score=${correctCount}&total=${questions.length}&mistakes=${encodeURIComponent(newMistakes.join('|'))}`)
        return
      }
    } else {
      newMistakes = [...mistakes, q.question]
      setMistakes(newMistakes)
      newPlayerHP = playerHP - 20
      setPlayerHP(newPlayerHP)
      if (newPlayerHP <= 0) {
        const correctCount = qIndex - (newMistakes.length - 1)
        router.push(`/debrief?result=lose&score=${correctCount}&total=${questions.length}&mistakes=${encodeURIComponent(newMistakes.join('|'))}`)
        return
      }
    }

    setTimeout(() => {
      setSelected(null)
      if (qIndex + 1 < questions.length) {
        setQIndex(qIndex + 1)
      } else {
        const correctCount = questions.length - newMistakes.length
        router.push(`/debrief?result=win&score=${correctCount}&total=${questions.length}&mistakes=${encodeURIComponent(newMistakes.join('|'))}`)
      }
    }, 900)
  }

  if (loading) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Загрузка данжа...
    </div>
  )

  if (questions.length === 0) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Вопросы не найдены
    </div>
  )

  const q = questions[qIndex]

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'grid', gridTemplateColumns: '256px 1fr' }}>

      {/* ЛЕВЫЙ САЙДБАР */}
      <div style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>
        <div style={{ background: 'rgba(224,85,85,0.11)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555' }}>Пещера сложения</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '2px' }}>ВОПРОС {qIndex + 1} ИЗ {questions.length}</div>
        </div>

        <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>Заклинания</div>
        {[['➕', 'Удар сложения', '20 дмг', true], ['✕', 'Вихрь умножения', '🔒 Ур.2', false]].map(([icon, name, pow, active]) => (
          <div key={name as string} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', background: active ? 'rgba(201,168,76,0.12)' : '#1c1f2a', border: `1px solid ${active ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '7px', marginBottom: '5px', opacity: active ? 1 : 0.4 }}>
            <div style={{ width: '28px', height: '28px', background: '#171920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>{icon as string}</div>
            <div style={{ flex: 1, fontSize: '12px', color: '#e6e2f0' }}>{name as string}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a' }}>{pow as string}</div>
          </div>
        ))}

        <div style={{ marginTop: '14px', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>Инвентарь</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', color: '#9590a8' }}>
          <span>🧪 Зелья HP</span><span style={{ fontFamily: 'monospace', color: '#e6e2f0' }}>×3</span>
        </div>

        <div onClick={() => router.push('/hub')} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', fontSize: '14px', color: '#5a5670', cursor: 'pointer' }}>
          ← В хаб
        </div>
      </div>

      {/* ОСНОВНАЯ АРЕНА */}
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.1em' }}>HP</span>
            <div style={{ width: '150px', height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', background: '#3db87a', borderRadius: '3px', width: `${playerHP}%`, transition: 'width 0.3s' }}></div>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e6e2f0' }}>{playerHP} / 100</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', letterSpacing: '0.1em' }}>
            ВОПРОС {qIndex + 1} / {questions.length}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 10px', borderRadius: '10px', background: 'rgba(123,108,255,0.13)', border: '1px solid rgba(123,108,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🧙</div>
            <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e6e2f0', marginBottom: '4px' }}>Аркан</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>{playerHP}</span>
              <div style={{ width: '80px', height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#3db87a', width: `${playerHP}%`, transition: 'width 0.3s' }}></div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>100</span>
            </div>
          </div>

          <div style={{ fontFamily: 'serif', fontSize: '24px', color: '#5a5670', textAlign: 'center' }}>vs</div>

          <div style={{ background: 'rgba(224,85,85,0.03)', border: '1px solid rgba(224,85,85,0.25)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 10px', borderRadius: '10px', background: 'rgba(224,85,85,0.11)', border: '1px solid rgba(224,85,85,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>👹</div>
            <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555', marginBottom: '4px' }}>Демон сложения</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>{Math.max(0, enemyHP)}</span>
              <div style={{ width: '80px', height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#e05555', width: `${Math.max(0, (enemyHP / 80) * 100)}%`, transition: 'width 0.3s' }}></div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>80</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#1c1f2a', border: '1px solid rgba(123,108,255,0.25)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(123,108,255,0.4), transparent)' }}></div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#a99fff', textTransform: 'uppercase', marginBottom: '10px' }}>▸ Математика · Сложение</div>
          <div style={{ fontFamily: 'serif', fontSize: '38px', color: '#e6e2f0', marginBottom: '6px', lineHeight: 1.1 }}>{q.question}</div>
          <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>Правильный ответ наносит 25 урона демону</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', marginBottom: '1.25rem' }}>
          {q.answers.map((ans: string, idx: number) => {
            let bg = '#1c1f2a'
            let border = 'rgba(255,255,255,0.06)'
            let color = '#e6e2f0'
            if (selected !== null) {
              if (idx === q.correct_index) { bg = 'rgba(45,217,184,0.06)'; border = 'rgba(45,217,184,0.4)'; color = '#2dd9b8' }
              else if (idx === selected) { bg = 'rgba(224,85,85,0.06)'; border = 'rgba(224,85,85,0.35)'; color = '#e05555' }
            }
            return (
              <div key={idx} onClick={() => answer(idx)} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '22px', color, cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.18s' }}>
                {ans}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[['⚡', 'Атаковать', true], ['🛡️', 'Защититься', false], ['🧪', 'Зелье (×3)', false], ['🚪', 'Отступить', false]].map(([icon, label, primary]) => (
            <div key={label as string} onClick={label === 'Отступить' ? () => router.push('/hub') : undefined} style={{ flex: 1, padding: '11px 6px', background: primary ? 'rgba(201,168,76,0.12)' : '#1c1f2a', border: `1px solid ${primary ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>{icon as string}</div>
              <div style={{ fontSize: '12px', color: '#9590a8' }}>{label as string}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}