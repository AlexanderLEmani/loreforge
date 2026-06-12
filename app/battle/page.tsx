'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'
import {
  type BattleAttack,
  type Monster,
  type ScrollBattleEffect,
  BOSS_ENRAGE_BONUS_HP,
  BOSS_ENRAGE_HP_RATIO,
  BOSS_ENRAGE_TIMER_DELTA,
  BOSS_VARIANTS,
  getAttacksForBattle,
  getUnlockedTopics,
  pickMonster,
  scrollBattleEffect,
  SCROLL_EFFECT_LABELS,
  STREAK_CRIT_MULT,
  STREAK_CRIT_THRESHOLD,
} from '@/lib/battle-config'
import {
  computeBattleBonuses,
  defaultSkillNodes,
  nodesByIds,
  type BattleSkillBonuses,
} from '@/lib/battle-skills'
import { getDifficultyPool, pickUnused, poolForAttack } from '@/lib/battle-questions'
import { mergeWithFallback } from '@/lib/fallback-questions'
import { loadDemoSkillState } from '@/lib/skill-tree'
import { computeEquipBonuses } from '@/lib/equipment'
import { loadEquipped } from '@/lib/equipment-storage'
import { shuffleQuestions } from '@/lib/shuffle-question'

type Phase = 'choose_attack' | 'player_attack' | 'monster_attack' | 'result_flash'

type BattleScroll = {
  userScrollId: number
  title: string
  effect: ScrollBattleEffect
}

