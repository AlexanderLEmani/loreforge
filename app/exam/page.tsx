'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { SKILL_POINTS_PER_LEVEL } from '@/lib/skill-points'
import { mergeWithFallback } from '@/lib/fallback-questions'
import { dungeonsForExam, examConfigForLevel } from '@/lib/exam-config'
import { answersMatch, sanitizeAnswerInput } from '@/lib/scroll-display'
import {
  isValidExamLevel,
  V1_COMPLETE_DESC,
  V1_COMPLETE_TITLE,
  V1_GRADUATE_PLAYER_LEVEL,
  V1_MAX_EXAM_LEVEL,
} from '@/lib/v1-cap'

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400]

function ExamContent() {
  const router = useRouter()
  const supabase = createClient()
  const params = useSearchParams()
  const examLevel = parseInt(params.get('level') || '1')

  const [questions, setQuestions] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [phase, setPhase] = useState<'intro' | 'exam' | 'result'>('intro')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inputAnswer, setInputAnswer] = useState('')
  const [finalCorrect, setFinalCorrect] = useState(0)
  const [finalPassed, setFinalPassed] = useState(false)
  const [skillPointsEarned, setSkillPointsEarned] = useState(0)

  const examCfg = examConfigForLevel(examLevel)
  const examAllowed = isValidExamLevel(examLevel) && examCfg

  useEffect(() => {
    async function load() {
      if (!examAllowed) {
        setLoading(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const dungeons = dungeonsForExam(examLevel)
      let allQ: any[] = []
      for (const d of dungeons) {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .eq('dungeon_name', d)
          .limit(40)
        allQ = [...allQ, ...mergeWithFallback(d, data || [])]
      }

      const shuffled = allQ.sort(() => Math.random() - 0.5).slice(0, 10)
      setQuestions(shuffled)
      setLoading(false)
    }
    load()
  }, [examLevel, examAllowed])

  const q = questions[current]

  function v1BlockedScreen() {
    return (
      <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '1rem' }}>🏁</div>
          <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '10px' }}>{V1_COMPLETE_TITLE}</div>
          <div style={{ fontSize: '14px', color: '#9590a8', lineHeight: 1.7, marginBottom: '1.5rem' }}>{V1_COMPLETE_DESC}</div>
          <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic', marginBottom: '1.5rem' }}>
            Экзамены I–IV — весь курс v1. Экзамен V появится в следующем обновлении.
          </div>
          <div onClick={() => router.push('/hub')} style={{ padding: '14px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', color: '#e0bc6a', cursor: 'pointer' }}>
            → В хаб
          </div>
        </div>
      </div>
    )
  }

  async function handleAnswerText() {
    if (selected !== null || !inputAnswer.trim() || !q) return
    const correct = answersMatch(inputAnswer, q.answers[q.correct_index])
    setSelected(correct ? 'correct' : 'wrong')
    setInputAnswer('')
    const newAnswers = [...answers, correct]

    setTimeout(() => {
      setSelected(null)
      if (current + 1 >= questions.length) {
        finishExam(newAnswers)
      } else {
        setCurrent(c => c + 1)
        setAnswers(newAnswers)
      }
    }, 1000)
  }

  async function finishExam(finalAnswers: boolean[]) {
    const correctCount = finalAnswers.filter(Boolean).length
    const total = finalAnswers.length
    const passed = correctCount >= Math.ceil(total * 0.8)

    setAnswers(finalAnswers)
    setFinalCorrect(correctCount)
    setFinalPassed(passed)
    setPhase('result')

    if (passed && user) {
      const { data: ud } = await supabase
        .from('users')
        .select('skill_points, level')
        .eq('id', user.id)
        .single()
      const currentLevel = ud?.level ?? 1
      const targetLevel = Math.min(examLevel + 1, V1_GRADUATE_PLAYER_LEVEL)
      if (currentLevel < targetLevel) {
        const newXP = XP_THRESHOLDS[targetLevel - 1] || 0
        const newSkillPoints = (ud?.skill_points ?? 0) + SKILL_POINTS_PER_LEVEL
        setSkillPointsEarned(SKILL_POINTS_PER_LEVEL)
        await supabase.from('users').update({
          level: targetLevel,
          xp: newXP,
          skill_points: newSkillPoints,
        }).eq('id', user.id)
      }
    }
  }

  if (loading) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Готовим экзамен...
    </div>
  )

  if (!examAllowed) return v1BlockedScreen()

  // ИНТРО
  if (phase === 'intro') return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '1.5rem' }}>🏛️</div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.3em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '12px' }}>
          Коллегия Магов · Экзамен
        </div>
        <h1 style={{ fontFamily: 'serif', fontSize: '30px', color: '#e0bc6a', marginBottom: '12px', fontWeight: 'normal' }}>
          Экзамен: {examCfg.title}
        </h1>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff', marginBottom: '16px' }}>
          Уровень {examLevel} → {examLevel + 1} · {examCfg.topicsLabel}
        </div>
        <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ fontSize: '32px', flexShrink: 0 }}>🧙‍♂️</div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', marginBottom: '6px' }}>ПРОФЕССОР ГОРУС</div>
              <div style={{ fontSize: '14px', color: '#c8c0d8', fontStyle: 'italic', lineHeight: 1.6 }}>
                "{examCfg.gorusIntro} {questions.length} вопросов. Нужно {Math.ceil(questions.length * 0.8)} правильных. Вводишь ответ сам."
              </div>
              <div style={{ fontSize: '12px', color: '#5a5670', marginTop: '10px', fontStyle: 'italic' }}>
                {examCfg.passHint}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '1rem' }}>
            {[
              ['📝', `${questions.length} вопросов`],
              ['✅', `Нужно ${Math.ceil(questions.length * 0.8)}/${questions.length}`],
              ['🚫', 'Без подсказок'],
              ['🎓', `Уровень ${examLevel + 1} при успехе`],
              ['✦', `+${SKILL_POINTS_PER_LEVEL} очка способностей`],
            ].map(([icon, text]) => (
              <div key={text as string} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#171920', borderRadius: '7px', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
                <span>{icon as string}</span>{text as string}
              </div>
            ))}
          </div>
        </div>
        <div onClick={() => setPhase('exam')} style={{ padding: '16px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', fontFamily: 'serif', fontSize: '18px', color: '#e0bc6a', cursor: 'pointer', marginBottom: '10px' }}>
          Начать экзамен →
        </div>
        <div onClick={() => router.push('/college')} style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#5a5670', cursor: 'pointer' }}>
          ← Вернуться к лекции
        </div>
      </div>
    </div>
  )

  // РЕЗУЛЬТАТ
  if (phase === 'result') return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '1rem' }}>{finalPassed ? '🎓' : '💀'}</div>
        <div style={{ fontFamily: 'serif', fontSize: '32px', color: finalPassed ? '#e0bc6a' : '#e05555', marginBottom: '8px' }}>
          {finalPassed ? 'Экзамен сдан!' : 'Провал'}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#9590a8', marginBottom: '2rem' }}>
          {finalCorrect} / {answers.length} правильных ответов
        </div>

        <div style={{ background: '#1c1f2a', border: `1px solid ${finalPassed ? 'rgba(201,168,76,0.3)' : 'rgba(224,85,85,0.3)'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', textAlign: 'left' }}>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>🧙‍♂️</div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e0bc6a', marginBottom: '6px' }}>ПРОФЕССОР ГОРУС</div>
            <div style={{ fontSize: '14px', color: '#c8c0d8', fontStyle: 'italic', lineHeight: 1.6 }}>
              {finalPassed
                ? examLevel === V1_MAX_EXAM_LEVEL
                  ? `"${finalCorrect} из ${answers.length}. На этот раз без сарказма: арифметика v1 закрыта. От «два плюс два» до процентов — целиком. Дальше твой путь: данжи, тренировка, мастерство. Смешанные действия и алгебра — другая книга."`
                  : `"${finalCorrect} из ${answers.length}. Неплохо. Не скажу что впечатлён, но уровень ${examLevel + 1} ты заслужил. Иди. Тебя ждут более серьёзные задачи."`
                : `"${finalCorrect} из ${answers.length}. Позорище. Ты называешь это магией? Иди тренируйся. Вернёшься когда будешь готов."`
              }
            </div>
          </div>
        </div>

        {finalPassed && (
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', marginBottom: '4px' }}>ПОЛУЧЕНО</div>
            <div style={{ fontSize: '16px', color: '#e6e2f0' }}>
              {examLevel === V1_MAX_EXAM_LEVEL
                ? '🏁 Арифметика v1 завершена · выпускник'
                : `🎓 Уровень ${examLevel + 1} разблокирован`}
            </div>
            {skillPointsEarned > 0 && (
              <div style={{ fontSize: '16px', color: '#a99fff' }}>✦ +{skillPointsEarned} очка способностей</div>
            )}
          </div>
        )}

        <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>Результаты</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {answers.map((a, i) => (
              <div key={i} style={{ width: '32px', height: '32px', borderRadius: '6px', background: a ? 'rgba(61,184,122,0.15)' : 'rgba(224,85,85,0.15)', border: `1px solid ${a ? 'rgba(61,184,122,0.4)' : 'rgba(224,85,85,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '14px', color: a ? '#3db87a' : '#e05555' }}>
                {a ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {!finalPassed && (
            <div onClick={() => { setPhase('intro'); setCurrent(0); setAnswers([]); setFinalCorrect(0); setFinalPassed(false) }}
              style={{ padding: '14px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a', cursor: 'pointer', textAlign: 'center' }}>
              Попробовать снова
            </div>
          )}
          <div onClick={() => router.push('/hub')}
            style={{ padding: '14px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#5a5670', cursor: 'pointer', textAlign: 'center', gridColumn: finalPassed ? '1 / -1' : 'auto' }}>
            {finalPassed ? '→ В хаб' : '← В хаб'}
          </div>
        </div>
      </div>
    </div>
  )

  // ЭКЗАМЕН
  const progress = (current / questions.length) * 100

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>
      <div style={{ height: '3px', background: '#171920' }}>
        <div style={{ height: '100%', background: '#e0bc6a', width: `${progress}%`, transition: 'width 0.4s' }}></div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
            Вопрос {current + 1} из {questions.length}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: questions.length }).map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < answers.length ? (answers[i] ? '#3db87a' : '#e05555') : i === current ? '#e0bc6a' : '#2a2d3a' }}></div>
            ))}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#3db87a' }}>
            {answers.filter(Boolean).length} верно
          </div>
        </div>

        <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '14px', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)' }}></div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginBottom: '12px', letterSpacing: '0.15em' }}>ЭКЗАМЕН · УРОВЕНЬ {examLevel}</div>
          <div style={{ fontFamily: 'serif', fontSize: '48px', color: '#e6e2f0', lineHeight: 1.1 }}>{q.question}</div>
        </div>

        {selected === null ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              inputMode="text"
              autoFocus
              value={inputAnswer}
              onChange={e => setInputAnswer(sanitizeAnswerInput(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleAnswerText()}
              placeholder={examLevel === 3 ? '2/3, ½ или 0…' : 'Введи ответ…'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              style={{ flex: 1, background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '16px', fontSize: '28px', color: '#e6e2f0', fontFamily: 'serif', outline: 'none', textAlign: 'center' }}
            />
            <div onClick={handleAnswerText} style={{ padding: '16px 24px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', fontSize: '20px', cursor: 'pointer', color: '#e0bc6a', display: 'flex', alignItems: 'center' }}>✓</div>
          </div>
        ) : (
          <div style={{ padding: '20px', background: selected === 'correct' ? 'rgba(61,184,122,0.08)' : 'rgba(224,85,85,0.08)', border: `1px solid ${selected === 'correct' ? 'rgba(61,184,122,0.4)' : 'rgba(224,85,85,0.4)'}`, borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '28px', color: selected === 'correct' ? '#3db87a' : '#e05555' }}>
            {selected === 'correct' ? '✓ Верно' : `✗ Правильно: ${q.answers[q.correct_index]}`}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExamPage() {
  return <Suspense><ExamContent /></Suspense>
}
