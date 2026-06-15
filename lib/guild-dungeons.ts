import {
  cumulativeFreeDungeonIds,
  maxDungeonDiscountPct,
} from '@/lib/guild-ranks'
import { type DungeonId } from '@/lib/dungeons'

export type GuildDungeon = {
  id: DungeonId
  icon: string
  name: string
  tag: string
  desc: string
  baseCost: number
  color: string
  rarity: 'rare' | 'epic' | null
  level: number
}

export const GUILD_DUNGEONS: GuildDungeon[] = [
  { id: 'add', icon: '➕', name: 'Пещера сложения', tag: 'Ур.1', desc: 'Сложение до 1000. Базовый данж.', baseCost: 0, color: '#c9a84c', rarity: null, level: 1 },
  { id: 'sub', icon: '➖', name: 'Пещера вычитания', tag: 'Ур.1', desc: 'Вычитание до 1000. Базовый данж.', baseCost: 0, color: '#c9a84c', rarity: null, level: 1 },
  { id: 'mul', icon: '✕', name: 'Башня умножения', tag: 'Ур.2', desc: 'Таблица умножения. Монстры атакуют быстро.', baseCost: 50, color: '#a99fff', rarity: 'rare', level: 2 },
  { id: 'div', icon: '÷', name: 'Пещера деления', tag: 'Ур.2', desc: 'Деление до 100. Остатки и комбинированные действия.', baseCost: 40, color: '#3db87a', rarity: null, level: 2 },
  { id: 'frac', icon: '½', name: 'Храм дробей', tag: 'Ур.3', desc: 'Дроби: ½ ⅓ ¼, общий знаменатель, × и ÷.', baseCost: 100, color: '#e05555', rarity: 'epic', level: 3 },
  { id: 'market', icon: '💰', name: 'Рынок процентов', tag: 'Ур.4', desc: '10%, 25%, скидки и наценки. Нужен игровой ур.4.', baseCost: 150, color: '#3db87a', rarity: null, level: 4 },
]

export function dungeonById(id: string): GuildDungeon | undefined {
  return GUILD_DUNGEONS.find(d => d.id === id)
}

export function effectiveDungeonCost(dungeonId: string, rankIdx: number): number {
  const d = dungeonById(dungeonId)
  if (!d || d.baseCost === 0) return 0
  if (cumulativeFreeDungeonIds(rankIdx).has(dungeonId)) return 0
  const discount = maxDungeonDiscountPct(rankIdx)
  if (discount >= 100) return 0
  return Math.max(0, Math.round(d.baseCost * (1 - discount / 100)))
}

export function dungeonCostLabel(dungeonId: string, rankIdx: number): string {
  const d = dungeonById(dungeonId)
  if (!d) return ''
  const cost = effectiveDungeonCost(dungeonId, rankIdx)
  if (cost === 0) return 'Бесплатно'
  if (cost < d.baseCost) return `${cost} ⭐ (−${d.baseCost - cost})`
  return `${cost} ⭐`
}
