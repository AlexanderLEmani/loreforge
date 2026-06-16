import type { Monster } from '@/lib/battle-config'
import { MONSTERS_BY_DUNGEON, DEFAULT_MONSTERS } from '@/lib/battle-config'
import { isBossMonster } from '@/lib/boss-system'

export type EnemyRole = 'leader' | 'minion'

export type WindupState = 'idle' | 'charging' | 'ready'

export type BattleEnemy = {
  uid: string
  monster: Monster
  hp: number
  maxHp: number
  role: EnemyRole
  baseStats: { attackDmg: number; timeoutDmg: number; defendTimer: number }
  minionKind?: 'fast' | 'brute'
  frenzy?: boolean
  windupState?: WindupState
  windupTurns?: number
}

export type SquadAttackMode = 'single' | 'combo' | 'swarm' | 'frenzy' | 'windup_charge' | 'windup_strike'

export type SquadAttackPlan = {
  attackers: BattleEnemy[]
  mode: SquadAttackMode
  label: string
  timerSec: number
  swarmHits?: number
  swarmDmgPerHit?: number
  questionDifficulty?: 'easy' | 'medium' | 'hard'
}

export const WINDUP_PLAYER_TURNS = 2
export const WINDUP_STRIKE_MULT = 1.75

function windupEnemy(alive: BattleEnemy[]): BattleEnemy | undefined {
  return alive.find(e => e.monster.special === 'windup')
}

function attackableEnemies(alive: BattleEnemy[]): BattleEnemy[] {
  return alive.filter(e => e.windupState !== 'charging')
}

const MINION_LABELS: Record<string, [string, string, string, string]> = {
  golem_add: ['Капля суммы', '🟢', 'Скриб-скриб', '📜'],
  void: ['Тень минуса', '🌑', 'Коллектор', '💸'],
  titan: ['Искра', '⚡', 'Ученик таблицы', '🧙'],
  frac_demon: ['Осколок', '✂️', 'Остаточный дух', '👻'],
  frac_boss: ['Крошка дроби', '🥧', 'Полуэльф', '🧝'],
  pct_boss: ['Скидочник', '🛒', 'Сборщик', '💰'],
}

function minionLabels(leaderId: string, variant: 0 | 1): { name: string; icon: string } {
  const row = MINION_LABELS[leaderId]
  if (row) {
    return variant === 0
      ? { name: row[0], icon: row[1] }
      : { name: row[2], icon: row[3] }
  }
  return variant === 0
    ? { name: 'Подручный', icon: '🐀' }
    : { name: 'Охранник', icon: '💀' }
}

function uid(): string {
  return `e_${Math.random().toString(36).slice(2, 9)}`
}

export function enemyFromMonster(monster: Monster, role: EnemyRole = 'leader'): BattleEnemy {
  return {
    uid: uid(),
    monster,
    hp: monster.hp,
    maxHp: monster.hp,
    role,
    baseStats: {
      attackDmg: monster.attackDmg,
      timeoutDmg: monster.timeoutDmg,
      defendTimer: monster.defendTimer,
    },
  }
}

function createMinion(leader: Monster, variant: 0 | 1, kind: 'fast' | 'brute'): BattleEnemy {
  const labels = minionLabels(leader.id, variant)
  const hpMult = kind === 'fast' ? 0.34 : 0.44
  const dmgMult = kind === 'fast' ? 0.58 : 0.72
  const timerDelta = kind === 'fast' ? -3 : 2
  const monster: Monster = {
    id: `${leader.id}_minion_${variant}`,
    name: labels.name,
    icon: labels.icon,
    hp: Math.max(28, Math.round(leader.hp * hpMult)),
    defendTimer: Math.max(7, leader.defendTimer + timerDelta),
    attackDmg: Math.max(10, Math.round(leader.attackDmg * dmgMult)),
    timeoutDmg: Math.max(14, Math.round(leader.timeoutDmg * dmgMult)),
    trait: kind === 'fast' ? 'Шустрый' : 'Глухой',
    isBoss: false,
  }
  const enemy = enemyFromMonster(monster, 'minion')
  enemy.minionKind = kind
  return enemy
}

/** Чемпион + 1–2 подручных */
export function buildBossSquad(leaderMonster: Monster): BattleEnemy[] {
  const leader = enemyFromMonster(leaderMonster, 'leader')
  const minionCount = Math.random() < 0.45 ? 2 : 1
  const minions: BattleEnemy[] = [
    createMinion(leaderMonster, 0, 'fast'),
  ]
  if (minionCount === 2) {
    minions.push(createMinion(leaderMonster, 1, 'brute'))
  }
  return [leader, ...minions]
}

