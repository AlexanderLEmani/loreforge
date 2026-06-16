'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useMemo, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'
import { LoadingScreen } from '@/components/LoadingScreen'
import {
  type BattleAttack,
  type Monster,
  type ScrollBattleEffect,
  BATTLE_ATTACKS,
  getAttacksForBattle,
  getUnlockedTopics,
  isTypedScrollAttack,
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
  readBattleSpellScroll,
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
import SoundToggle from '@/components/SoundToggle'
import { playSound, soundOnAnswerInput, soundOnEnterKey, warmupAudio } from '@/lib/sounds'
import { allDungeonDbNames, isPackDungeon, resolveDungeonParam } from '@/lib/dungeons'
import { dungeonById } from '@/lib/guild-dungeons'
import { buildSwarmRoundFromQuestions, swarmAssignmentCorrect, type SwarmRoundData } from '@/lib/swarm-round'
import { track } from '@/lib/analytics'
import { debriefHref, stashDebriefPayload } from '@/lib/battle-debrief-transfer'
import {
  isBossMonster,
  resolveBossIntent,
} from '@/lib/boss-system'
import {
  advanceWindupAfterPlayerTurn,
  applyDamageToEnemy,
  applyMinionFrenzy,
  buildBossSquad,
  buildPackSquad,
  enemyFromMonster,
  healSquadEnemy,
  livingEnemies,
  lifestealHeal,
  pickSquadAttackPlan,
  profileMonsterId,
  resetWindupAfterStrike,
  squadAttackDamage,
  squadHasChampion,
  squadLeader,
  startWindupCharge,
  isSquadDefeated,
  type BattleEnemy,
  type SquadAttackPlan,
} from '@/lib/battle-squad'
import {
  applyStanceToMonster,
  dodgeChipDamage,
  DODGE_TIMER_SEC,
  monsterProfile,
  PLAYER_STANCE_DMG_PER_STACK,
  PLAYER_STANCE_MAX,
  rageChargeMultiplier,
  RAGE_CHARGE_MAX,
  stanceCap,
  topicDamageMultiplier,
} from '@/lib/monster-mechanics'
import {
  addSpellScroll,
  canUseSpellScroll,
  parseSpellScrolls,
  scrollAttackForBattle,
  spellScrollDef,
  subtractSpellScroll,
  type SpellScrollId,
} from '@/lib/battle-spell-scrolls'

type Phase = 'choose_attack' | 'player_attack' | 'monster_attack' | 'dodge_attempt' | 'swarm_attack' | 'result_flash'

function BattleContent() {
  const router = useRouter()
  const supabase = createClient()
  const params = useSearchParams()
  const dungeonEntry = resolveDungeonParam(params.get('dungeon'))
  const dungeonId = dungeonEntry.id
  const dungeonDbName = dungeonEntry.dbName
  const dungeonLabel = dungeonById(dungeonId)?.name ?? dungeonDbName
  const typedAnswerPlaceholder = dungeonId === 'frac' ? '2/3, ½ или 0…' : 'Введи ответ…'

  const [questionBank, setQuestionBank] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLevel, setUserLevel] = useState(1)
  const [playerRace, setPlayerRace] = useState('human')
  const [monster, setMonster] = useState<Monster | null>(null)
  const [squad, setSquad] = useState<BattleEnemy[]>([])
  const [targetUid, setTargetUid] = useState('')
  const [attackPlan, setAttackPlan] = useState<SquadAttackPlan | null>(null)
  const [phase, setPhase] = useState<Phase>('choose_attack')
  const [chosenAttack, setChosenAttack] = useState<BattleAttack | null>(null)
  const [currentQ, setCurrentQ] = useState<any>(null)
  const [monsterQ, setMonsterQ] = useState<any>(null)
  const [dodgeQ, setDodgeQ] = useState<any>(null)
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
  const defendBusyRef = useRef(false)
  const dodgePendingRef = useRef<{ rawHit: number; skippedQuestion: string; chipApplied: number } | null>(null)
  const [dodgePending, setDodgePending] = useState<{ rawHit: number; skippedQuestion: string; chipApplied: number } | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [damageFlash, setDamageFlash] = useState<{ target: 'player' | 'enemy'; amount: number; enemyUid?: string } | null>(null)
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
  const [playerStanceStacks, setPlayerStanceStacks] = useState(0)
  const [unlockedSkillNodeIds, setUnlockedSkillNodeIds] = useState<number[]>([])
  const [battleSpellScroll, setBattleSpellScroll] = useState<SpellScrollId | null>(null)
  const [swarmRound, setSwarmRound] = useState<SwarmRoundData | null>(null)
  const [swarmAssignments, setSwarmAssignments] = useState<(number | null)[]>([])
  const [swarmSelectedPool, setSwarmSelectedPool] = useState<number | null>(null)
  const baseMonsterRef = useRef<{ attackDmg: number; timeoutDmg: number; defendTimer: number } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const consumablesRef = useRef<ConsumableInventory>(EMPTY_CONSUMABLES)
  const consumablesRestoredRef = useRef(false)
  const spellScrollUsedRef = useRef(false)
  const [spellScrollUsed, setSpellScrollUsed] = useState(false)
  const spellScrollRestoredRef = useRef(false)
  const initialSpellScrollRef = useRef<SpellScrollId | null>(null)
  const battleTrackedRef = useRef(false)

  useStudyTimer(!loading && monster !== null)

  useEffect(() => {
    consumablesRef.current = consumables
  }, [consumables])

  useEffect(() => {
    const warm = () => { void warmupAudio() }
    window.addEventListener('pointerdown', warm, { once: true })
    return () => window.removeEventListener('pointerdown', warm)
  }, [])

  const unlockedTopics = useMemo(() => getUnlockedTopics(userLevel), [userLevel])
  const currentProfile = useMemo(
    () => (monster ? monsterProfile(monster.id) : null),
    [monster],
  )
  const availableAttacks = useMemo(
    () => getAttacksForBattle(userLevel, dungeonDbName, unlockedTopics),
    [userLevel, dungeonDbName, unlockedTopics],
  )
  const scrollSpellAttack = useMemo(() => {
    if (!battleSpellScroll || spellScrollUsed) return null
    if (!canUseSpellScroll(battleSpellScroll, unlockedSkillNodeIds, {
      scroll_twin_strike: 1,
      scroll_fireball: 1,
      scroll_storm_lance: 1,
      scroll_arcane_burst: 1,
      scroll_dark_sigil: 1,
    })) return null
    return scrollAttackForBattle(battleSpellScroll, BATTLE_ATTACKS)
  }, [battleSpellScroll, unlockedSkillNodeIds, spellScrollUsed])
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

  useEffect(() => {
    async function load() {
      const dungeonsToLoad = allDungeonDbNames()
      const bank: Record<string, any[]> = {}
      for (const d of dungeonsToLoad) {
        const { data } = await supabase.from('questions').select('*').eq('dungeon_name', d).limit(120)
        const merged = mergeWithFallback(d, data || []).map(normalizeQuestionDifficulty)
        bank[d] = shuffleQuestions(merged)
      }
      if (!bank[dungeonDbName]?.length) {
        const merged = mergeWithFallback(dungeonDbName, []).map(normalizeQuestionDifficulty)
        bank[dungeonDbName] = shuffleQuestions(merged)
      }
      setQuestionBank(bank)

      const loadout = readBattleLoadout(dungeonId)
      if (loadout === null) {
        router.replace(`/prepare?dungeon=${encodeURIComponent(dungeonId)}`)
        return
      }
      setConsumables(loadoutToInventory(loadout))
      setBattleSpellScroll(readBattleSpellScroll(dungeonId))
      initialSpellScrollRef.current = readBattleSpellScroll(dungeonId)

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
        setSkillBonuses(computeBattleBonuses(dungeonDbName, nodesByIds(unlockedIds, nodes)))

        setUnlockedSkillNodeIds(unlockedIds.map(id => Number(id)).filter(n => !Number.isNaN(n)))

        const equipped = await loadEquipped(user.id)
        setEquipBonuses(computeEquipBonuses(equipped))

        const { count: winCount } = await supabase
          .from('dungeon_runs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('dungeon_name', dungeonDbName)
          .eq('result', 'win')
        dungeonWins = winCount ?? 0
      }

      const m = isPackDungeon(dungeonId) ? null : pickMonster(dungeonDbName, dungeonWins)
      const squadBuilt = isPackDungeon(dungeonId)
        ? buildPackSquad(dungeonDbName)
        : m && isBossMonster(m)
          ? buildBossSquad(m)
          : m
            ? [enemyFromMonster(m)]
            : buildPackSquad(dungeonDbName)
      const leader = squadLeader(squadBuilt)!
      baseMonsterRef.current = { ...leader.baseStats }
      setStanceStacks(0)
      setRageChargeStacks(0)
      setBossEnraged(false)
      setSquad(squadBuilt)
      setTargetUid(leader.uid)
      setAttackPlan(null)
      setMonster(leader.monster)
      setEnemyHP(leader.hp)
      setEnemyMaxHP(leader.maxHp)
      if (isPackDungeon(dungeonId)) {
        setItemToast(`👥 Отряд ${squadBuilt.length} врагов · выбери цель`)
        setTimeout(() => setItemToast(null), 3600)
      } else if (m && isBossMonster(m)) {
        const minionCount = squadBuilt.length - 1
        setItemToast(
          minionCount > 0
            ? `⚔ Чемпион + ${minionCount} подручн. · выбери цель`
            : '⚔ Чемпион данжа — смотри намерение',
        )
        setTimeout(() => setItemToast(null), 3600)
      }
      setLoading(false)
    }
    load()
  }, [dungeonDbName, dungeonId])

  useEffect(() => {
    if (loading || !monster || battleTrackedRef.current) return
    battleTrackedRef.current = true
    track('battle_started', { dungeon: dungeonId })
  }, [loading, monster, dungeonId])

  useEffect(() => {
    const needsTimer = phase === 'monster_attack' || phase === 'swarm_attack' || phase === 'dodge_attempt'
      || (phase === 'player_attack' && chosenAttack && isTypedScrollAttack(chosenAttack.id))
    if (!needsTimer) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    const maxT = phase === 'dodge_attempt'
      ? DODGE_TIMER_SEC
      : phase === 'player_attack'
        ? 60
        : (attackPlan?.timerSec ?? monster?.defendTimer ?? 15) + (equipBonuses.defendTimerSec || 0) + raceDefendTimerBonus(playerRace)
    setTimer(maxT)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (phase === 'dodge_attempt') handleDodgeAnswer(-1, true)
          else if (phase === 'swarm_attack') finishSwarmRound(true)
          else handleDefend(-1, true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, monsterQ, dodgeQ, chosenAttack, monster, attackPlan, swarmRound])

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
    setSquad(prev => prev.map(e => {
      if (e.role !== 'leader') return e
      const nextMonster = { ...e.monster, attackDmg, timeoutDmg, defendTimer }
      return {
        ...e,
        monster: nextMonster,
        baseStats: { attackDmg, timeoutDmg, defendTimer },
      }
    }))
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
      if (attackPlan) {
        const steal = lifestealHeal(attackPlan, dmg)
        if (steal) {
          setSquad(prev => {
            const healed = healSquadEnemy(prev, steal.uid, steal.amount)
            syncLeaderFromSquad(healed)
            return healed
          })
          showItemToast(`🧛 Лайфстил +${steal.amount} HP`)
        }
      }
    }
    return newPlayerHP
  }

  function markUsed(q: { id?: number; question?: string }) {
    if (q.id != null) usedIdsRef.current.add(Number(q.id))
    const text = (q.question || '').trim()
    if (text) usedTextsRef.current.add(text)
  }

  function dungeonQuestions() {
    return questionBank[dungeonDbName] || []
  }

  function getTargetEnemy(): BattleEnemy | undefined {
    const alive = livingEnemies(squad)
    const picked = alive.find(e => e.uid === targetUid)
    if (picked) return picked
    return squadLeader(alive) ?? alive[0]
  }

  function pickDefaultTargetUid(enemies: BattleEnemy[]): string {
    const alive = livingEnemies(enemies)
    const leader = alive.find(e => e.role === 'leader')
    const minion = alive.find(e => e.role === 'minion')
    return leader?.uid ?? minion?.uid ?? alive[0]?.uid ?? ''
  }

  function ensureValidTarget(enemies: BattleEnemy[]) {
    const alive = livingEnemies(enemies)
    if (!alive.some(e => e.uid === targetUid)) {
      setTargetUid(pickDefaultTargetUid(enemies))
    }
  }

  function syncLeaderFromSquad(enemies: BattleEnemy[]) {
    const leader = squadLeader(enemies)
    if (!leader) return
    setMonster(leader.monster)
    setEnemyHP(leader.hp)
    setEnemyMaxHP(leader.maxHp)
    baseMonsterRef.current = { ...leader.baseStats }
  }

  function profileForTarget(enemy: BattleEnemy) {
    return monsterProfile(profileMonsterId(enemy, squad))
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

  function isScrollSpellKind(attack: BattleAttack) {
    return attack.kind === 'scroll_spell'
  }

  function chooseAttack(atk: BattleAttack, fromScroll = false) {
    if ((cooldowns[atk.id] ?? 0) > 0) return
    if (fromScroll) {
      if (!battleSpellScroll || spellScrollUsed) return
      spellScrollUsedRef.current = true
      setSpellScrollUsed(true)
      setBattleSpellScroll(null)
    }
    if (atk.id === 'dark_sigil') playSound('dark')
    else playSound('tap')
    if (atk.cooldown) {
      let cd = atk.cooldown
      if (atk.kind === 'scroll_spell') cd = Math.max(0, cd - raceSpellCooldownReduction(playerRace))
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
      if (phase === 'dodge_attempt' && dodgeQ && defenseHintIndices === null) return true
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
      } else if (phase === 'dodge_attempt' && dodgeQ) {
        setDefenseHintIndices(pickHintPair(dodgeQ.correct_index, dodgeQ.answers.length))
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
    if (isScrollSpellKind(attack)) dmg *= 1 + (equipBonuses.spellDamagePct || 0) / 100
    if (powerBuff) dmg *= 2
    if (isCrit) dmg *= STREAK_CRIT_MULT
    if (playerStanceStacks > 0) {
      dmg *= 1 + playerStanceStacks * PLAYER_STANCE_DMG_PER_STACK
    }
    if (monster) {
      const target = getTargetEnemy()
      const profileId = target ? profileMonsterId(target, squad) : monster.id
      const { mult } = topicDamageMultiplier(attack, dungeonDbName, monsterProfile(profileId))
      dmg *= mult
    }
    return Math.round(dmg)
  }

  function tryBossEnrage(squadState: BattleEnemy[]): boolean {
    const leader = squadLeader(squadState)
    if (!leader || bossEnraged || leader.hp > leader.maxHp * BOSS_ENRAGE_HP_RATIO) return false
    if (!monsterProfile(leader.monster.id).enrage) return false
    setBossEnraged(true)
    recomputeMonsterStats(stanceStacks, true)
    setItemToast('🔥 Ярость! Лидер — быстрее и сильнее')
    setTimeout(() => setItemToast(null), 2800)
    return true
  }

  function gainPlayerStance() {
    setPlayerStanceStacks(s => Math.min(PLAYER_STANCE_MAX, s + 1))
  }

  function beginMonsterPhase(nextSquad: BattleEnemy[], newMistakes: string[]) {
    const squadWindup = advanceWindupAfterPlayerTurn(nextSquad)
    setSquad(squadWindup)
    syncLeaderFromSquad(squadWindup)

    const alive = livingEnemies(squadWindup)
    const plan = pickSquadAttackPlan(squadWindup, roundCount)
    setAttackPlan(plan)

    if (plan.mode === 'windup_charge' && plan.attackers[0]) {
      const charged = startWindupCharge(squadWindup, plan.attackers[0].uid)
      setSquad(charged)
      syncLeaderFromSquad(charged)
      flash(
        `🔮 ${plan.label}! Сильный удар через 2 твои хода`,
        '#e0bc6a',
        () => {
          tickCooldowns()
          setRoundCount(r => r + 1)
          setPhase('choose_attack')
        },
      )
      return
    }

    const pickQ = (difficulty: 'easy' | 'medium' | 'hard') => {
      const pool = getDifficultyPool(dungeonQuestions(), difficulty)
      return pickUnused(pool, usedIdsRef.current, usedTextsRef.current, markUsed)
    }

    if (plan.mode === 'swarm') {
      const stingCount = plan.swarmHits ?? 3
      const questions: SwarmRoundData['questions'] = []
      for (let i = 0; i < stingCount; i++) {
        const q = pickQ('easy')
        if (!q) {
          endBattle('win', newMistakes, chosenAttack ? isScrollSpellKind(chosenAttack) : false)
          return
        }
        questions.push(q)
      }
      const round = buildSwarmRoundFromQuestions(questions)
      if (!round) {
        endBattle('win', newMistakes, chosenAttack ? isScrollSpellKind(chosenAttack) : false)
        return
      }
      setSwarmRound(round)
      setSwarmAssignments(Array(stingCount).fill(null))
      setSwarmSelectedPool(null)
      setMonsterQ(null)
      setDefenseHintIndices(null)
      defendBusyRef.current = false
      setPhase('swarm_attack')
      return
    }

    const qDifficulty = plan.questionDifficulty ?? 'medium'
    const mq = pickQ(qDifficulty)
    if (!mq) {
      endBattle('win', newMistakes, chosenAttack ? isScrollSpellKind(chosenAttack) : false)
      return
    }
    if (plan.mode === 'windup_strike' && plan.attackers[0]) {
      setSquad(prev => resetWindupAfterStrike(prev, plan.attackers[0].uid))
      syncLeaderFromSquad(resetWindupAfterStrike(squadWindup, plan.attackers[0].uid))
    }
    setMonsterQ(mq)
    setDefenseHintIndices(null)
    defendBusyRef.current = false
    setPhase('monster_attack')
  }

  async function applyPlayerHit(correct: boolean, newMistakes: string[]) {
    if (!chosenAttack) return

    const target = getTargetEnemy()
    if (!target) return

    let nextSquad = squad
    let newStreak = correctStreak

    if (correct) {
      newStreak = correctStreak + 1
      const isCrit = newStreak >= STREAK_CRIT_THRESHOLD
      const dmg = calcDamage(chosenAttack.dmg, isCrit, isScrollSpellKind(chosenAttack), chosenAttack)
      playSound('hit')
      nextSquad = applyDamageToEnemy(squad, target.uid, dmg)
      if (target.role === 'leader' && !nextSquad.some(e => e.role === 'leader' && e.hp > 0)) {
        const hasMinions = nextSquad.some(e => e.role === 'minion' && e.hp > 0)
        if (hasMinions) {
          nextSquad = applyMinionFrenzy(nextSquad)
          showItemToast('🔥 Лидер повержен! Подручники: −HP, +атака')
          setTimeout(() => setItemToast(null), 3200)
        }
      }
      setSquad(nextSquad)
      syncLeaderFromSquad(nextSquad)
      ensureValidTarget(nextSquad)
      setDamageFlash({ target: 'enemy', amount: dmg, enemyUid: target.uid })
      setTimeout(() => setDamageFlash(null), 1200)
      setCorrectStreak(newStreak)
      setPowerBuff(false)
      setPlayerStanceStacks(0)
      if (skillBonuses.shieldOnCorrect) setSkillShieldActive(true)
    } else {
      playSound('miss')
      newStreak = 0
      setCorrectStreak(0)
      if (chosenAttack.id === 'dark_sigil') {
        const selfDmg = 40
        const newPlayerHP = Math.max(0, playerHP - selfDmg)
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
      if (isSquadDefeated(nextSquad)) {
        endBattle('win', newMistakes, chosenAttack.kind === 'spell')
        return
      }
      tryBossEnrage(nextSquad)
      beginMonsterPhase(nextSquad, newMistakes)
    }, 800)
  }

  async function recordAnswer(q: any, correct: boolean) {
    if (!currentUser) return
    await supabase.rpc('increment_answers', { user_id: currentUser.id })
    await recordBattleAttempt(supabase, {
      userId: currentUser.id,
      questionId: q.id ?? q.question,
      isCorrect: correct,
      dungeonName: dungeonDbName,
    })
  }

  async function handleAttack(idx: number) {
    if (selected !== null || !currentQ || !chosenAttack) return
    playSound('tap')
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
      const target = getTargetEnemy()
      if (!target) return
      const newStreak = correctStreak + 1
      const isCrit = newStreak >= STREAK_CRIT_THRESHOLD
      const dmg = calcDamage(Math.round(chosenAttack.dmg * 1.5), isCrit, isScrollSpellKind(chosenAttack), chosenAttack)
      playSound('hit')
      let nextSquad = applyDamageToEnemy(squad, target.uid, dmg)
      if (target.role === 'leader' && !nextSquad.some(e => e.role === 'leader' && e.hp > 0)) {
        const hasMinions = nextSquad.some(e => e.role === 'minion' && e.hp > 0)
        if (hasMinions) {
          nextSquad = applyMinionFrenzy(nextSquad)
          showItemToast('🔥 Лидер повержен! Подручники: −HP, +атака')
          setTimeout(() => setItemToast(null), 3200)
        }
      }
      setSquad(nextSquad)
      syncLeaderFromSquad(nextSquad)
      ensureValidTarget(nextSquad)
      setDamageFlash({ target: 'enemy', amount: dmg, enemyUid: target.uid })
      setTimeout(() => setDamageFlash(null), 1200)
      setCorrectStreak(newStreak)
      setPowerBuff(false)
      setPlayerStanceStacks(0)
      setTimeout(() => {
        setSelected(null)
        if (isSquadDefeated(nextSquad)) {
          endBattle('win', newMistakes, isScrollSpellKind(chosenAttack))
          return
        }
        tryBossEnrage(nextSquad)
        beginMonsterPhase(nextSquad, newMistakes)
      }, 800)
    } else {
      await applyPlayerHit(false, newMistakes)
    }
  }

  async function handleDefend(idx: number, timeout = false) {
    if (phase === 'swarm_attack') {
      if (timeout) finishSwarmRound(true)
      return
    }
    if (defendBusyRef.current) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (!monsterQ || !monster) return

    defendBusyRef.current = true
    const correct = !timeout && idx === monsterQ.correct_index
    await recordAnswer(monsterQ, correct)

    const plan = attackPlan ?? pickSquadAttackPlan(livingEnemies(squad), roundCount)
    const primaryAttacker = plan.attackers[0] ?? squadLeader(squad)
    if (!primaryAttacker) {
      defendBusyRef.current = false
      return
    }
    const profile = profileForTarget(primaryAttacker)
    const rageMult = rageChargeMultiplier(rageChargeStacks)
    const rawHit = squadAttackDamage(plan, rageMult, timeout)
    const attackerLabel = plan.mode === 'combo'
      ? plan.attackers.map(a => a.monster.name).join(' + ')
      : primaryAttacker.monster.name

    let newMistakes = [...mistakes]

    if ((shieldActive || skillShieldActive) && !correct && !timeout) {
      setShieldActive(false)
      setSkillShieldActive(false)
      playSound('block')
      flash('🛡️ Щит поглотил удар!', '#3db87a', () => {
        defendBusyRef.current = false
        tickCooldowns()
        setRoundCount(r => r + 1)
        setPhase('choose_attack')
      })
      return
    }

    const finishRound = (newPlayerHP: number, finalMistakes: string[]) => {
      defendBusyRef.current = false
      setAttackPlan(null)
      ensureValidTarget(squad)
      if (newPlayerHP <= 0) {
        endBattle('lose', finalMistakes)
        return
      }
      tickCooldowns()
      setRoundCount(r => r + 1)
      setPhase('choose_attack')
    }

    // Парирование: блок = верный ответ (заряжает), неверный = провал блока, уклонение = кнопка 💨
    if (profile.defendBehavior === 'rage_on_block') {
      if (timeout) {
        playSound('miss')
        setRageChargeStacks(0)
        newMistakes = [...mistakes, monsterQ.question]
        const hp = dealPlayerDamage(rawHit, newMistakes, monsterQ.question)
        flash(`⏰ Время! -${applyIncomingDamage(rawHit)} HP`, '#e05555', () => finishRound(hp, newMistakes))
      } else if (correct) {
        playSound('block')
        const newCharge = Math.min(RAGE_CHARGE_MAX, rageChargeStacks + 1)
        setRageChargeStacks(newCharge)
        flash(
          `🛡 Блок! Заряд врага ${newCharge}/${RAGE_CHARGE_MAX}`,
          '#e0bc6a',
          () => {
            gainPlayerStance()
            finishRound(playerHP, mistakes)
          },
        )
      } else {
        playSound('miss')
        setRageChargeStacks(0)
        newMistakes = [...mistakes, monsterQ.question]
        const hp = dealPlayerDamage(rawHit, newMistakes, monsterQ.question)
        flash(`❌ Провал блока! -${applyIncomingDamage(rawHit)} HP`, '#e05555', () => finishRound(hp, newMistakes))
      }
      return
    }

    if (!correct) {
      playSound('miss')
      setRageChargeStacks(0)
      newMistakes = [...mistakes, monsterQ.question]
      const hp = dealPlayerDamage(rawHit, newMistakes, monsterQ.question)
      flash(
        timeout
          ? `⏰ Время! -${applyIncomingDamage(rawHit)} HP`
          : plan.mode === 'combo'
            ? `💥 ${attackerLabel} вместе! -${applyIncomingDamage(rawHit)} HP`
            : `💥 ${attackerLabel} бьёт! -${applyIncomingDamage(rawHit)} HP`,
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
      flash(`🛡️ Блок! Стойка ${newStacks}/${cap} — враг сильнее`, '#3db87a', () => {
        gainPlayerStance()
        finishRound(playerHP, mistakes)
      })
      return
    }

    gainPlayerStance()
    flash('🛡️ Заблокировано!', '#3db87a', () => finishRound(playerHP, mistakes))
  }

  function beginDodgeAttempt() {
    if (!monsterQ || defendBusyRef.current || phase !== 'monster_attack') return
    const plan = attackPlan ?? pickSquadAttackPlan(livingEnemies(squad), roundCount)
    const primaryAttacker = plan.attackers[0] ?? squadLeader(squad)
    if (!primaryAttacker) return
    const profile = profileForTarget(primaryAttacker)
    if (profile.defendBehavior !== 'rage_on_block') return

    if (timerRef.current) clearInterval(timerRef.current)

    const rageMult = rageChargeMultiplier(rageChargeStacks)
    const rawHit = squadAttackDamage(plan, rageMult, false)
    const chipApplied = applyIncomingDamage(dodgeChipDamage(rawHit))
    const pending = { rawHit, skippedQuestion: monsterQ.question, chipApplied }
    dodgePendingRef.current = pending
    setDodgePending(pending)

    setCorrectStreak(0)
    setRageChargeStacks(0)
    playSound('dodge')

    const dq = pickUnused(
      getDifficultyPool(dungeonQuestions(), 'easy'),
      usedIdsRef.current,
      usedTextsRef.current,
      markUsed,
    )
    setDodgeQ(dq)
    setDefenseHintIndices(null)
    setPhase('dodge_attempt')
  }

  async function handleDodgeAnswer(idx: number, timeout = false) {
    if (defendBusyRef.current || !dodgeQ || !dodgePendingRef.current) return
    defendBusyRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)

    const pending = dodgePendingRef.current
    dodgePendingRef.current = null
    setDodgePending(null)
    const dodgeCorrect = !timeout && idx === dodgeQ.correct_index
    await recordAnswer(dodgeQ, dodgeCorrect)

    const newMistakes = [...mistakes, pending.skippedQuestion]
    let hp = playerHP
    let msg: string
    let color: string

    const finishRound = (playerHp: number, mistakesFinal: string[]) => {
      defendBusyRef.current = false
      setAttackPlan(null)
      setMonsterQ(null)
      setDodgeQ(null)
      ensureValidTarget(squad)
      if (playerHp <= 0) {
        endBattle('lose', mistakesFinal)
        return
      }
      tickCooldowns()
      setRoundCount(r => r + 1)
      setPhase('choose_attack')
    }

    if (dodgeCorrect) {
      const chipRaw = dodgeChipDamage(pending.rawHit)
      const chipApplied = applyIncomingDamage(chipRaw)
      playSound('block')
      hp = dealPlayerDamage(chipRaw, newMistakes, pending.skippedQuestion)
      msg = `💨 Уклонился · −${chipApplied} HP · главный пример в ошибки`
      color = '#e0bc6a'
    } else {
      const fullApplied = applyIncomingDamage(pending.rawHit)
      playSound('miss')
      hp = dealPlayerDamage(pending.rawHit, newMistakes, pending.skippedQuestion)
      msg = timeout
        ? `⏰ Уклонение провалено! −${fullApplied} HP`
        : `💨 Промах при уклонении! −${fullApplied} HP`
      color = '#e05555'
    }

    flash(msg, color, () => finishRound(hp, newMistakes))
  }

  function assignSwarmPair(questionIdx: number, poolIdx: number) {
    if (defendBusyRef.current || !swarmRound) return
    setSwarmAssignments(prev => {
      const next = prev.map(v => (v === poolIdx ? null : v))
      next[questionIdx] = poolIdx
      if (next.every(v => v !== null)) {
        setTimeout(() => finishSwarmRound(false), 150)
      }
      return next
    })
    setSwarmSelectedPool(null)
    playSound('tap')
  }

  async function finishSwarmRound(timeout = false) {
    if (defendBusyRef.current || !swarmRound || !attackPlan) return
    defendBusyRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)

    const hitDmg = attackPlan.swarmDmgPerHit ?? 8
    const newMistakes = [...mistakes]
    let wrongCount = 0
    let correctCount = 0

    for (let i = 0; i < swarmRound.questions.length; i++) {
      const q = swarmRound.questions[i]
      const poolIdx = swarmAssignments[i]
      const correct = !timeout && swarmAssignmentCorrect(swarmRound, i, poolIdx)
      await recordAnswer(q, correct)
      if (correct) {
        correctCount++
      } else {
        wrongCount++
        newMistakes.push(q.question)
      }
    }

    const finishAfterFlash = (hp: number, mistakesFinal: string[]) => {
      defendBusyRef.current = false
      setAttackPlan(null)
      setSwarmRound(null)
      setSwarmAssignments([])
      setSwarmSelectedPool(null)
      ensureValidTarget(squad)
      if (hp <= 0) {
        endBattle('lose', mistakesFinal)
        return
      }
      tickCooldowns()
      setRoundCount(r => r + 1)
      setPhase('choose_attack')
    }

    let hp = playerHP
    const totalRaw = wrongCount * hitDmg

    if (totalRaw > 0) {
      if ((shieldActive || skillShieldActive) && wrongCount > 0) {
        setShieldActive(false)
        setSkillShieldActive(false)
        playSound('block')
        flash('🛡️ Щит поглотил рой!', '#3db87a', () => finishAfterFlash(hp, newMistakes))
        return
      }
      playSound('miss')
      hp = dealPlayerDamage(totalRaw, newMistakes, swarmRound.questions[0]?.question)
    } else {
      playSound('block')
      gainPlayerStance()
    }

    if (hp <= 0) {
      endBattle('lose', newMistakes)
      return
    }

    const msg = timeout
      ? `⏰ Рой! −${applyIncomingDamage(totalRaw)} HP · ${correctCount}/${swarmRound.questions.length} верно`
      : wrongCount === 0
        ? `🐝 Рой отбит! ${correctCount}/${swarmRound.questions.length}`
        : `🐝 Рой! −${applyIncomingDamage(totalRaw)} HP · ${correctCount}/${swarmRound.questions.length} верно`

    flash(msg, wrongCount === 0 ? '#3db87a' : '#e05555', () => finishAfterFlash(hp, newMistakes))
  }

  async function restoreUnusedSpellScroll() {
    if (spellScrollRestoredRef.current) return
    spellScrollRestoredRef.current = true
    const scrollId = initialSpellScrollRef.current
    if (!scrollId || spellScrollUsedRef.current) return

    let userId = currentUser?.id
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }
    if (!userId) return

    const { data } = await supabase.from('users').select('spell_scrolls').eq('id', userId).single()
    const dbInv = parseSpellScrolls(data?.spell_scrolls)
    const newInv = addSpellScroll(dbInv, scrollId, 1)
    await supabase.from('users').update({ spell_scrolls: newInv }).eq('id', userId)
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
    track('battle_ended', {
      dungeon: dungeonId,
      result,
      rounds: roundCount + 1,
      mistakes: finalMistakes.length,
    })
    await restoreUnusedConsumables()
    await restoreUnusedSpellScroll()
    const score = roundCount + 1 - finalMistakes.length
    const payload = {
      result,
      score: Math.max(0, score),
      total: roundCount + 1,
      dungeonId,
      mistakes: finalMistakes,
      hard: hardMode,
      champion: result === 'win' && squadHasChampion(squad),
      spell: result === 'win' && spellKill,
    }
    stashDebriefPayload(payload)
    router.push(debriefHref(payload))
  }

  async function fleeDungeon() {
    track('battle_ended', {
      dungeon: dungeonId,
      result: 'escape',
      rounds: roundCount + 1,
      mistakes: mistakes.length,
    })
    await restoreUnusedConsumables()
    await restoreUnusedSpellScroll()
    router.push('/guild')
  }

  function onDefendButtonClick(e: MouseEvent<HTMLButtonElement>) {
    const idx = parseInt(e.currentTarget.dataset.defendIdx ?? '-1', 10)
    void handleDefend(idx)
  }

  function onDodgeAnswerClick(e: MouseEvent<HTMLButtonElement>) {
    const idx = parseInt(e.currentTarget.dataset.dodgeIdx ?? '-1', 10)
    void handleDodgeAnswer(idx)
  }

  if (loading) return <LoadingScreen flavor="dungeon" />

  if (dungeonQuestions().length === 0) {
    return (
      <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
        Вопросы не найдены для «{dungeonLabel}»
      </div>
    )
  }

  const basicAttacks = availableAttacks.filter(a => a.kind === 'basic')
  const scrollSpellDef = battleSpellScroll ? spellScrollDef(battleSpellScroll) : null

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
          <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555' }}>{dungeonLabel}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a849c', marginTop: '2px' }}>РАУНД {roundCount + 1}</div>
        </div>

        {monster && currentProfile && (
          <div style={{ background: '#1a1f28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8a849c', marginBottom: '6px' }}>
              {squad.length > 1 ? 'ОТРЯД' : 'ВРАГ'}
            </div>
            {squad.length > 1 ? (
              <div className="lf-battle-squad-sidebar">
                {squad.filter(e => e.hp > 0).map(e => (
                  <div key={e.uid} className={`lf-battle-squad-sidebar-row${e.uid === targetUid ? ' lf-battle-squad-sidebar-row--target' : ''}`}>
                    <span style={{ fontSize: '18px' }}>{e.monster.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: e.role === 'leader' ? '#e6e2f0' : '#c8c0d8' }}>
                        {e.monster.name}
                        {e.role === 'leader' && isBossMonster(e.monster) && <span className="lf-battle-boss-tag">Чемпион</span>}
                        {e.role === 'minion' && <span className="lf-battle-minion-tag">подручный</span>}
                      </div>
                      <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ height: '100%', background: '#e05555', width: `${(e.hp / e.maxHp) * 100}%` }} />
                      </div>
                      <div style={{ fontSize: '9px', color: '#5a5670', marginTop: '2px' }}>
                        {e.hp}/{e.maxHp} · {e.monster.defendTimer}s
                        {e.monster.special === 'lifesteal' && ' · 🧛'}
                        {e.monster.special === 'swarm' && ' · 🐝'}
                        {e.frenzy && ' · ярость'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                </div>
              </div>
            )}
            {squad.length > 1 && bossIntent && (
              <div style={{ fontSize: '10px', color: '#e0bc6a', marginTop: '8px', lineHeight: 1.4 }}>
                → {bossIntent.label}
              </div>
            )}
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
            {playerStanceStacks > 0 && (
              <div style={{ fontSize: '10px', color: '#3db87a', marginTop: '4px' }}>
                ⚔ Твоя стойка {playerStanceStacks}/{PLAYER_STANCE_MAX} · +{Math.round(playerStanceStacks * PLAYER_STANCE_DMG_PER_STACK * 100)}% урон
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#7b6cff', marginTop: '6px', lineHeight: 1.45 }}>
              {currentProfile.tip}
            </div>
            {currentProfile.defendBehavior === 'rage_on_block' && (
              <div style={{ fontSize: '9px', color: '#e0bc6a', marginTop: '4px', fontFamily: 'monospace' }}>
                🛡 Блок = верный ответ (заряжает) · 💨 Уклонение = лёгкий пример + ~45% урона
              </div>
            )}
          </div>
        )}

        <div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '8px' }}>Стрик</div>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '10px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', color: correctStreak >= STREAK_CRIT_THRESHOLD ? '#e0bc6a' : '#9590a8' }}>
              {correctStreak} {correctStreak >= STREAK_CRIT_THRESHOLD ? '⚡ КРИТ!' : ''}
            </div>
            <div style={{ fontSize: '10px', color: '#9590a8' }}>{STREAK_CRIT_THRESHOLD} верных → ×{STREAK_CRIT_MULT} урон</div>
            {playerStanceStacks > 0 && (
              <div style={{ fontSize: '10px', color: '#3db87a', marginTop: '6px' }}>
                ⚔ Стойка {playerStanceStacks}/{PLAYER_STANCE_MAX} · блокируй, чтобы копить
              </div>
            )}
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <SoundToggle />
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
          <div className="lf-battle-squad-vs">
            {livingEnemies(squad).length > 0 ? livingEnemies(squad).map(e => {
              const isTarget = e.uid === targetUid
              const canPick = phase === 'choose_attack'
              return (
                <div
                  key={e.uid}
                  className={`lf-battle-squad-card${isTarget ? ' lf-battle-squad-card--target' : ''}${canPick ? ' lf-battle-squad-card--pickable' : ''}`}
                  onClick={() => canPick && setTargetUid(e.uid)}
                >
                  {damageFlash?.target === 'enemy' && damageFlash.enemyUid === e.uid && (
                    <div className="lf-battle-squad-dmg">-{damageFlash.amount}</div>
                  )}
                  <div className="lf-battle-squad-card-inner">
                    <span className="lf-battle-squad-icon">{e.monster.icon}</span>
                    <div className="lf-battle-squad-meta">
                      <div className="lf-battle-squad-name">
                        {e.monster.name}
                        {e.role === 'leader' && isBossMonster(e.monster) && <span className="lf-battle-boss-tag">Чемпион</span>}
                        {e.role === 'minion' && <span className="lf-battle-minion-tag">подручный</span>}
                      </div>
                      <div className="lf-battle-squad-hpbar">
                        <div style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                      </div>
                      <div className="lf-battle-squad-hpnum">{e.hp}/{e.maxHp}</div>
                      {e.windupState === 'charging' && (
                        <div style={{ fontSize: '9px', color: '#e0bc6a', marginTop: '2px' }}>🔮 заряд {e.windupTurns ?? 0}</div>
                      )}
                      {e.windupState === 'ready' && (
                        <div style={{ fontSize: '9px', color: '#e05555', marginTop: '2px' }}>⚡ удар готов!</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="lf-battle-vs-card" style={{ background: 'rgba(224,85,85,0.04)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '10px', padding: '0.65rem 0.75rem' }}>
                <div style={{ fontFamily: 'serif', fontSize: '13px', color: '#e05555' }}>Победа!</div>
              </div>
            )}
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
            {squad.length > 1 && (
              <div className="lf-battle-target-panel">
                <div className="lf-battle-target-label">▸ Цель атаки · кликни на врага</div>
                <div className="lf-battle-target-row">
                  {livingEnemies(squad).map(e => (
                      <button
                        key={e.uid}
                        type="button"
                        className={`lf-battle-target-chip${e.uid === targetUid ? ' lf-battle-target-chip--on' : ''}`}
                        onClick={() => setTargetUid(e.uid)}
                      >
                        <span>{e.monster.icon}</span>
                        <span>{e.monster.name}</span>
                        <span className="lf-battle-target-chip-hp">{e.hp} HP</span>
                      </button>
                    ))}
                </div>
                {(() => {
                  const nextPlan = pickSquadAttackPlan(squad, roundCount)
                  return nextPlan.attackers.length > 0 ? (
                    <div className="lf-battle-next-attack">
                      След. атака: {nextPlan.label}
                      {nextPlan.mode === 'windup_charge' ? ' · заряжает' : nextPlan.mode === 'windup_strike' ? ' · сложный пример' : nextPlan.mode === 'combo' ? ' · короткий таймер' : ` · ${nextPlan.timerSec}s`}
                    </div>
                  ) : null
                })()}
              </div>
            )}
            <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.15em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '6px' }}>▸ Атаки</div>
            <div className="lf-stack-attacks" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
              {basicAttacks.map(atk => {
                const cd = cooldowns[atk.id] ?? 0
                const locked = cd > 0
                const topicHint = (() => {
                  const target = getTargetEnemy()
                  if (!target) return { mult: 1, label: null }
                  return topicDamageMultiplier(atk, dungeonDbName, monsterProfile(profileMonsterId(target, squad)))
                })()
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

            {scrollSpellAttack && scrollSpellDef && (
              <>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.15em', color: '#a99fff', textTransform: 'uppercase', margin: '10px 0 6px' }}>
                  ▸ Свиток в рюкзаке · {scrollSpellDef.masteryLabel}
                </div>
                <div className="lf-battle-spells-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                  {(() => {
                    const atk = scrollSpellAttack
                    const cd = cooldowns[atk.id] ?? 0
                    const locked = cd > 0
                    const topicHint = (() => {
                      const target = getTargetEnemy()
                      if (!target) return { mult: 1, label: null }
                      return topicDamageMultiplier(atk, dungeonDbName, monsterProfile(profileMonsterId(target, squad)))
                    })()
                    return (
                      <div key={atk.id} onClick={() => !locked && chooseAttack(atk, true)}
                        className="lf-battle-spell-card"
                        style={{ background: locked ? '#161820' : 'rgba(123,108,255,0.08)', border: `1px solid ${locked ? 'rgba(255,255,255,0.04)' : 'rgba(169,159,255,0.35)'}`, borderRadius: '10px', padding: '0.65rem', textAlign: 'center', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1 }}>
                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{atk.icon}</div>
                        <div style={{ fontSize: '12px', color: '#e6e2f0', marginBottom: '2px' }}>{atk.label}</div>
                        <div style={{ fontSize: '10px', color: '#8a849c', marginBottom: '4px' }}>1× в бою</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px', color: atk.color }}>+{atk.dmg}</div>
                        {topicHint.label && (
                          <div style={{ fontSize: '9px', marginTop: '4px', color: topicHint.mult > 1 ? '#3db87a' : '#e05555', fontFamily: 'monospace' }}>
                            {topicHint.label}
                          </div>
                        )}
                        {locked && <div style={{ fontSize: '10px', color: '#e05555' }}>⏳ {cd}</div>}
                      </div>
                    )
                  })()}
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
              {isTypedScrollAttack(chosenAttack.id) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', color: timer > 4 ? '#e0bc6a' : '#e05555' }}>{timer}s</div>
                </div>
              )}
              <div className="lf-battle-question" style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{currentQ.question}</div>
            </div>
            {isTypedScrollAttack(chosenAttack.id) ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  inputMode="text"
                  value={inputAnswer}
                  onChange={e => {
                    const next = sanitizeAnswerInput(e.target.value)
                    soundOnAnswerInput(inputAnswer, next)
                    setInputAnswer(next)
                  }}
                  onKeyDown={e => {
                    soundOnEnterKey(e)
                    if (e.key === 'Enter') handleAttackHard()
                  }}
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
                  onChange={e => {
                    const next = sanitizeAnswerInput(e.target.value)
                    soundOnAnswerInput(inputAnswer, next)
                    setInputAnswer(next)
                  }}
                  onKeyDown={e => {
                    soundOnEnterKey(e)
                    if (e.key === 'Enter') handleAttackHard()
                  }}
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

        {phase === 'monster_attack' && monsterQ && monster && (() => {
          const plan = attackPlan ?? pickSquadAttackPlan(livingEnemies(squad), roundCount)
          const primaryAttacker = plan.attackers[0] ?? squadLeader(squad)
          const defendProfile = primaryAttacker ? profileForTarget(primaryAttacker) : currentProfile
          const parryMode = defendProfile?.defendBehavior === 'rage_on_block'
          const rageCharged = bossIntent?.id === 'rage_charge'
          const defendTimerShow = plan.timerSec ?? monster.defendTimer
          const previewDmg = squadAttackDamage(plan, rageChargeMultiplier(rageChargeStacks), false)
          return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#e05555', textTransform: 'uppercase' }}>
                {plan.mode === 'combo' ? '💥 ' : ''}{plan.label} атакует!
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold', color: timer > defendTimerShow / 2 ? '#3db87a' : '#e05555' }}>{timer}s</div>
            </div>
            {parryMode && (
              <div className={`lf-battle-parry-banner${rageCharged ? ' lf-battle-parry-banner--charged' : ''}`}>
                <span className="lf-battle-parry-banner-title">Блок vs уклонение</span>
                <span className="lf-battle-parry-banner-text">
                  🛡 Верный ответ — блок (заряжает врага) · 💨 Уклонение — быстрый пример, ~45% урона и ошибка
                </span>
              </div>
            )}
            <div style={{ background: 'rgba(224,85,85,0.04)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
              <div className="lf-battle-question" style={{ fontFamily: 'serif', fontSize: '42px', color: '#e6e2f0', lineHeight: 1.1 }}>{monsterQ.question}</div>
              <div style={{ fontSize: '12px', color: '#8a849c', marginTop: '8px' }}>
                {parryMode
                  ? '🛡 Верный ответ блокирует · неверный = урон · 💨 уклонение не бесплатно'
                  : plan.mode === 'frenzy'
                    ? `Яростная атака · ошибка −${previewDmg} HP`
                    : plan.mode === 'combo'
                      ? `Совместная атака · ошибка −${previewDmg} HP · таймер короче`
                      : `Верный ответ блокирует · ошибка −${previewDmg} HP`}
              </div>
            </div>
            {parryMode && (
              <button
                type="button"
                className={`lf-battle-dodge-bar${rageCharged ? ' lf-battle-dodge-bar--pulse' : ''}`}
                onClick={beginDodgeAttempt}
              >
                <span className="lf-battle-dodge-bar-icon">💨</span>
                <span className="lf-battle-dodge-bar-label">Уклониться</span>
                <span className="lf-battle-dodge-bar-sub">лёгкий пример · ~45% урона · в ошибки</span>
              </button>
            )}
            <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', marginTop: parryMode ? '10px' : 0 }}>
              {monsterQ.answers.map((ans: string, idx: number) => {
                const isHint = isHintHighlighted(defenseHintIndices, idx)
                let bg = '#1c1f2a'
                let border = 'rgba(224,85,85,0.2)'
                let color = '#e6e2f0'
                if (isHint) {
                  bg = 'rgba(201,168,76,0.1)'
                  border = 'rgba(201,168,76,0.45)'
                  color = '#e0bc6a'
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className="lf-battle-defend-btn"
                    data-defend-idx={idx}
                    onClick={onDefendButtonClick}
                    style={{ background: bg, border: `1px solid ${border}`, color }}
                  >
                    <span className="lf-battle-defend-ans">{ans}</span>
                  </button>
                )
              })}
            </div>
          </div>
          )
        })()}

        {phase === 'dodge_attempt' && dodgeQ && dodgePending && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#e0bc6a', textTransform: 'uppercase' }}>
                💨 Уклонение
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold', color: timer > DODGE_TIMER_SEC / 2 ? '#3db87a' : '#e05555' }}>{timer}s</div>
            </div>
            <div style={{ background: 'rgba(224,188,106,0.06)', border: '1px solid rgba(224,188,106,0.35)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '11px', color: '#8a849c', marginBottom: '8px' }}>
                Отступил от: {dodgePending.skippedQuestion} · пример в ошибки
              </div>
              <div className="lf-battle-question" style={{ fontFamily: 'serif', fontSize: '38px', color: '#e6e2f0', lineHeight: 1.1 }}>{dodgeQ.question}</div>
              <div style={{ fontSize: '12px', color: '#e0bc6a', marginTop: '8px' }}>
                Лёгкий пример · верный ≈ −{dodgePending.chipApplied} HP · промах = полный удар
              </div>
            </div>
            <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              {dodgeQ.answers.map((ans: string, idx: number) => {
                const isHint = isHintHighlighted(defenseHintIndices, idx)
                let bg = '#1c1f2a'
                let border = 'rgba(224,188,106,0.25)'
                let color = '#e6e2f0'
                if (isHint) {
                  bg = 'rgba(201,168,76,0.1)'
                  border = 'rgba(201,168,76,0.45)'
                  color = '#e0bc6a'
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className="lf-battle-defend-btn"
                    data-dodge-idx={idx}
                    onClick={onDodgeAnswerClick}
                    style={{ background: bg, border: `1px solid ${border}`, color }}
                  >
                    <span className="lf-battle-defend-ans">{ans}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {phase === 'swarm_attack' && swarmRound && attackPlan && (
          <div className="lf-battle-swarm">
            <div className="lf-battle-swarm-header">
              <div className="lf-battle-swarm-title">
                🐝 {attackPlan.label} · сопоставь ответы
              </div>
              <div className={`lf-battle-swarm-timer${timer <= Math.ceil((attackPlan.timerSec ?? 12) / 2) ? ' lf-battle-swarm-timer--urgent' : ''}`}>
                {timer}s
              </div>
            </div>
            <div className="lf-battle-swarm-hint">
              Один таймер на все укусы · −{attackPlan.swarmDmgPerHit ?? 8} HP за каждую ошибку · кликни ответ, затем пример
            </div>
            <div className="lf-battle-swarm-questions">
              {swarmRound.questions.map((q, qi) => {
                const assignedPool = swarmAssignments[qi]
                const assignedAns = assignedPool !== null ? swarmRound.answerPool[assignedPool] : null
                return (
                  <button
                    key={`${q.question}-${qi}`}
                    type="button"
                    className={`lf-battle-swarm-q${assignedAns ? ' lf-battle-swarm-q--filled' : ''}${swarmSelectedPool !== null ? ' lf-battle-swarm-q--pickable' : ''}`}
                    onClick={() => {
                      if (swarmSelectedPool !== null) assignSwarmPair(qi, swarmSelectedPool)
                    }}
                  >
                    <span className="lf-battle-swarm-q-text">{q.question}</span>
                    <span className="lf-battle-swarm-q-slot">
                      {assignedAns ?? (swarmSelectedPool !== null ? '← сюда' : 'ответ…')}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="lf-battle-swarm-pool-label">Варианты ответов</div>
            <div className="lf-battle-swarm-pool">
              {swarmRound.answerPool.map((ans, pi) => {
                const usedBy = swarmAssignments.findIndex(v => v === pi)
                const isSelected = swarmSelectedPool === pi
                return (
                  <button
                    key={`${ans}-${pi}`}
                    type="button"
                    disabled={usedBy >= 0 && swarmAssignments[usedBy] === pi}
                    className={`lf-battle-swarm-chip${isSelected ? ' lf-battle-swarm-chip--on' : ''}${usedBy >= 0 ? ' lf-battle-swarm-chip--used' : ''}`}
                    onClick={() => {
                      if (usedBy >= 0) return
                      setSwarmSelectedPool(pi)
                      playSound('tap')
                    }}
                  >
                    {ans}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="lf-battle-swarm-submit"
              disabled={swarmAssignments.some(v => v === null)}
              onClick={() => finishSwarmRound(false)}
            >
              Отразить рой
            </button>
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
