'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'
import { LoadingScreen } from '@/components/LoadingScreen'
import {
  type BattleAttack,
  type Monster,
  type ScrollBattleEffect,
  getAttacksForBattle,
  getUnlockedTopics,
  pickMonster,
  SCROLL_EFFECT_LABELS,
  HEAL_POTION_HP,
  STREAK_CRIT_MULT,
  STREAK_CRIT_THRESHOLD,
} from '@/lib/battle-config'
import {
  BOSS_ENRAGE_ATTACK_BONUS,
  BOSS_ENRAGE_TIMEOUT_BONUS,
  BOSS_ENRAGE_HP_RATIO,
  BOSS_ENRAGE_TIMER_DELTA,
} from '@/lib/boss-system'
import {
  BATTLE_CONSUMABLES,
  CONSUMABLE_EFFECTS,
  EMPTY_CONSUMABLES,
  parseConsumables,
  type ConsumableInventory,
} from '@/lib/battle-consumables'
import {
  addInventory,
  clearBattleLoadout,
  readBattleLoadout,
  loadoutToInventory,
} from '@/lib/battle-loadout'
import {
  computeBattleBonuses,
  defaultSkillNodes,
  nodesByIds,
  type BattleSkillBonuses,
} from '@/lib/battle-skills'
import { getDifficultyPool, normalizeQuestionDifficulty, pickUnused, poolForAttack } from '@/lib/battle-questions'
import { recordBattleAttempt } from '@/lib/training-stats'
import { mergeWithFallback } from '@/lib/fallback-questions'
import { loadDemoSkillState } from '@/lib/skill-tree'
import { computeEquipBonuses } from '@/lib/equipment'
import { loadEquipped } from '@/lib/equipment-storage'
import { answersMatch, sanitizeAnswerInput } from '@/lib/scroll-display'
import { shuffleQuestions } from '@/lib/shuffle-question'
import { isHintHighlighted, pickHintPair } from '@/lib/hint-pair'
import { layout } from '@/lib/layout-classes'
import {
  raceBasicDamageBonus,
  raceDefendTimerBonus,
  raceSpellCooldownReduction,
} from '@/lib/race-bonuses'
import { useStudyTimer } from '@/lib/use-study-timer'
import StudyProgressChip from '@/components/StudyProgressChip'
import BattleScratchPad from '@/components/BattleScratchPad'
import {
  isBossMonster,
  resolveBossIntent,
} from '@/lib/boss-system'
import {
  applyStanceToMonster,
  monsterProfile,
  rageChargeMultiplier,
  RAGE_CHARGE_MAX,
  stanceCap,
  topicDamageMultiplier,
} from '@/lib/monster-mechanics'

type Phase = 'choose_attack' | 'player_attack' | 'monster_attack' | 'result_flash'