/** Тестовая арена: 2–3 разных врага из пула данжа */
export function buildPackSquad(dungeonName: string): BattleEnemy[] {
  const pool = (MONSTERS_BY_DUNGEON[dungeonName] ?? DEFAULT_MONSTERS).filter(m => !m.isBoss)
  const source = pool.length >= 2 ? pool : DEFAULT_MONSTERS
  const count = Math.random() < 0.55 ? 3 : 2
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  const picked: Monster[] = []
  for (let i = 0; i < count; i++) {
    picked.push({ ...shuffled[i % shuffled.length], isBoss: false })
  }
  return picked.map((m, i) => enemyFromMonster(m, i === 0 ? 'leader' : 'minion'))
}

export function livingEnemies(squad: BattleEnemy[]): BattleEnemy[] {
  return squad.filter(e => e.hp > 0)
}

export function squadLeader(squad: BattleEnemy[]): BattleEnemy | undefined {
  return squad.find(e => e.role === 'leader' && e.hp > 0)
    ?? squad.find(e => e.role === 'leader')
}

export function isSquadDefeated(squad: BattleEnemy[]): boolean {
  return livingEnemies(squad).length === 0
}

export function squadHasChampion(squad: BattleEnemy[]): boolean {
  return squad.some(e => isBossMonster(e.monster))
}

export function totalSquadHp(squad: BattleEnemy[]): { current: number; max: number } {
  let current = 0
  let max = 0
  for (const e of squad) {
    current += e.hp
    max += e.maxHp
  }
  return { current, max }
}

export function advanceWindupAfterPlayerTurn(squad: BattleEnemy[]): BattleEnemy[] {
  return squad.map(e => {
    if (e.windupState !== 'charging' || !e.windupTurns) return e
    const left = e.windupTurns - 1
    if (left <= 0) {
      return { ...e, windupState: 'ready', windupTurns: 0 }
    }
    return { ...e, windupTurns: left }
  })
}

export function resetWindupAfterStrike(squad: BattleEnemy[], uid: string): BattleEnemy[] {
  return squad.map(e => {
    if (e.uid !== uid) return e
    return { ...e, windupState: 'idle', windupTurns: 0 }
  })
}

export function startWindupCharge(squad: BattleEnemy[], uid: string): BattleEnemy[] {
  return squad.map(e => {
    if (e.uid !== uid) return e
    return { ...e, windupState: 'charging', windupTurns: WINDUP_PLAYER_TURNS }
  })
}

function swarmAttacker(alive: BattleEnemy[]): BattleEnemy | undefined {
  return alive.find(e => e.monster.special === 'swarm')
}

export function pickSquadAttackPlan(squad: BattleEnemy[], roundIndex: number): SquadAttackPlan {
  const alive = livingEnemies(squad)
  const active = attackableEnemies(alive)
  const leader = active.find(e => e.role === 'leader') ?? alive.find(e => e.role === 'leader')
  const minions = active.filter(e => e.role === 'minion')

  if (alive.length === 0) {
    return { attackers: [], mode: 'single', label: '', timerSec: 12 }
  }

  const windupReady = alive.find(e => e.monster.special === 'windup' && e.windupState === 'ready')
  if (windupReady) {
    return {
      attackers: [windupReady],
      mode: 'windup_strike',
      label: `⚡ ${windupReady.monster.icon} ${windupReady.monster.name} · заряженный удар`,
      timerSec: Math.max(8, windupReady.monster.defendTimer - 2),
      questionDifficulty: 'hard',
    }
  }

  const windupIdle = alive.find(
    e => e.monster.special === 'windup' && (e.windupState ?? 'idle') === 'idle',
  )
  if (windupIdle && alive.length >= 2 && roundIndex >= 1 && roundIndex % 3 === 1) {
    return {
      attackers: [windupIdle],
      mode: 'windup_charge',
      label: `${windupIdle.monster.icon} ${windupIdle.monster.name} заряжает удар`,
      timerSec: 0,
    }
  }

  const bee = swarmAttacker(alive)
  if (bee && roundIndex % 2 === 1) {
    const stings = bee.monster.swarmStings ?? 3
    return {
      attackers: [bee],
      mode: 'swarm',
      label: `${bee.monster.icon} ${bee.monster.name} · рой`,
      timerSec: Math.max(12, bee.monster.defendTimer + 5),
      swarmHits: stings,
      swarmDmgPerHit: Math.max(6, Math.round(bee.monster.attackDmg * 0.85)),
    }
  }

  if (!leader && minions.length >= 2) {
    const timerSec = Math.max(
      7,
      Math.min(...minions.map(m => m.monster.defendTimer)) - 2,
    )
    return {
      attackers: minions,
      mode: 'frenzy',
      label: minions.map(m => m.monster.icon).join('+') + ' ярость без лидера',
      timerSec,
    }
  }

  if (alive.length === 1) {
    const a = alive[0]
    if (a.monster.special === 'swarm') {
      const stings = a.monster.swarmStings ?? 3
      return {
        attackers: [a],
        mode: 'swarm',
        label: `${a.monster.icon} рой`,
        timerSec: Math.max(12, a.monster.defendTimer + 5),
        swarmHits: stings,
        swarmDmgPerHit: Math.max(6, Math.round(a.monster.attackDmg * 0.85)),
      }
    }
    return {
      attackers: [a],
      mode: 'single',
      label: `${a.monster.icon} ${a.monster.name}`,
      timerSec: a.monster.defendTimer,
    }
  }

  const leaderLow = leader && leader.hp <= leader.maxHp * 0.4
  const desperateCombo = leaderLow && minions.length > 0 && (roundIndex % 2 === 0 || Math.random() < 0.35)

  const comboRound = desperateCombo || (roundIndex > 0 && roundIndex % 3 === 0 && leader && minions.length > 0)
  if (comboRound && leader) {
    const partner = minions[roundIndex % minions.length]
    const timerSec = Math.max(
      7,
      Math.min(leader.monster.defendTimer, partner.monster.defendTimer) - 2,
    )
    return {
      attackers: [leader, partner],
      mode: leaderLow ? 'frenzy' : 'combo',
      label: leaderLow
        ? `⚠️ ${leader.monster.icon}+${partner.monster.icon} отчаянная атака`
        : `${leader.monster.icon}+${partner.monster.icon} совместная атака`,
      timerSec,
    }
  }

  if (leader && (roundIndex % 2 === 0 || minions.length === 0)) {
    return {
      attackers: [leader],
      mode: 'single',
      label: `${leader.monster.icon} ${leader.monster.name}`,
      timerSec: leader.monster.defendTimer,
    }
  }

  const idx = roundIndex % minions.length
  const minion = minions[idx]
  return {
    attackers: [minion],
    mode: 'single',
    label: `${minion.monster.icon} ${minion.monster.name}`,
    timerSec: minion.monster.defendTimer,
  }
}

