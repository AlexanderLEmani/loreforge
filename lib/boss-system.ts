/**
 * Боссы LoreForge — дизайн (v1)
 *
 * ЗАЧЕМ:
 * - Проверка темы данжа под давлением (мини-экзамен в бою)
 * - Учат читать паттерн врага (намерение), не только формулы
 * - Дают «пик» сессии: больше HP, механика, лучший лут (× BOSS_LOOT_MULTIPLIER)
 *
 * ТИРЫ:
 * - champion (isBoss) — усилённый враг данжа, ~25% шанс при входе
 * - enrage — ниже 40% HP: +урон/таймер, тот же враг (не подмена)
 *
 * НЕ БОСС:
 * - Отдельный режим «только босс» — позже (квест гильдии / gate перед экзаменом)
 * - Мультифаз с подменой спрайта — когда будет арт врагов
 */

import type { Monster } from '@/lib/battle-config'
import type { MonsterProfile } from '@/lib/monster-mechanics'
import { RAGE_CHARGE_MAX, stanceCap } from '@/lib/monster-mechanics'

/** Шанс чемпиона данжа при обычном входе */
export const BOSS_ENCOUNTER_CHANCE = 0.28

/** Ниже этой доли HP враг входит в ярость (если у профиля enrage) */
export const BOSS_ENRAGE_HP_RATIO = 0.4
/** Бонус к урону и таймеру при ярости — без подмены врага и без «лечения» */
export const BOSS_ENRAGE_ATTACK_BONUS = 4
export const BOSS_ENRAGE_TIMEOUT_BONUS = 5
export const BOSS_ENRAGE_TIMER_DELTA = -3

export type BossIntentId =
  | 'attack'
  | 'heavy'
  | 'charge_stance'
  | 'enrage_soon'
  | 'rage_charge'

export type BossIntent = {
  id: BossIntentId
  label: string
  hint: string
}

export function isBossMonster(monster: Monster | null | undefined): boolean {
  return Boolean(monster?.isBoss)
}

export function pickMonsterFromPool(pool: Monster[]): Monster {
  const bosses = pool.filter(m => m.isBoss)
  const normals = pool.filter(m => !m.isBoss)

  if (bosses.length > 0 && Math.random() < BOSS_ENCOUNTER_CHANCE) {
    return bosses[Math.floor(Math.random() * bosses.length)]
  }
  if (normals.length > 0) {
    return normals[Math.floor(Math.random() * normals.length)]
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export function resolveBossIntent(
  profile: MonsterProfile,
  hp: number,
  maxHp: number,
  bossEnraged: boolean,
  stanceStacks: number,
  rageChargeStacks: number,
): BossIntent {
  const hpRatio = maxHp > 0 ? hp / maxHp : 1

  if (profile.enrage && !bossEnraged && hpRatio <= BOSS_ENRAGE_HP_RATIO + 0.08) {
    return {
      id: 'enrage_soon',
      label: 'Готовит ярость',
      hint: 'Ниже 40% HP — урон и таймер атаки растут. Добей быстрее.',
    }
  }

  if (profile.defendBehavior === 'rage_on_block' && rageChargeStacks >= 1) {
    return {
      id: 'rage_charge',
      label: 'Заряженный удар',
      hint: 'Сильная атака. Уклонение (неверный ответ) лучше блока.',
    }
  }

  if (
    profile.defendBehavior === 'stance_on_block'
    && stanceStacks < stanceCap(profile)
    && stanceStacks >= 0
  ) {
    return {
      id: 'charge_stance',
      label: 'Копит стойку',
      hint: 'Блок верным ответом даст ему стойку. Добивай или не блокируй.',
    }
  }

  if (bossEnraged) {
    return {
      id: 'heavy',
      label: 'Яростная атака',
      hint: 'Таймер короче, урон выше. Считай без паузы.',
    }
  }

  return {
    id: 'attack',
    label: 'Атака',
    hint: 'Стандартный удар — защита примером на таймере.',
  }
}

/** Награда debrief: золото, слава, шанс лута */
export const BOSS_LOOT_MULTIPLIER = 1.35

export function championLootMultiplier(active: boolean): number {
  return active ? BOSS_LOOT_MULTIPLIER : 1
}

export function applyChampionBonus(amount: number, champion: boolean): number {
  if (!champion || amount <= 0) return amount
  return Math.round(amount * BOSS_LOOT_MULTIPLIER)
}