function BattleContent() {
  const router = useRouter()
  const supabase = createClient()
  const params = useSearchParams()
  const dungeonName = params.get('dungeon') || 'Пещера сложения'
  const typedAnswerPlaceholder = dungeonName === 'Храм дробей' ? '2/3, ½ или 0…' : 'Введи ответ…'

  const [questionBank, setQuestionBank] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLevel, setUserLevel] = useState(1)
  const [playerRace, setPlayerRace] = useState('human')
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
  const [scratchOpen, setScratchOpen] = useState(false)
  const usedIdsRef = useRef<Set<number>>(new Set())
  const usedTextsRef = useRef<Set<string>>(new Set())
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [damageFlash, setDamageFlash] = useState<{ target: 'player' | 'enemy'; amount: number } | null>(null)
  const [timer, setTimer] = useState(15)
  const [flashMsg, setFlashMsg] = useState('')
  const [flashColor, setFlashColor] = useState('')
  const [consumables, setConsumables] = useState<ConsumableInventory>(EMPTY_CONSUMABLES)
  const [attackHintIndices, setAttackHintIndices] = useState<number[] | null>(null)
  const [defenseHintIndices, setDefenseHintIndices] = useState<number[] | null>(null)
  const [itemToast, setItemToast] = useState<string | null>(null)
  const [powerBuff, setPowerBuff] = useState(false)
  const [shieldActive, setShieldActive] = useState(false)
  const [skillShieldActive, setSkillShieldActive] = useState(false)
  const [equipBonuses, setEquipBonuses] = useState(() => computeEquipBonuses({}))
  const [skillBonuses, setSkillBonuses] = useState<BattleSkillBonuses>({
    damagePct: 0, damageReductionPct: 0, shieldOnCorrect: false, unlockedNames: [],
  })
  const [bossEnraged, setBossEnraged] = useState(false)
  const [stanceStacks, setStanceStacks] = useState(0)
  const [rageChargeStacks, setRageChargeStacks] = useState(0)
  const baseMonsterRef = useRef<{ attackDmg: number; timeoutDmg: number; defendTimer: number } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const consumablesRef = useRef<ConsumableInventory>(EMPTY_CONSUMABLES)
  const consumablesRestoredRef = useRef(false)

  useStudyTimer(!loading && monster !== null)

  useEffect(() => {
    consumablesRef.current = consumables
  }, [consumables])

  const unlockedTopics = useMemo(() => getUnlockedTopics(userLevel), [userLevel])
  const currentProfile = useMemo(
    () => (monster ? monsterProfile(monster.id) : null),
    [monster],
  )
  const availableAttacks = useMemo(
    () => getAttacksForBattle(userLevel, dungeonName, unlockedTopics),
    [userLevel, dungeonName, unlockedTopics],
  )
  const bossIntent = useMemo(() => {
    if (!monster || !currentProfile || !isBossMonster(monster)) return null
    return resolveBossIntent(
      currentProfile,
      enemyHP,
      enemyMaxHP,
      bossEnraged,
      stanceStacks,
      rageChargeStacks,
    )
  }, [monster, currentProfile, enemyHP, enemyMaxHP, bossEnraged, stanceStacks, rageChargeStacks])

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
        'Рынок процентов',
      ]
      const bank: Record<string, any[]> = {}
      for (const d of dungeonsToLoad) {
        const { data } = await supabase.from('questions').select('*').eq('dungeon_name', d).limit(120)
        const merged = mergeWithFallback(d, data || []).map(normalizeQuestionDifficulty)
        bank[d] = shuffleQuestions(merged)
      }
      if (!bank[dungeonName]?.length) {
        const merged = mergeWithFallback(dungeonName, []).map(normalizeQuestionDifficulty)
        bank[dungeonName] = shuffleQuestions(merged)
      }
      setQuestionBank(bank)

      const loadout = readBattleLoadout(dungeonName)
      if (loadout === null) {
        router.replace(`/prepare?dungeon=${encodeURIComponent(dungeonName)}`)
        return
      }
      setConsumables(loadoutToInventory(loadout))

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      let dungeonWins = 0

      if (user) {
        const { data: ud } = await supabase.from('users').select('level').eq('id', user.id).single()
        const lvl = ud?.level || 1
        setUserLevel(lvl)

        const { data: ch } = await supabase.from('characters').select('race').eq('user_id', user.id).maybeSingle()
        if (ch?.race) setPlayerRace(ch.race)

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

        const { count: winCount } = await supabase
          .from('dungeon_runs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('dungeon_name', dungeonName)
          .eq('result', 'win')
        dungeonWins = winCount ?? 0
      }

      const m = pickMonster(dungeonName, dungeonWins)
      baseMonsterRef.current = {
        attackDmg: m.attackDmg,
        timeoutDmg: m.timeoutDmg,
        defendTimer: m.defendTimer,
      }
      setStanceStacks(0)
      setRageChargeStacks(0)
      setBossEnraged(false)
      setMonster(m)
      setEnemyHP(m.hp)
      setEnemyMaxHP(m.hp)
      if (isBossMonster(m)) {
        setItemToast('⚔ Чемпион данжа — смотри намерение')
        setTimeout(() => setItemToast(null), 3200)
      }
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
    const maxT = phase === 'player_attack'
      ? 60
      : (monster?.defendTimer ?? 15) + (equipBonuses.defendTimerSec || 0) + raceDefendTimerBonus(playerRace)
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

  function recomputeMonsterStats(stacks: number, enraged: boolean) {
    const base = baseMonsterRef.current
    if (!base) return
    let { attackDmg, timeoutDmg } = applyStanceToMonster(base, stacks)
    let defendTimer = base.defendTimer
    if (enraged) {
      attackDmg += BOSS_ENRAGE_ATTACK_BONUS
      timeoutDmg += BOSS_ENRAGE_TIMEOUT_BONUS
      defendTimer = Math.max(6, defendTimer + BOSS_ENRAGE_TIMER_DELTA)
    }
    setMonster(prev => prev ? { ...prev, attackDmg, timeoutDmg, defendTimer } : prev)
  }

  function applyIncomingDamage(rawDmg: number): number {
    let dmg = rawDmg
    const reduction = skillBonuses.damageReductionPct + (equipBonuses.defensePct || 0)
    if (reduction > 0) dmg = Math.round(dmg * (1 - reduction / 100))
    return Math.max(0, dmg)
  }

  function dealPlayerDamage(rawDmg: number, newMistakes: string[], mistakeQ?: string) {
    const dmg = applyIncomingDamage(rawDmg)
    const newPlayerHP = Math.max(0, playerHP - dmg)
    setPlayerHP(newPlayerHP)
    if (mistakeQ) {
      setMistakes(newMistakes)
      setCorrectStreak(0)
    }
    if (dmg > 0) {
      setDamageFlash({ target: 'player', amount: dmg })
      setTimeout(() => setDamageFlash(null), 1200)
    }
    return newPlayerHP
  }

  function markUsed(q: { id?: number; question?: string }) {
    if (q.id != null) usedIdsRef.current.add(Number(q.id))
    const text = (q.question || '').trim()
    if (text) usedTextsRef.current.add(text)
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
    if (atk.cooldown) {
      let cd = atk.cooldown
      if (atk.kind === 'spell') cd = Math.max(0, cd - raceSpellCooldownReduction(playerRace))
      setCooldowns(prev => ({ ...prev, [atk.id]: cd }))
    }

    const pool = poolForAttack(atk, questionBank)
    const fallback = dungeonQuestions()
    const source = pool.length > 0 ? pool : fallback
    if (source.length === 0) return

    const q = pickUnused(
      getDifficultyPool(source, atk.difficulty),
      usedIdsRef.current,
      usedTextsRef.current,
      markUsed,
    )
    if (!q) return

    setChosenAttack(atk)
    setCurrentQ(q)
    setAttackHintIndices(null)
    setSelected(null)
    setInputAnswer('')
    setPhase('player_attack')
  }

  function showItemToast(msg: string) {
    setItemToast(msg)
    setTimeout(() => setItemToast(null), 1400)
  }

  function canUseConsumable(effect: ScrollBattleEffect) {
    if (consumables[effect] <= 0) return false
    if (effect === 'hint') {
      if (selected !== null) return false
      if (phase === 'player_attack' && currentQ && attackHintIndices === null) return true
      if (phase === 'monster_attack' && monsterQ && defenseHintIndices === null) return true
      return false
    }
    return phase === 'choose_attack'
  }

  async function applyConsumable(effect: ScrollBattleEffect) {
    if (!canUseConsumable(effect)) return

    const newInv = { ...consumables, [effect]: consumables[effect] - 1 }
    setConsumables(newInv)

    if (effect === 'hint') {
      if (phase === 'player_attack' && currentQ) {
        setAttackHintIndices(pickHintPair(currentQ.correct_index, currentQ.answers.length))
      } else if (phase === 'monster_attack' && monsterQ) {
        setDefenseHintIndices(pickHintPair(monsterQ.correct_index, monsterQ.answers.length))
      }
      showItemToast('💡 Два варианта — один верный')
      return
    }

    if (effect === 'power') setPowerBuff(true)
    if (effect === 'shield') setShieldActive(true)
    if (effect === 'heal') {
      setPlayerHP(h => Math.min(100, h + HEAL_POTION_HP))
    }
    flash(`${SCROLL_EFFECT_LABELS[effect].icon} ${SCROLL_EFFECT_LABELS[effect].label}!`, '#a99fff', () => setPhase('choose_attack'))
  }

  function calcDamage(base: number, isCrit: boolean, isSpell: boolean, attack: BattleAttack) {
    let baseDmg = base
    if (!isSpell) baseDmg += raceBasicDamageBonus(playerRace)
    let dmg = baseDmg * (1 + skillBonuses.damagePct / 100 + (equipBonuses.damagePct || 0) / 100)
    if (isSpell) dmg *= 1 + (equipBonuses.spellDamagePct || 0) / 100
    if (powerBuff) dmg *= 2
    if (isCrit) dmg *= STREAK_CRIT_MULT
    if (monster) {
      const { mult } = topicDamageMultiplier(attack, dungeonName, monsterProfile(monster.id))
      dmg *= mult
    }
    return Math.round(dmg)
  }

  function tryBossEnrage(hp: number, maxHp: number): boolean {
    if (!monster || bossEnraged || hp > maxHp * BOSS_ENRAGE_HP_RATIO) return false
    if (!monsterProfile(monster.id).enrage) return false
    setBossEnraged(true)
    recomputeMonsterStats(stanceStacks, true)
    setItemToast('🔥 Ярость! Тот же враг — быстрее и сильнее')
    setTimeout(() => setItemToast(null), 2800)
    return true
  }

  async function applyPlayerHit(correct: boolean, newMistakes: string[]) {
    if (!chosenAttack) return

    let newEnemyHP = enemyHP
    let newPlayerHP = playerHP
    let newStreak = correctStreak

    if (correct) {
      newStreak = correctStreak + 1
      const isCrit = newStreak >= STREAK_CRIT_THRESHOLD
      const dmg = calcDamage(chosenAttack.dmg, isCrit, chosenAttack.kind === 'spell', chosenAttack)
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
      const mq = pickUnused(
        getDifficultyPool(dungeonQuestions(), 'medium'),
        usedIdsRef.current,
        usedTextsRef.current,
        markUsed,
      )
      if (!mq) { endBattle('win', newMistakes, chosenAttack.kind === 'spell'); return }
      setMonsterQ(mq)
      setDefenseHintIndices(null)
      setPhase('monster_attack')
    }, 800)
  }

  async function recordAnswer(q: any, correct: boolean) {
    if (!currentUser) return
    await supabase.rpc('increment_answers', { user_id: currentUser.id })
    await recordBattleAttempt(supabase, {
      userId: currentUser.id,
      questionId: q.id ?? q.question,
      isCorrect: correct,
      dungeonName,
    })
  }

  async function handleAttack(idx: number) {
    if (selected !== null || !currentQ || !chosenAttack) return
    setSelected(idx)
    const correct = idx === currentQ.correct_index
    await recordAnswer(currentQ, correct)
    const newMistakes = correct ? mistakes : [...mistakes, currentQ.question]
    if (!correct) setMistakes(newMistakes)
    await applyPlayerHit(correct, newMistakes)
  }

  async function handleAttackHard() {
    if (selected !== null || !inputAnswer || !currentQ || !chosenAttack) return
    const correct = answersMatch(inputAnswer, currentQ.answers[currentQ.correct_index])
    await recordAnswer(currentQ, correct)
    setSelected(correct ? currentQ.correct_index : -1)
    setInputAnswer('')
    const newMistakes = correct ? mistakes : [...mistakes, currentQ.question]
    if (!correct) setMistakes(newMistakes)

    if (correct) {
      const newStreak = correctStreak + 1
      const isCrit = newStreak >= STREAK_CRIT_THRESHOLD
      const dmg = calcDamage(Math.round(chosenAttack.dmg * 1.5), isCrit, chosenAttack.kind === 'spell', chosenAttack)
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
        const mq = pickUnused(
        getDifficultyPool(dungeonQuestions(), 'medium'),
        usedIdsRef.current,
        usedTextsRef.current,
        markUsed,
      )
        setMonsterQ(mq)
        setDefenseHintIndices(null)
        setPhase('monster_attack')
      }, 800)
    } else {
      await applyPlayerHit(false, newMistakes)
    }
  }

  async function handleDefend(idx: number, timeout = false) {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!monsterQ || !monster) return

    const correct = !timeout && idx === monsterQ.correct_index
    await recordAnswer(monsterQ, correct)
    const profile = monsterProfile(monster.id)
    let newMistakes = [...mistakes]

    if ((shieldActive || skillShieldActive) && !correct && !timeout) {
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

    const finishRound = (newPlayerHP: number, finalMistakes: string[]) => {
      if (newPlayerHP <= 0) {
        endBattle('lose', finalMistakes)
        return
      }
      tickCooldowns()
      setRoundCount(r => r + 1)
      setPhase('choose_attack')
    }

    // Парирование: уклонение (неверный ответ) безопасно, блок заряжает врага
    if (profile.defendBehavior === 'rage_on_block') {
      if (timeout) {
        playSound('miss')
        const raw = Math.round(monster.timeoutDmg * rageChargeMultiplier(rageChargeStacks))
        setRageChargeStacks(0)
        newMistakes = [...mistakes, monsterQ.question]
        const hp = dealPlayerDamage(raw, newMistakes, monsterQ.question)
        flash(`⏰ Время! -${applyIncomingDamage(raw)} HP`, '#e05555', () => finishRound(hp, newMistakes))
      } else if (correct) {
        playSound('block')
        const newCharge = Math.min(RAGE_CHARGE_MAX, rageChargeStacks + 1)
        setRageChargeStacks(newCharge)
        flash(
          `⚡ Блок заряжает врага (${newCharge}/${RAGE_CHARGE_MAX})! Уклоняйся — другой ответ`,
          '#e0bc6a',
          () => finishRound(playerHP, mistakes),
        )
      } else {
        playSound('block')
        setRageChargeStacks(0)
        flash('💨 Уклонение! Враг промахнулся', '#3db87a', () => finishRound(playerHP, mistakes))
      }
      return
    }

    if (!correct) {
      playSound('miss')
      const raw = Math.round(
        (timeout ? monster.timeoutDmg : monster.attackDmg) * rageChargeMultiplier(rageChargeStacks),
      )
      setRageChargeStacks(0)
      newMistakes = [...mistakes, monsterQ.question]
      const hp = dealPlayerDamage(raw, newMistakes, monsterQ.question)
      flash(
        timeout ? `⏰ Время! -${applyIncomingDamage(raw)} HP` : `💥 ${monster.name} бьёт! -${applyIncomingDamage(raw)} HP`,
        '#e05555',
        () => finishRound(hp, newMistakes),
      )
      return
    }

    // Верный блок
    playSound('block')
    if (profile.defendBehavior === 'stance_on_block') {
      const cap = stanceCap(profile)
      const newStacks = Math.min(cap, stanceStacks + 1)
      setStanceStacks(newStacks)
      recomputeMonsterStats(newStacks, bossEnraged)
      flash(`🛡️ Блок! Стойка ${newStacks}/${cap} — враг сильнее`, '#3db87a', () => finishRound(playerHP, mistakes))
      return
    }

    flash('🛡️ Заблокировано!', '#3db87a', () => finishRound(playerHP, mistakes))
  }

  async function restoreUnusedConsumables() {
    if (consumablesRestoredRef.current) return
    consumablesRestoredRef.current = true
    clearBattleLoadout()

    const remaining = consumablesRef.current
    const hasAny = CONSUMABLE_EFFECTS.some(k => remaining[k] > 0)
    if (!hasAny) return

    let userId = currentUser?.id
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }
    if (!userId) return

    const { data } = await supabase.from('users').select('consumables').eq('id', userId).single()
    const dbInv = parseConsumables(data?.consumables)
    const newInv = addInventory(dbInv, remaining)
    await supabase.from('users').update({ consumables: newInv }).eq('id', userId)
  }

  async function endBattle(result: 'win' | 'lose', finalMistakes: string[], spellKill = false) {
    await restoreUnusedConsumables()
    const score = roundCount + 1 - finalMistakes.length
    const spellParam = result === 'win' && spellKill ? '&spell=1' : ''
    const championParam = result === 'win' && isBossMonster(monster) ? '&champion=1' : ''
    router.push(
      `/debrief?result=${result}&score=${Math.max(0, score)}&total=${roundCount + 1}&mistakes=${encodeURIComponent(finalMistakes.join('|'))}&dungeon=${encodeURIComponent(dungeonName)}${hardMode ? '&hard=true' : ''}${spellParam}${championParam}`,
    )
  }

  async function fleeDungeon() {
    await restoreUnusedConsumables()
    router.push('/guild')
  }

  if (loading) return <LoadingScreen flavor="dungeon" />

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
    <div className={layout.battleShell}>

      <div className={layout.battleHud} style={{ flexDirection: 'column', gap: '6px', padding: '0.5rem 0.75rem', background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="lf-battle-hud-row">
          <div className={`lf-battle-hud-streak${correctStreak >= STREAK_CRIT_THRESHOLD ? ' lf-battle-hud-streak--crit' : ''}`}>
            🔥 {correctStreak}{correctStreak >= STREAK_CRIT_THRESHOLD ? ' ⚡' : ''}
          </div>
          <div className="lf-battle-hud-items">
            {BATTLE_CONSUMABLES.map(c => {
              const meta = SCROLL_EFFECT_LABELS[c.effect]
              const qty = consumables[c.effect]
              const canUse = canUseConsumable(c.effect)
              if (qty === 0) return null
              return (
                <div
                  key={c.effect}
                  className={`lf-battle-hud-item${canUse ? '' : ' lf-battle-hud-item--disabled'}`}
                  onClick={() => canUse && applyConsumable(c.effect)}
                  title={c.name}
                >
                  {meta.icon}
                  <div className="lf-battle-hud-item-qty">×{qty}</div>
                </div>
              )
            })}
          </div>
          <div
            className={`lf-battle-hud-btn${hardMode ? ' lf-battle-hud-btn--hard-on' : ''}`}
            onClick={() => setHardMode(!hardMode)}
          >
            {hardMode ? '2× XP' : '1×'}
          </div>
          <button
            type="button"
            className={`lf-battle-hud-btn${scratchOpen ? ' lf-battle-hud-btn--scratch-on' : ''}`}
            onClick={() => setScratchOpen(o => !o)}
            aria-label="Черновик для счёта"
            aria-pressed={scratchOpen}
          >
            📝
          </button>
          <button
            type="button"
            className={`lf-battle-hud-btn lf-battle-hud-btn--escape`}
            onClick={() => setConfirmEscape(true)}
            aria-label="Сбежать из данжа"
          >
            🏃
          </button>
        </div>
        {(powerBuff || shieldActive) && (
          <div style={{ fontSize: '10px', color: '#a99fff', fontFamily: 'monospace' }}>
            {powerBuff ? '⚡ ×2 урон ' : ''}{shieldActive ? '🛡 щит' : ''}
          </div>
        )}
        {itemToast && (
          <div style={{ fontSize: '10px', color: '#e0bc6a', fontFamily: 'monospace' }}>{itemToast}</div>
        )}
      </div>

      <style>{`@keyframes fadeUp { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-30px); } }`}</style>

      <div className={`${layout.sidebarL} lf-battle-sidebar lf-sidebar-panel`} style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(224,85,85,0.11)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555' }}>{dungeonName}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c', marginTop: '2px' }}>РАУНД {roundCount + 1}</div>
        </div>

        {monster && currentProfile && (
          <div style={{ background: '#1a1f28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8a849c', marginBottom: '6px' }}>ВРАГ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>{monster.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: '#e6e2f0' }}>
                  {monster.name}
                  {isBossMonster(monster) && <span className="lf-battle-boss-tag">Чемпион</span>}
                </div>
                {bossIntent && (
                  <div style={{ fontSize: '10px', color: '#e0bc6a', marginTop: '4px', lineHeight: 1.4 }}>
                    → {bossIntent.label}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: bossEnraged ? '#e05555' : '#8a849c' }}>
                  {monster.trait}{bossEnraged ? ' · ЯРОСТЬ' : ''} · таймер {monster.defendTimer}s
                </div>
                {stanceStacks > 0 && (
                  <div style={{ fontSize: '10px', color: '#e0bc6a', marginTop: '4px' }}>
                    🛡 Стойка {stanceStacks}/{stanceCap(currentProfile)}
                  </div>
                )}
                {rageChargeStacks > 0 && (
                  <div style={{ fontSize: '10px', color: '#e05555', marginTop: '4px' }}>
                    ⚡ Заряд удара ×{rageChargeMultiplier(rageChargeStacks).toFixed(2)}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#7b6cff', marginTop: '6px', lineHeight: 1.45 }}>
                  {currentProfile.tip}
                </div>
                {currentProfile.defendBehavior === 'rage_on_block' && (
                  <div style={{ fontSize: '9px', color: '#e0bc6a', marginTop: '4px', fontFamily: 'monospace' }}>
                    ПАРИРОВАНИЕ: уклонение · не блок
                  </div>
                )}
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
          {powerBuff && <div style={{ marginTop: '6px', fontSize: '11px', color: '#e0bc6a' }}>⚡ Расходник: ×2 урон</div>}
          {shieldActive && <div style={{ marginTop: '4px', fontSize: '11px', color: '#a99fff' }}>🛡 Щит активен</div>}
          {skillBonuses.unlockedNames.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#7b6cff', lineHeight: 1.5 }}>
              ✦ {skillBonuses.damagePct > 0 ? `+${skillBonuses.damagePct}% урон` : ''}
              {skillBonuses.damageReductionPct > 0 ? ` · −${skillBonuses.damageReductionPct}% входящий` : ''}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '8px' }}>Расходники</div>
          <div style={{ fontSize: '10px', color: '#5a5670', marginBottom: '6px', lineHeight: 1.4 }}>
            Из рюкзака · подсказку — на примере (атака/защита)
          </div>
          {itemToast && (
            <div style={{ fontSize: '11px', color: '#e0bc6a', marginBottom: '6px', fontFamily: 'monospace' }}>{itemToast}</div>
          )}
          {BATTLE_CONSUMABLES.filter(c => consumables[c.effect] > 0).map(c => {
            const meta = SCROLL_EFFECT_LABELS[c.effect]
            const qty = consumables[c.effect]
            const canUse = canUseConsumable(c.effect)
            return (
              <div
                key={c.effect}
                onClick={() => canUse && applyConsumable(c.effect)}
                style={{
                  padding: '8px 10px', marginBottom: '4px', background: canUse ? '#1c1f2a' : '#161820',
                  border: `1px solid ${canUse ? 'rgba(169,159,255,0.25)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: '7px', cursor: canUse ? 'pointer' : 'default', opacity: qty === 0 ? 0.35 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#c8c0d8' }}>{meta.icon} {c.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: qty > 0 ? '#a99fff' : '#5a5670' }}>×{qty}</div>
                </div>
                <div style={{ fontSize: '10px', color: '#8a849c' }}>{c.shortDesc}</div>
              </div>
            )
          })}
          {BATTLE_CONSUMABLES.every(c => consumables[c.effect] === 0) && (
            <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic' }}>Рюкзак пуст</div>
          )}
        </div>

        <div onClick={() => setHardMode(!hardMode)} style={{ padding: '7px 10px', background: hardMode ? 'rgba(201,168,76,0.12)' : '#1c1f2a', border: `1px solid ${hardMode ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '7px', fontFamily: 'monospace', fontSize: '11px', color: hardMode ? '#e0bc6a' : '#8a849c', cursor: 'pointer', textAlign: 'center' }}>
          {hardMode ? '⚡ ХАРД 2x XP' : 'ОБЫЧНЫЙ'}
        </div>

        <button
          type="button"
          className={`lf-battle-sidebar-scratch${scratchOpen ? ' lf-battle-sidebar-scratch--open' : ''}`}
          onClick={() => setScratchOpen(o => !o)}
        >
          📝 Черновик · столбик
        </button>

        <div style={{ marginTop: 'auto' }}>
          <button
            type="button"
            className="lf-battle-sidebar-escape"
            onClick={() => setConfirmEscape(true)}
          >
            🏃 Бежать
          </button>
        </div>
      </div>

      <div className={`${layout.main} lf-battle-main`}>
        <StudyProgressChip />
        <div className="lf-battle-vs" style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '0.65rem', alignItems: 'center', flexShrink: 0 }}>
          <div className="lf-battle-vs-card" style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            {damageFlash?.target === 'player' && (
              <div style={{ position: 'absolute', top: '-10px', left: '20px', fontFamily: 'monospace', fontSize: '30px', color: '#e05555', fontWeight: 'bold', animation: 'fadeUp 1.2s ease-out forwards', zIndex: 10 }}>
                -{damageFlash.amount}
              </div>
            )}
            <div className="lf-battle-avatar" style={{ fontSize: '32px' }}>🧙</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e6e2f0', marginBottom: '5px' }}>Аркан</div>
              <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ height: '100%', background: playerHP > 40 ? '#3db87a' : '#e0bc6a', width: `${playerHP}%`, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c' }}>{playerHP} / 100 HP</div>
            </div>
          </div>
          <div className="lf-battle-vs-mid" style={{ fontFamily: 'serif', fontSize: '20px', color: '#5a5670', textAlign: 'center' }}>⚔️</div>
          <div className="lf-battle-vs-card" style={{ background: 'rgba(224,85,85,0.04)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '10px', padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'row-reverse', position: 'relative' }}>
            {damageFlash?.target === 'enemy' && (
              <div style={{ position: 'absolute', top: '-10px', right: '20px', fontFamily: 'monospace', fontSize: '30px', color: '#e05555', fontWeight: 'bold', animation: 'fadeUp 1.2s ease-out forwards', zIndex: 10 }}>
                -{damageFlash.amount}
              </div>
            )}
            <div className="lf-battle-avatar" style={{ fontSize: '32px' }}>{monster?.icon ?? '👹'}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555', marginBottom: '2px' }}>
                {monster?.name ?? 'Демон'}
                {monster && isBossMonster(monster) && (
                  <span className="lf-battle-boss-tag">Чемпион</span>
                )}
              </div>
              <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px' }}>
                <div style={{ height: '100%', background: '#e05555', width: `${(enemyHP / enemyMaxHP) * 100}%`, transition: 'width 0.4s', marginLeft: 'auto' }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c' }}>{enemyHP} / {enemyMaxHP} HP</div>
            </div>
          </div>
        </div>

        {bossIntent && (
          <div className="lf-battle-intent">
            <div className="lf-battle-intent-label">Намерение · {bossIntent.label}</div>
            <div className="lf-battle-intent-hint">{bossIntent.hint}</div>
          </div>
        )}

        <div className="lf-battle-stage">
        {phase === 'result_flash' && (
          <div style={{ background: '#1c1f2a', border: `1px solid ${flashColor}`, borderRadius: '10px', padding: '1rem', textAlign: 'center', fontFamily: 'serif', fontSize: '22px', color: flashColor }}>
            {flashMsg}
          </div>
        )}

        {phase === 'choose_attack' && (
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.15em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '6px' }}>▸ Атаки</div>
            <div className="lf-stack-attacks" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {basicAttacks.map(atk => {
                const cd = cooldowns[atk.id] ?? 0
                const locked = cd > 0
                const topicHint = monster
                  ? topicDamageMultiplier(atk, dungeonName, monsterProfile(monster.id))
                  : { mult: 1, label: null }
                return (
                  <div key={atk.id} onClick={() => !locked && chooseAttack(atk)}
                    className="lf-battle-attack-card"
                    style={{ background: locked ? '#161820' : '#1c1f2a', border: `1px solid ${locked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '0.75rem 0.5rem', textAlign: 'center', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1 }}>
                    <div className="lf-battle-attack-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>{atk.icon}</div>
                    <div style={{ fontSize: '13px', color: '#e6e2f0', marginBottom: '2px' }}>{atk.label}</div>
                    <div className="lf-battle-attack-desc" style={{ fontSize: '11px', color: '#8a849c', marginBottom: '8px' }}>{atk.desc}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '16px', color: atk.color }}>+{atk.dmg}</div>
                    {topicHint.label && (
                      <div style={{ fontSize: '9px', marginTop: '4px', color: topicHint.mult > 1 ? '#3db87a' : '#e05555', fontFamily: 'monospace' }}>
                        {topicHint.label}
                      </div>
                    )}
                    {locked && <div style={{ fontSize: '10px', color: '#e05555', marginTop: '4px' }}>⏳ {cd}</div>}
                  </div>
                )
              })}
            </div>

            {spellAttacks.length > 0 && (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.15em', color: '#8a849c', textTransform: 'uppercase', margin: '8px 0 6px' }}>▸ Заклинания</div>
                <div className="lf-battle-spells-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                  {spellAttacks.map(atk => {
                    const cd = cooldowns[atk.id] ?? 0
                    const locked = cd > 0
                    const topicHint = monster
                      ? topicDamageMultiplier(atk, dungeonName, monsterProfile(monster.id))
                      : { mult: 1, label: null }
                    return (
                      <div key={atk.id} onClick={() => !locked && chooseAttack(atk)}
                        className="lf-battle-spell-card"
                        style={{ background: locked ? '#161820' : 'rgba(123,108,255,0.08)', border: `1px solid ${locked ? 'rgba(255,255,255,0.04)' : 'rgba(169,159,255,0.35)'}`, borderRadius: '10px', padding: '0.65rem', textAlign: 'center', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1 }}>
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{atk.icon}</div>
                        <div style={{ fontSize: '12px', color: '#e6e2f0', marginBottom: '2px' }}>{atk.label}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px', color: atk.color }}>+{atk.dmg}</div>
                        {topicHint.label && (
                          <div style={{ fontSize: '9px', marginTop: '4px', color: topicHint.mult > 1 ? '#3db87a' : '#e05555', fontFamily: 'monospace' }}>
                            {topicHint.label}
                          </div>
                        )}
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
              <div className="lf-battle-question" style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{currentQ.question}</div>
            </div>
            {chosenAttack.id === 'heavy' ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  inputMode="text"
                  value={inputAnswer}
                  onChange={e => setInputAnswer(sanitizeAnswerInput(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleAttackHard()}
                  placeholder={typedAnswerPlaceholder}
                  disabled={selected !== null}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: '#1c1f2a',
                    border: '1px solid rgba(224,85,85,0.45)',
                    borderRadius: '9px',
                    padding: '14px',
                    fontSize: '22px',
                    color: '#e6e2f0',
                    fontFamily: 'serif',
                    outline: 'none',
                  }}
                />
                <div
                  onClick={handleAttackHard}
                  style={{
                    padding: '14px 24px',
                    background: 'rgba(224,85,85,0.12)',
                    border: '1px solid rgba(224,85,85,0.4)',
                    borderRadius: '9px',
                    fontSize: '18px',
                    cursor: selected !== null ? 'default' : 'pointer',
                    color: '#e05555',
                  }}
                >
                  ✓
                </div>
              </div>
            ) : hardMode ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  inputMode="text"
                  value={inputAnswer}
                  onChange={e => setInputAnswer(sanitizeAnswerInput(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleAttackHard()}
                  placeholder={typedAnswerPlaceholder}
                  disabled={selected !== null}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: '#1c1f2a',
                    border: '1px solid rgba(123,108,255,0.35)',
                    borderRadius: '9px',
                    padding: '14px',
                    fontSize: '22px',
                    color: '#e6e2f0',
                    fontFamily: 'serif',
                    outline: 'none',
                  }}
                />
                <div
                  onClick={handleAttackHard}
                  style={{
                    padding: '14px 24px',
                    background: 'rgba(201,168,76,0.12)',
                    border: '1px solid rgba(201,168,76,0.35)',
                    borderRadius: '9px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#e0bc6a',
                  }}
                >
                  ✓
                </div>
              </div>
            ) : (
              <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                {currentQ.answers.map((ans: string, idx: number) => {
                  const isHint = isHintHighlighted(attackHintIndices, idx)
                  let bg = '#1c1f2a', border = 'rgba(255,255,255,0.06)', color = '#e6e2f0'
                  if (selected !== null) {
                    if (idx === currentQ.correct_index) { bg = 'rgba(45,217,184,0.06)'; border = 'rgba(45,217,184,0.4)'; color = '#2dd9b8' }
                    else if (idx === selected) { bg = 'rgba(224,85,85,0.06)'; border = 'rgba(224,85,85,0.35)'; color = '#e05555' }
                  } else if (isHint) {
                    bg = 'rgba(201,168,76,0.1)'; border = 'rgba(201,168,76,0.45)'; color = '#e0bc6a'
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
              <div className="lf-battle-question" style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{monsterQ.question}</div>
              <div style={{ fontSize: '12px', color: '#8a849c', marginTop: '8px' }}>
                {currentProfile?.defendBehavior === 'rage_on_block'
                  ? 'Уклонение: неверный ответ · блок заряжает врага · таймаут −' + monster.attackDmg + ' HP'
                  : `Верный ответ блокирует · ошибка −${monster.attackDmg} HP`}
              </div>
            </div>
            <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              {monsterQ.answers.map((ans: string, idx: number) => {
                const isHint = isHintHighlighted(defenseHintIndices, idx)
                const bg = isHint ? 'rgba(201,168,76,0.1)' : '#1c1f2a'
                const border = isHint ? 'rgba(201,168,76,0.45)' : 'rgba(224,85,85,0.2)'
                const color = isHint ? '#e0bc6a' : '#e6e2f0'
                return (
                  <div key={idx} onClick={() => handleDefend(idx)}
                    style={{ background: bg, border: `1px solid ${border}`, borderRadius: '9px', padding: '14px', textAlign: 'center', fontFamily: 'serif', fontSize: '24px', color, cursor: 'pointer' }}>
                    {ans}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </div>

      <BattleScratchPad open={scratchOpen} onOpenChange={setScratchOpen} />

      {confirmEscape && (
        <div className="lf-battle-escape-overlay" role="dialog" aria-modal="true" aria-labelledby="lf-battle-escape-title">
          <div className="lf-battle-escape-dialog">
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏃</div>
            <div id="lf-battle-escape-title" style={{ fontFamily: 'serif', fontSize: '20px', color: '#e6e2f0', marginBottom: '20px' }}>
              Сбежать из данжа?
            </div>
            <div className="lf-battle-escape-actions">
              <button type="button" className="lf-battle-escape-btn lf-battle-escape-btn--stay" onClick={() => setConfirmEscape(false)}>
                Остаться
              </button>
              <button type="button" className="lf-battle-escape-btn lf-battle-escape-btn--run" onClick={() => fleeDungeon()}>
                Бежать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Battle() {
  return (
    <Suspense fallback={<LoadingScreen flavor="dungeon" />}>
      <BattleContent />
    </Suspense>
  )
}