export function squadAttackDamage(
  plan: SquadAttackPlan,
  rageMult: number,
  timeout = false,
): number {
  if (!plan.attackers.length) return 0
  let raw = 0
  for (const a of plan.attackers) {
    raw += timeout ? a.monster.timeoutDmg : a.monster.attackDmg
  }
  if (plan.mode === 'combo') raw = Math.round(raw * 0.88)
  if (plan.mode === 'frenzy') raw = Math.round(raw * 0.92)
  if (plan.mode === 'windup_strike') raw = Math.round(raw * WINDUP_STRIKE_MULT)
  return Math.round(raw * rageMult)
}

export function applyDamageToEnemy(squad: BattleEnemy[], targetUid: string, dmg: number): BattleEnemy[] {
  return squad.map(e => {
    if (e.uid !== targetUid) return e
    const hp = Math.max(0, e.hp - dmg)
    return { ...e, hp, monster: { ...e.monster, hp } }
  })
}

/** Лидер убит — подручники теряют HP, но бьют сильнее */
export function applyMinionFrenzy(squad: BattleEnemy[]): BattleEnemy[] {
  const leaderAlive = squad.some(e => e.role === 'leader' && e.hp > 0)
  if (leaderAlive) return squad

  return squad.map(e => {
    if (e.role !== 'minion' || e.hp <= 0 || e.frenzy) return e
    const hp = Math.max(10, Math.round(e.hp * 0.72))
    const maxHp = Math.max(hp, Math.round(e.maxHp * 0.72))
    const attackDmg = Math.round(e.monster.attackDmg * 1.45)
    const timeoutDmg = Math.round(e.monster.timeoutDmg * 1.35)
    const monster = {
      ...e.monster,
      hp,
      attackDmg,
      timeoutDmg,
      trait: 'Ярость без лидера',
    }
    return {
      ...e,
      hp,
      maxHp,
      frenzy: true,
      monster,
      baseStats: { attackDmg, timeoutDmg, defendTimer: e.baseStats.defendTimer },
    }
  })
}

export function healSquadEnemy(squad: BattleEnemy[], uid: string, amount: number): BattleEnemy[] {
  if (amount <= 0) return squad
  return squad.map(e => {
    if (e.uid !== uid) return e
    const hp = Math.min(e.maxHp, e.hp + amount)
    return { ...e, hp, monster: { ...e.monster, hp } }
  })
}

export function lifestealHeal(plan: SquadAttackPlan, damageDealt: number): { uid: string; amount: number } | null {
  const leech = plan.attackers.find(a => a.monster.special === 'lifesteal' && a.hp > 0)
  if (!leech || damageDealt <= 0) return null
  const pct = leech.monster.lifestealPct ?? 0.3
  const amount = Math.max(1, Math.round(damageDealt * pct))
  return { uid: leech.uid, amount }
}

export function syncLeaderMonster(squad: BattleEnemy[]): Monster | null {
  const leader = squadLeader(squad)
  return leader?.monster ?? null
}

export function profileMonsterId(enemy: BattleEnemy, squad: BattleEnemy[]): string {
  if (enemy.role === 'leader') return enemy.monster.id
  const leader = squad.find(e => e.role === 'leader')
  return leader?.monster.id ?? enemy.monster.id
}
