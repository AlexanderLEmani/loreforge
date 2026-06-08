'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

type Phase = 'choose_attack' | 'player_attack' | 'monster_attack' | 'result_flash'

const ATTACKS = [
  { id: 'light',  label: 'Кулак',        icon: '👊', desc: 'Лёгкая задача',   dmg: 15, playerDmg: 10, color: '#3db87a', difficulty: 'easy'   },
  { id: 'medium', label: 'Заклятье',     icon: '🔥', desc: 'Средняя задача',  dmg: 28, playerDmg: 20, color: '#a99fff', difficulty: 'medium' },
  { id: 'heavy',  label: 'Тёмная магия', icon: '💀', desc: 'Сложная задача',  dmg: 50, playerDmg: 35, color: '#e05555', difficulty: 'hard'   },
]

function getDifficultyPool(questions: any[], difficulty: string) {
  const filtered = questions.filter((q: any) => q.difficulty === difficulty)
  return filtered.length > 0 ? filtered : questions.filter((q: any) => q.difficulty === 'easy')
}


function BattleContent() {
  const router = useRouter()
  const supabase = createClient()
  const params = useSearchParams()
  const dungeonName = params.get('dungeon') || 'Пещера сложения'

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [phase, setPhase] = useState<Phase>('choose_attack')
  const [chosenAttack, setChosenAttack] = useState<typeof ATTACKS[0] | null>(null)
  const [currentQ, setCurrentQ] = useState<any>(null)
  const [monsterQ, setMonsterQ] = useState<any>(null)

  const [playerHP, setPlayerHP] = useState(100)
  const [enemyHP, setEnemyHP] = useState(100)
  const [selected, setSelected] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState<string[]>([])
  const [roundCount, setRoundCount] = useState(0)
  const [inputAnswer, setInputAnswer] = useState('')
  const [hardMode, setHardMode] = useState(false)
  const [confirmEscape, setConfirmEscape] = useState(false)
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set())

  // Таймер защиты
  const [timer, setTimer] = useState(15)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Флэш результата
  const [flashMsg, setFlashMsg] = useState('')
  const [flashColor, setFlashColor] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('questions').select('*').eq('dungeon_name', dungeonName).limit(30)
      if (data) setQuestions(data)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      setLoading(false)
    }
    load()
  }, [])

  // Таймер монстра
  useEffect(() => {
    if (phase !== 'monster_attack') { if (timerRef.current) clearInterval(timerRef.current); return }
    setTimer(15)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current!); handleDefend(-1, true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, monsterQ])

  function flash(msg: string, color: string, cb: () => void) {
    setFlashMsg(msg); setFlashColor(color); setPhase('result_flash')
    setTimeout(() => { setFlashMsg(''); cb() }, 900)
  }

  function chooseAttack(atk: typeof ATTACKS[0]) {
    if (questions.length === 0) return
    const pool = getDifficultyPool(questions, atk.difficulty)
const unused = pool.filter((q: any) => !usedIds.has(q.id))
const source = unused.length > 0 ? unused : pool
const q = source[Math.floor(Math.random() * source.length)]
setUsedIds(prev => new Set([...prev, q.id]))
    setChosenAttack(atk)
    setCurrentQ(q)
    setSelected(null)
    setInputAnswer('')
    setPhase('player_attack')
  }

  async function handleAttack(idx: number) {
    if (selected !== null || !currentQ || !chosenAttack) return
    if (currentUser) await supabase.rpc('increment_answers', { user_id: currentUser.id })
    setSelected(idx)
    const correct = idx === currentQ.correct_index

    let newEnemyHP = enemyHP
    let newMistakes = [...mistakes]

    if (correct) {
      newEnemyHP = Math.max(0, enemyHP - chosenAttack.dmg)
      setEnemyHP(newEnemyHP)
    } else {
      newMistakes = [...mistakes, currentQ.question]
      setMistakes(newMistakes)
    }

    setTimeout(() => {
      setSelected(null)
      if (newEnemyHP <= 0) { endBattle('win', newMistakes); return }
      // Ход монстра
      const unusedM = questions.filter((q: any) => !usedIds.has(q.id))
const mq = (unusedM.length > 0 ? unusedM : questions)[Math.floor(Math.random() * (unusedM.length > 0 ? unusedM : questions).length)]
setUsedIds(prev => new Set([...prev, mq.id]))
      setMonsterQ(mq)
      setPhase('monster_attack')
    }, 800)
  }

  async function handleAttackHard() {
    if (selected !== null || !inputAnswer || !currentQ || !chosenAttack) return
    if (currentUser) await supabase.rpc('increment_answers', { user_id: currentUser.id })
    const correct = inputAnswer.trim() === currentQ.answers[currentQ.correct_index].trim()
    setSelected(correct ? currentQ.correct_index : -1)
    setInputAnswer('')

    let newEnemyHP = enemyHP
    let newMistakes = [...mistakes]

    if (correct) {
      newEnemyHP = Math.max(0, enemyHP - chosenAttack.dmg * 1.5)
      setEnemyHP(newEnemyHP)
    } else {
      newMistakes = [...mistakes, currentQ.question]
      setMistakes(newMistakes)
    }

    setTimeout(() => {
      setSelected(null)
      if (newEnemyHP <= 0) { endBattle('win', newMistakes); return }
      const unusedM = questions.filter((q: any) => !usedIds.has(q.id))
const mq = (unusedM.length > 0 ? unusedM : questions)[Math.floor(Math.random() * (unusedM.length > 0 ? unusedM : questions).length)]
setUsedIds(prev => new Set([...prev, mq.id]))
      setMonsterQ(mq)
      setPhase('monster_attack')
    }, 800)
  }

  function handleDefend(idx: number, timeout = false) {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!monsterQ) return
    const correct = !timeout && idx === monsterQ.correct_index
    let newPlayerHP = playerHP
    let newMistakes = [...mistakes]

    if (!correct) {
      const dmg = timeout ? 30 : 20
      newPlayerHP = Math.max(0, playerHP - dmg)
      setPlayerHP(newPlayerHP)
      newMistakes = [...mistakes, monsterQ.question]
      setMistakes(newMistakes)
      flash(timeout ? '⏰ Время вышло! -' + dmg + ' HP' : '💥 Удар нанесён! -' + dmg + ' HP', '#e05555', () => {
        if (newPlayerHP <= 0) { endBattle('lose', newMistakes); return }
        setRoundCount(r => r + 1)
        setPhase('choose_attack')
      })
    } else {
      flash('🛡️ Заблокировано!', '#3db87a', () => {
        setRoundCount(r => r + 1)
        setPhase('choose_attack')
      })
    }
  }

  function endBattle(result: 'win' | 'lose', finalMistakes: string[]) {
    const score = roundCount + 1 - finalMistakes.length
    router.push(`/debrief?result=${result}&score=${Math.max(0, score)}&total=${roundCount + 1}&mistakes=${encodeURIComponent(finalMistakes.join('|'))}`)
  }

  if (loading) return <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>Загрузка данжа...</div>
  if (questions.length === 0) return <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>Вопросы не найдены</div>

  const playerHPpct = playerHP
  const enemyHPpct = Math.max(0, (enemyHP / 100) * 100)

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'grid', gridTemplateColumns: '240px 1fr' }}>

      {/* САЙДБАР */}
      <div style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(224,85,85,0.11)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555' }}>{dungeonName}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '2px' }}>РАУНД {roundCount + 1}</div>
        </div>

        <div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Атаки</div>
          {ATTACKS.map(atk => (
            <div key={atk.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: '#1c1f2a', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: '7px', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>{atk.icon}</span>
              <div style={{ flex: 1, fontSize: '12px', color: '#9590a8' }}>{atk.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: atk.color }}>+{atk.dmg}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>Режим</div>
          <div onClick={() => setHardMode(!hardMode)} style={{ padding: '7px 10px', background: hardMode ? 'rgba(201,168,76,0.12)' : '#1c1f2a', border: `1px solid ${hardMode ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '7px', fontFamily: 'monospace', fontSize: '11px', color: hardMode ? '#e0bc6a' : '#5a5670', cursor: 'pointer', textAlign: 'center' }}>
            {hardMode ? '⚡ ХАРД 2x XP' : 'ОБЫЧНЫЙ'}
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
  <div onClick={() => setConfirmEscape(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '13px', color: '#e05555', cursor: 'pointer', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '7px' }}>
    🏃 Бежать из данжа
  </div>
</div>

{confirmEscape && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
    <div style={{ background: '#1c1f2a', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '14px', padding: '2rem', maxWidth: '320px', textAlign: 'center' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏃</div>
      <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#e6e2f0', marginBottom: '8px' }}>Сбежать из данжа?</div>
      <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic', marginBottom: '20px' }}>Прогресс боя будет потерян. Трус живёт дольше.</div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div onClick={() => setConfirmEscape(false)} style={{ flex: 1, padding: '10px', background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#9590a8', cursor: 'pointer', textAlign: 'center' }}>
          Остаться
        </div>
        <div onClick={() => router.push('/hub')} style={{ flex: 1, padding: '10px', background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#e05555', cursor: 'pointer', textAlign: 'center' }}>
          Бежать
        </div>
      </div>
    </div>
  </div>
)}
      </div>

      {/* АРЕНА */}
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* HP бары */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '1rem', alignItems: 'center' }}>
          {/* Игрок */}
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>🧙</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e6e2f0', marginBottom: '5px' }}>Аркан</div>
              <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ height: '100%', background: playerHP > 40 ? '#3db87a' : '#e0bc6a', width: `${playerHPpct}%`, transition: 'width 0.4s' }}></div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>{playerHP} / 100 HP</div>
            </div>
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#5a5670', textAlign: 'center' }}>⚔️</div>
          {/* Монстр */}
          <div style={{ background: 'rgba(224,85,85,0.04)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse' }}>
            <div style={{ fontSize: '32px' }}>👹</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555', marginBottom: '5px' }}>Демон {dungeonName.split(' ')[1] || ''}</div>
              <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ height: '100%', background: '#e05555', width: `${enemyHPpct}%`, transition: 'width 0.4s', marginLeft: 'auto' }}></div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>{enemyHP} / 100 HP</div>
            </div>
          </div>
        </div>

        {/* ФЛЭШ */}
        {phase === 'result_flash' && (
          <div style={{ background: '#1c1f2a', border: `1px solid ${flashColor}`, borderRadius: '12px', padding: '2rem', textAlign: 'center', fontFamily: 'serif', fontSize: '28px', color: flashColor }}>
            {flashMsg}
          </div>
        )}

        {/* ФАЗ: ВЫБОР АТАКИ */}
        {phase === 'choose_attack' && (
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '14px' }}>▸ Выбери атаку</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {ATTACKS.map(atk => (
                <div key={atk.id} onClick={() => chooseAttack(atk)} style={{ background: '#1c1f2a', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '12px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = `1px solid ${atk.color}` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: atk.color }}></div>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>{atk.icon}</div>
                  <div style={{ fontFamily: 'serif', fontSize: '16px', color: '#e6e2f0', marginBottom: '4px' }}>{atk.label}</div>
                  <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '10px' }}>{atk.desc}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '20px', color: atk.color }}>+{atk.dmg}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670' }}>урона</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '10px', fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', textAlign: 'center' }}>
              Сложнее задача → больше урона → выше риск ошибки
            </div>
          </div>
        )}

        {/* ФАЗ: АТАКА ИГРОКА */}
        {phase === 'player_attack' && currentQ && chosenAttack && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '20px' }}>{chosenAttack.icon}</span>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: chosenAttack.color, textTransform: 'uppercase' }}>
                {chosenAttack.label} · +{chosenAttack.dmg} урона
              </div>
            </div>

            <div style={{ background: '#1c1f2a', border: `1px solid rgba(123,108,255,0.25)`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(123,108,255,0.4), transparent)' }}></div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginBottom: '10px', letterSpacing: '0.1em' }}>▸ {dungeonName.toUpperCase()}</div>
              <div style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{currentQ.question}</div>
            </div>

            {hardMode ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" value={inputAnswer} onChange={e => setInputAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAttackHard()}
                  placeholder="Введи ответ..." disabled={selected !== null}
                  style={{ flex: 1, background: '#1c1f2a', border: '1px solid rgba(123,108,255,0.35)', borderRadius: '9px', padding: '14px', fontSize: '22px', color: '#e6e2f0', fontFamily: 'serif', outline: 'none' }} />
                <div onClick={handleAttackHard} style={{ padding: '14px 24px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '9px', fontSize: '18px', cursor: 'pointer', color: '#e0bc6a', display: 'flex', alignItems: 'center' }}>✓</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                {currentQ.answers.map((ans: string, idx: number) => {
                  let bg = '#1c1f2a', border = 'rgba(255,255,255,0.06)', color = '#e6e2f0'
                  if (selected !== null) {
                    if (idx === currentQ.correct_index) { bg = 'rgba(45,217,184,0.06)'; border = 'rgba(45,217,184,0.4)'; color = '#2dd9b8' }
                    else if (idx === selected) { bg = 'rgba(224,85,85,0.06)'; border = 'rgba(224,85,85,0.35)'; color = '#e05555' }
                  }
                  return (
                    <div key={idx} onClick={() => handleAttack(idx)} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '24px', color, cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.18s' }}>
                      {ans}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ФАЗ: ЗАЩИТА ОТ МОНСТРА */}
        {phase === 'monster_attack' && monsterQ && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#e05555', textTransform: 'uppercase' }}>
                👹 Монстр атакует! Защитись!
              </div>
              {/* Таймер */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '120px', height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: timer > 8 ? '#3db87a' : timer > 4 ? '#e0bc6a' : '#e05555', width: `${(timer / 15) * 100}%`, transition: 'width 1s linear' }}></div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '14px', color: timer > 8 ? '#3db87a' : timer > 4 ? '#e0bc6a' : '#e05555', minWidth: '24px' }}>{timer}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(224,85,85,0.04)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(224,85,85,0.5), transparent)' }}></div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#e05555', marginBottom: '10px', letterSpacing: '0.1em' }}>▸ АТАКА ДЕМОНА · ЗАБЛОКИРУЙ</div>
              <div style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{monsterQ.question}</div>
              <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginTop: '8px' }}>Правильный ответ блокирует удар · Ошибка = -{20} HP</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              {monsterQ.answers.map((ans: string, idx: number) => (
                <div key={idx} onClick={() => handleDefend(idx)} style={{ background: '#1c1f2a', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '24px', color: '#e6e2f0', cursor: 'pointer', transition: 'all 0.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,85,85,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1c1f2a' }}
                >
                  {ans}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function Battle() {
  return (
    <Suspense>
      <BattleContent />
    </Suspense>
  )
}