function BattleContent() {
  const router = useRouter()
  const supabase = createClient()
  const params = useSearchParams()
  const dungeonName = params.get('dungeon') || 'Пещера сложения'

  const [questionBank, setQuestionBank] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLevel, setUserLevel] = useState(1)
  const [monster, setMonster] = useState<Monster | null>(null)
  const [phase, setPhase] = useState<Phase>('choose_attack')
  const [chosenAttack, setChosenAttack] = useState<BattleAttack | null>(null)
  const [currentQ, setCurrentQ] = useState<any>(null)
  const [monsterQ, setMonsterQ] = useState<any>(null)
  const [playerHP, setPlayerHP] = useState(100)
  const [enemyHP, setEnemyHP] = useState(100)
  const [enemyMaxHP, setEnemyMaxHP] = useState(100)
  const [selected, setSelected] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState<string[]>([])
  const [roundCount, setRoundCount] = useState(0)
  const [correctStreak, setCorrectStreak] = useState(0)
  const [inputAnswer, setInputAnswer] = useState('')
  const [hardMode, setHardMode] = useState(false)
  const [confirmEscape, setConfirmEscape] = useState(false)
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set())
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [damageFlash, setDamageFlash] = useState<{ target: 'player' | 'enemy'; amount: number } | null>(null)
  const [timer, setTimer] = useState(15)
  const [flashMsg, setFlashMsg] = useState('')
  const [flashColor, setFlashColor] = useState('')
  const [battleScrolls, setBattleScrolls] = useState<BattleScroll[]>([])
  const [scrollUsed, setScrollUsed] = useState(false)
  const [hintActive, setHintActive] = useState(false)
  const [powerBuff, setPowerBuff] = useState(false)
  const [shieldActive, setShieldActive] = useState(false)
  const [skillShieldActive, setSkillShieldActive] = useState(false)
  const [skillBonuses, setSkillBonuses] = useState<BattleSkillBonuses>({
    damagePct: 0, damageReductionPct: 0, shieldOnCorrect: false, unlockedNames: [],
  })
  const [bossEnraged, setBossEnraged] = useState(false)
  const [equipBonuses, setEquipBonuses] = useState(() => computeEquipBonuses({ head: '', body: '', weapon: '', hands: '', feet: '' } as any))
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const unlockedTopics = useMemo(() => getUnlockedTopics(userLevel), [userLevel])
  const availableAttacks = useMemo(
    () => getAttacksForBattle(userLevel, dungeonName, unlockedTopics),
    [userLevel, dungeonName, unlockedTopics],
  )

  function playSound(type: 'hit' | 'miss' | 'block' | 'defeat' | 'dark') {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'hit') {
        osc.frequency.setValueAtTime(520, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start(); osc.stop(ctx.currentTime + 0.2)
      } else if (type === 'miss') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(180, ctx.currentTime)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        osc.start(); osc.stop(ctx.currentTime + 0.25)
      } else if (type === 'block') {
        osc.type = 'square'
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start(); osc.stop(ctx.currentTime + 0.15)
      } else if (type === 'dark') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(80, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start(); osc.stop(ctx.currentTime + 0.6)
      }
    } catch { /* audio optional */ }
  }

  useEffect(() => {
    async function load() {
      const dungeonsToLoad = [
        'Пещера сложения',
        'Пещера вычитания',
        'Башня умножения',
        'Пещера деления',
        'Храм дробей',
      ]
      const bank: Record<string, any[]> = {}
      for (const d of dungeonsToLoad) {
        const { data } = await supabase.from('questions').select('*').eq('dungeon_name', d).limit(30)
        bank[d] = shuffleQuestions(mergeWithFallback(d, data || []))
      }
      if (!bank[dungeonName]?.length) {
        bank[dungeonName] = shuffleQuestions(mergeWithFallback(dungeonName, []))
      }
      setQuestionBank(bank)

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data: ud } = await supabase.from('users').select('level').eq('id', user.id).single()
        const lvl = ud?.level || 1
        setUserLevel(lvl)

        const { data: us } = await supabase
          .from('user_scrolls')
          .select('id, scroll_id, scrolls(title, level)')
          .eq('user_id', user.id)

        const scrolls: BattleScroll[] = (us || [])
          .filter((row: any) => row.scrolls && (row.scrolls.level || 1) <= lvl)
          .slice(0, 6)
          .map((row: any) => ({
            userScrollId: row.id,
            title: row.scrolls.title,
            effect: scrollBattleEffect(row.scrolls),
          }))
        setBattleScrolls(scrolls)

        const allNodes = defaultSkillNodes()
        const { data: dbNodes } = await supabase.from('skill_tree_nodes').select('*')
        const nodes = (dbNodes?.length ? dbNodes.map(n => ({
          ...n,
          effect: typeof n.effect === 'object' ? n.effect : {},
          requires: n.requires ?? null,
        })) : allNodes) as typeof allNodes

        const { data: userSkills } = await supabase.from('user_skills').select('node_id').eq('user_id', user.id)
        let unlockedIds = (userSkills || []).map(s => s.node_id)
        if (unlockedIds.length === 0) {
          const demo = loadDemoSkillState()
          unlockedIds = demo.unlocked
        }
        setSkillBonuses(computeBattleBonuses(dungeonName, nodesByIds(unlockedIds, nodes)))

        const equipped = await loadEquipped(user.id)
        setEquipBonuses(computeEquipBonuses(equipped))
      }

      const m = pickMonster(dungeonName)
      setMonster(m)
      setEnemyHP(m.hp)
      setEnemyMaxHP(m.hp)
      setLoading(false)
    }
    load()
  }, [dungeonName])

  useEffect(() => {
    const needsTimer = phase === 'monster_attack' || (phase === 'player_attack' && chosenAttack?.id === 'heavy')
    if (!needsTimer) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    const maxT = phase === 'player_attack' ? 60 : (monster?.defendTimer ?? 15) + (equipBonuses.defendTimerSec || 0)
    setTimer(maxT)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleDefend(-1, true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, monsterQ, chosenAttack, monster])

  function markUsed(id: number) {
    setUsedIds(prev => new Set([...prev, id]))
  }

  function dungeonQuestions() {
    return questionBank[dungeonName] || []
  }

  function flash(msg: string, color: string, cb: () => void) {
    setFlashMsg(msg)
    setFlashColor(color)
    setPhase('result_flash')
    setTimeout(() => { setFlashMsg(''); cb() }, 1350)
  }

  function tickCooldowns() {
    setCooldowns(prev => {
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        if (next[k] > 0) next[k] -= 1
      }
      return next
    })
  }

  function chooseAttack(atk: BattleAttack) {
    if ((cooldowns[atk.id] ?? 0) > 0) return
    if (atk.id === 'heavy') playSound('dark')
    if (atk.cooldown) setCooldowns(prev => ({ ...prev, [atk.id]: atk.cooldown! }))

    const pool = poolForAttack(atk, questionBank)
    const fallback = dungeonQuestions()
    const source = pool.length > 0 ? pool : fallback
    if (source.length === 0) return

    const q = pickUnused(getDifficultyPool(source, atk.difficulty), usedIds, markUsed)
    if (!q) return

    setChosenAttack(atk)
    setCurrentQ(q)
    setSelected(null)
    setInputAnswer('')
    setPhase('player_attack')
  }

  async function useScroll(bs: BattleScroll) {
    if (scrollUsed || phase !== 'choose_attack') return
    setScrollUsed(true)
    await supabase.from('user_scrolls').delete().eq('id', bs.userScrollId)
    setBattleScrolls(prev => prev.filter(s => s.userScrollId !== bs.userScrollId))

    if (bs.effect === 'hint') setHintActive(true)
    if (bs.effect === 'power') setPowerBuff(true)
    if (bs.effect === 'shield') setShieldActive(true)
    flash(`${SCROLL_EFFECT_LABELS[bs.effect].icon} ${SCROLL_EFFECT_LABELS[bs.effect].label}!`, '#a99fff', () => setPhase('choose_attack'))
  }

  function calcDamage(base: number, isCrit: boolean, isSpell = false) {
    let dmg = base * (1 + skillBonuses.damagePct / 100 + (equipBonuses.damagePct || 0) / 100)
    if (isSpell) dmg *= 1 + (equipBonuses.spellDamagePct || 0) / 100
    if (powerBuff) dmg *= 2
    if (isCrit) dmg *= STREAK_CRIT_MULT
    return Math.round(dmg)
  }

  function tryBossEnrage(hp: number, maxHp: number) {
    if (bossEnraged || hp > maxHp * BOSS_ENRAGE_HP_RATIO) return
    setBossEnraged(true)
    const boss = BOSS_VARIANTS.default
    setMonster(prev => prev ? {
      ...prev,
      name: boss.name ?? prev.name,
      icon: boss.icon ?? prev.icon,
      trait: boss.trait ?? prev.trait,
      defendTimer: Math.max(6, prev.defendTimer + BOSS_ENRAGE_TIMER_DELTA),
      attackDmg: prev.attackDmg + 4,
      timeoutDmg: prev.timeoutDmg + 5,
    } : prev)
    setEnemyHP(hp + BOSS_ENRAGE_BONUS_HP)
    setEnemyMaxHP(maxHp + BOSS_ENRAGE_BONUS_HP)
  }

  async function applyPlayerHit(correct: boolean, newMistakes: string[]) {
    if (!chosenAttack) return

    let newEnemyHP = enemyHP
    let newPlayerHP = playerHP
    let newStreak = correctStreak

    if (correct) {
      newStreak = correctStreak + 1
      const isCrit = newStreak >= STREAK_CRIT_THRESHOLD
      const dmg = calcDamage(chosenAttack.dmg, isCrit, chosenAttack.kind === 'spell')
      playSound('hit')
      newEnemyHP = Math.max(0, enemyHP - dmg)
      setEnemyHP(newEnemyHP)
      setDamageFlash({ target: 'enemy', amount: dmg })
      setTimeout(() => setDamageFlash(null), 1200)
      setCorrectStreak(newStreak)
      setPowerBuff(false)
      if (skillBonuses.shieldOnCorrect) setSkillShieldActive(true)
    } else {
      playSound('miss')
      newStreak = 0
      setCorrectStreak(0)
      if (chosenAttack.id === 'heavy') {
        const selfDmg = 40
        newPlayerHP = Math.max(0, playerHP - selfDmg)
        setPlayerHP(newPlayerHP)
        setDamageFlash({ target: 'player', amount: selfDmg })
        setTimeout(() => setDamageFlash(null), 1200)
        if (newPlayerHP <= 0) {
          setTimeout(() => endBattle('lose', newMistakes), 800)
          return
        }
      }
    }

    setTimeout(() => {
      setSelected(null)
      if (newEnemyHP <= 0) {
        endBattle('win', newMistakes, chosenAttack.kind === 'spell')
        return
      }
      tryBossEnrage(newEnemyHP, enemyMaxHP)
      const mq = pickUnused(dungeonQuestions(), usedIds, markUsed)
      if (!mq) { endBattle('win', newMistakes, chosenAttack.kind === 'spell'); return }
      setMonsterQ(mq)
      setPhase('monster_attack')
    }, 800)
  }

  async function handleAttack(idx: number) {
    if (selected !== null || !currentQ || !chosenAttack) return
    if (currentUser) await supabase.rpc('increment_answers', { user_id: currentUser.id })
    setHintActive(false)
    setSelected(idx)
    const correct = idx === currentQ.correct_index
    const newMistakes = correct ? mistakes : [...mistakes, currentQ.question]
    if (!correct) setMistakes(newMistakes)
    await applyPlayerHit(correct, newMistakes)
  }

  async function handleAttackHard() {
    if (selected !== null || !inputAnswer || !currentQ || !chosenAttack) return
    if (currentUser) await supabase.rpc('increment_answers', { user_id: currentUser.id })
    const correct = inputAnswer.trim() === currentQ.answers[currentQ.correct_index].trim()
    setSelected(correct ? currentQ.correct_index : -1)
    setInputAnswer('')
    const newMistakes = correct ? mistakes : [...mistakes, currentQ.question]
    if (!correct) setMistakes(newMistakes)

    if (correct) {
      const newStreak = correctStreak + 1
      const isCrit = newStreak >= STREAK_CRIT_THRESHOLD
      const dmg = calcDamage(Math.round(chosenAttack.dmg * 1.5), isCrit, chosenAttack.kind === 'spell')
      playSound('hit')
      const newEnemyHP = Math.max(0, enemyHP - dmg)
      setEnemyHP(newEnemyHP)
      setDamageFlash({ target: 'enemy', amount: dmg })
      setTimeout(() => setDamageFlash(null), 1200)
      setCorrectStreak(newStreak)
      setPowerBuff(false)
      setTimeout(() => {
        setSelected(null)
        if (newEnemyHP <= 0) {
          endBattle('win', newMistakes, chosenAttack.kind === 'spell')
          return
        }
        tryBossEnrage(newEnemyHP, enemyMaxHP)
        const mq = pickUnused(dungeonQuestions(), usedIds, markUsed)
        setMonsterQ(mq)
        setPhase('monster_attack')
      }, 800)
    } else {
      await applyPlayerHit(false, newMistakes)
    }
  }

  function handleDefend(idx: number, timeout = false) {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!monsterQ || !monster) return

    const correct = !timeout && idx === monsterQ.correct_index
    let newPlayerHP = playerHP
    let newMistakes = [...mistakes]

    if ((shieldActive || skillShieldActive) && !correct) {
      setShieldActive(false)
      setSkillShieldActive(false)
      playSound('block')
      flash('🛡️ Щит поглотил удар!', '#3db87a', () => {
        tickCooldowns()
        setRoundCount(r => r + 1)
        setPhase('choose_attack')
      })
      return
    }

    if (!correct) {
      playSound('miss')
      let dmg = timeout ? monster.timeoutDmg : monster.attackDmg
      const reduction = skillBonuses.damageReductionPct + (equipBonuses.defensePct || 0)
      if (reduction > 0) dmg = Math.round(dmg * (1 - reduction / 100))
      newPlayerHP = Math.max(0, playerHP - dmg)
      setPlayerHP(newPlayerHP)
      setDamageFlash({ target: 'player', amount: dmg })
      setTimeout(() => setDamageFlash(null), 1200)
      newMistakes = [...mistakes, monsterQ.question]
      setMistakes(newMistakes)
      setCorrectStreak(0)
      flash(timeout ? `⏰ Время! -${dmg} HP` : `💥 ${monster.name} бьёт! -${dmg} HP`, '#e05555', () => {
        if (newPlayerHP <= 0) { endBattle('lose', newMistakes); return }
        tickCooldowns()
        setRoundCount(r => r + 1)
        setPhase('choose_attack')
      })
    } else {
      playSound('block')
      flash('🛡️ Заблокировано!', '#3db87a', () => {
        tickCooldowns()
        setRoundCount(r => r + 1)
        setPhase('choose_attack')
      })
    }
  }

  function endBattle(result: 'win' | 'lose', finalMistakes: string[], spellKill = false) {
    const score = roundCount + 1 - finalMistakes.length
    const spellParam = result === 'win' && spellKill ? '&spell=1' : ''
    router.push(
      `/debrief?result=${result}&score=${Math.max(0, score)}&total=${roundCount + 1}&mistakes=${encodeURIComponent(finalMistakes.join('|'))}&dungeon=${encodeURIComponent(dungeonName)}${hardMode ? '&hard=true' : ''}${spellParam}`,
    )
  }

  if (loading) {
    return (
      <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
        Загрузка данжа...
      </div>
    )
  }

  if (dungeonQuestions().length === 0) {
    return (
      <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
        Вопросы не найдены для «{dungeonName}»
      </div>
    )
  }

  const basicAttacks = availableAttacks.filter(a => a.kind === 'basic')
  const spellAttacks = availableAttacks.filter(a => a.kind === 'spell')

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      <style>{`@keyframes fadeUp { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-30px); } }`}</style>

      <div style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(224,85,85,0.11)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555' }}>{dungeonName}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c', marginTop: '2px' }}>РАУНД {roundCount + 1}</div>
        </div>

        {monster && (
          <div style={{ background: '#1a1f28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8a849c', marginBottom: '6px' }}>ВРАГ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{monster.icon}</span>
              <div>
                <div style={{ fontSize: '13px', color: '#e6e2f0' }}>{monster.name}</div>
                <div style={{ fontSize: '10px', color: bossEnraged ? '#e05555' : '#8a849c' }}>
              {monster.trait} · таймер {monster.defendTimer}s{bossEnraged ? ' · ЯРОСТЬ' : ''}
            </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '8px' }}>Стрик</div>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '10px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', color: correctStreak >= STREAK_CRIT_THRESHOLD ? '#e0bc6a' : '#9590a8' }}>
              {correctStreak} {correctStreak >= STREAK_CRIT_THRESHOLD ? '⚡ КРИТ!' : ''}
            </div>
            <div style={{ fontSize: '10px', color: '#8a849c' }}>{STREAK_CRIT_THRESHOLD} верных → ×{STREAK_CRIT_MULT} урон</div>
          </div>
          {powerBuff && <div style={{ marginTop: '6px', fontSize: '11px', color: '#e0bc6a' }}>⚡ Свиток: ×2 урон</div>}
          {shieldActive && <div style={{ marginTop: '4px', fontSize: '11px', color: '#a99fff' }}>🛡 Щит активен</div>}
          {skillBonuses.unlockedNames.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#7b6cff', lineHeight: 1.5 }}>
              ✦ {skillBonuses.damagePct > 0 ? `+${skillBonuses.damagePct}% урон` : ''}
              {skillBonuses.damageReductionPct > 0 ? ` · −${skillBonuses.damageReductionPct}% входящий` : ''}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '8px' }}>Свитки</div>
          {battleScrolls.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#5a5670', lineHeight: 1.5 }}>Купи в Лавке — один свиток за бой</div>
          ) : (
            battleScrolls.map(bs => (
              <div
                key={bs.userScrollId}
                onClick={() => !scrollUsed && phase === 'choose_attack' && useScroll(bs)}
                style={{
                  padding: '8px 10px', marginBottom: '4px', background: scrollUsed ? '#161820' : '#1c1f2a',
                  border: `1px solid ${scrollUsed ? 'rgba(255,255,255,0.04)' : 'rgba(169,159,255,0.25)'}`,
                  borderRadius: '7px', cursor: scrollUsed ? 'default' : 'pointer', opacity: scrollUsed ? 0.4 : 1,
                }}
              >
                <div style={{ fontSize: '12px', color: '#c8c0d8' }}>{SCROLL_EFFECT_LABELS[bs.effect].icon} {bs.title}</div>
                <div style={{ fontSize: '10px', color: '#8a849c' }}>{SCROLL_EFFECT_LABELS[bs.effect].desc}</div>
              </div>
            ))
          )}
        </div>

        <div onClick={() => setHardMode(!hardMode)} style={{ padding: '7px 10px', background: hardMode ? 'rgba(201,168,76,0.12)' : '#1c1f2a', border: `1px solid ${hardMode ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '7px', fontFamily: 'monospace', fontSize: '11px', color: hardMode ? '#e0bc6a' : '#8a849c', cursor: 'pointer', textAlign: 'center' }}>
          {hardMode ? '⚡ ХАРД 2x XP' : 'ОБЫЧНЫЙ'}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div onClick={() => setConfirmEscape(true)} style={{ padding: '8px 10px', fontSize: '13px', color: '#e05555', cursor: 'pointer', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '7px', textAlign: 'center' }}>
            🏃 Бежать
          </div>
        </div>

        {confirmEscape && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '14px', padding: '2rem', maxWidth: '320px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏃</div>
              <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#e6e2f0', marginBottom: '20px' }}>Сбежать из данжа?</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div onClick={() => setConfirmEscape(false)} style={{ flex: 1, padding: '10px', background: '#111318', borderRadius: '8px', cursor: 'pointer', color: '#9590a8' }}>Остаться</div>
                <div onClick={() => router.push('/hub')} style={{ flex: 1, padding: '10px', background: 'rgba(224,85,85,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#e05555' }}>Бежать</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            {damageFlash?.target === 'player' && (
              <div style={{ position: 'absolute', top: '-10px', left: '20px', fontFamily: 'monospace', fontSize: '30px', color: '#e05555', fontWeight: 'bold', animation: 'fadeUp 1.2s ease-out forwards', zIndex: 10 }}>
                -{damageFlash.amount}
              </div>
            )}
            <div style={{ fontSize: '32px' }}>🧙</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e6e2f0', marginBottom: '5px' }}>Аркан</div>
              <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ height: '100%', background: playerHP > 40 ? '#3db87a' : '#e0bc6a', width: `${playerHP}%`, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c' }}>{playerHP} / 100 HP</div>
            </div>
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#5a5670', textAlign: 'center' }}>⚔️</div>
          <div style={{ background: 'rgba(224,85,85,0.04)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse', position: 'relative' }}>
            {damageFlash?.target === 'enemy' && (
              <div style={{ position: 'absolute', top: '-10px', right: '20px', fontFamily: 'monospace', fontSize: '30px', color: '#e05555', fontWeight: 'bold', animation: 'fadeUp 1.2s ease-out forwards', zIndex: 10 }}>
                -{damageFlash.amount}
              </div>
            )}
            <div style={{ fontSize: '32px' }}>{monster?.icon ?? '👹'}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555', marginBottom: '5px' }}>{monster?.name ?? 'Демон'}</div>
              <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ height: '100%', background: '#e05555', width: `${(enemyHP / enemyMaxHP) * 100}%`, transition: 'width 0.4s', marginLeft: 'auto' }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c' }}>{enemyHP} / {enemyMaxHP} HP</div>
            </div>
          </div>
        </div>

        {phase === 'result_flash' && (
          <div style={{ background: '#1c1f2a', border: `1px solid ${flashColor}`, borderRadius: '12px', padding: '2rem', textAlign: 'center', fontFamily: 'serif', fontSize: '28px', color: flashColor }}>
            {flashMsg}
          </div>
        )}

        {phase === 'choose_attack' && (
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '10px' }}>▸ Базовые атаки</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
              {basicAttacks.map(atk => {
                const cd = cooldowns[atk.id] ?? 0
                const locked = cd > 0
                return (
                  <div key={atk.id} onClick={() => !locked && chooseAttack(atk)}
                    style={{ background: locked ? '#161820' : '#1c1f2a', border: `1px solid ${locked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1 }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{atk.icon}</div>
                    <div style={{ fontSize: '15px', color: '#e6e2f0', marginBottom: '4px' }}>{atk.label}</div>
                    <div style={{ fontSize: '11px', color: '#8a849c', marginBottom: '8px' }}>{atk.desc}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', color: atk.color }}>+{atk.dmg}</div>
                    {locked && <div style={{ fontSize: '10px', color: '#e05555', marginTop: '4px' }}>⏳ {cd}</div>}
                  </div>
                )
              })}
            </div>

            {spellAttacks.length > 0 && (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '10px' }}>▸ Заклинания · комбо-темы</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {spellAttacks.map(atk => {
                    const cd = cooldowns[atk.id] ?? 0
                    const locked = cd > 0
                    return (
                      <div key={atk.id} onClick={() => !locked && chooseAttack(atk)}
                        style={{ background: locked ? '#161820' : 'rgba(123,108,255,0.08)', border: `1px solid ${locked ? 'rgba(255,255,255,0.04)' : 'rgba(169,159,255,0.35)'}`, borderRadius: '12px', padding: '1rem', textAlign: 'center', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1 }}>
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>{atk.icon}</div>
                        <div style={{ fontSize: '14px', color: '#e6e2f0', marginBottom: '4px' }}>{atk.label}</div>
                        <div style={{ fontSize: '10px', color: '#8a849c', marginBottom: '6px', lineHeight: 1.4 }}>{atk.desc}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: atk.color }}>+{atk.dmg}</div>
                        {locked && <div style={{ fontSize: '10px', color: '#e05555' }}>⏳ {cd}</div>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {phase === 'player_attack' && currentQ && chosenAttack && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '20px' }}>{chosenAttack.icon}</span>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: chosenAttack.color, textTransform: 'uppercase' }}>
                {chosenAttack.label} · темы: {chosenAttack.dungeons.map(d => d.split(' ').pop()).join(' + ')}
              </div>
            </div>
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(123,108,255,0.25)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
              {chosenAttack.id === 'heavy' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', color: timer > 4 ? '#e0bc6a' : '#e05555' }}>{timer}s</div>
                </div>
              )}
              <div style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{currentQ.question}</div>
            </div>
            {hardMode ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" value={inputAnswer} onChange={e => setInputAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAttackHard()}
                  placeholder="Ответ..." disabled={selected !== null}
                  style={{ flex: 1, background: '#1c1f2a', border: '1px solid rgba(123,108,255,0.35)', borderRadius: '9px', padding: '14px', fontSize: '22px', color: '#e6e2f0', fontFamily: 'serif', outline: 'none' }} />
                <div onClick={handleAttackHard} style={{ padding: '14px 24px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '9px', fontSize: '18px', cursor: 'pointer', color: '#e0bc6a' }}>✓</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                {currentQ.answers.map((ans: string, idx: number) => {
                  const isHint = hintActive && idx === currentQ.correct_index
                  let bg = '#1c1f2a', border = 'rgba(255,255,255,0.06)', color = '#e6e2f0'
                  if (selected !== null) {
                    if (idx === currentQ.correct_index) { bg = 'rgba(45,217,184,0.06)'; border = 'rgba(45,217,184,0.4)'; color = '#2dd9b8' }
                    else if (idx === selected) { bg = 'rgba(224,85,85,0.06)'; border = 'rgba(224,85,85,0.35)'; color = '#e05555' }
                  } else if (isHint) {
                    bg = 'rgba(61,184,122,0.1)'; border = 'rgba(61,184,122,0.5)'; color = '#3db87a'
                  }
                  return (
                    <div key={idx} onClick={() => handleAttack(idx)}
                      style={{ background: bg, border: `1px solid ${border}`, borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '24px', color, cursor: selected !== null ? 'default' : 'pointer' }}>
                      {ans}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {phase === 'monster_attack' && monsterQ && monster && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#e05555', textTransform: 'uppercase' }}>
                {monster.icon} {monster.name} атакует!
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold', color: timer > monster.defendTimer / 2 ? '#3db87a' : '#e05555' }}>{timer}s</div>
            </div>
            <div style={{ background: 'rgba(224,85,85,0.04)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{monsterQ.question}</div>
              <div style={{ fontSize: '12px', color: '#8a849c', marginTop: '8px' }}>Верный ответ блокирует · ошибка −{monster.attackDmg} HP</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              {monsterQ.answers.map((ans: string, idx: number) => (
                <div key={idx} onClick={() => handleDefend(idx)}
                  style={{ background: '#1c1f2a', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '24px', color: '#e6e2f0', cursor: 'pointer' }}>
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
