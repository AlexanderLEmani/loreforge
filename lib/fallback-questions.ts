/** Локальные банки если в Supabase пусто — 100 примеров на данж (data/question-banks) */

import pecheraSlozheniya from '@/data/question-banks/pechera-slozheniya.json'
import pecheraVychitaniya from '@/data/question-banks/pechera-vychitaniya.json'
import bashnyaUmnozheniya from '@/data/question-banks/bashnya-umnozheniya.json'
import pecheraDeleniya from '@/data/question-banks/pechera-deleniya.json'
import hramDrobei from '@/data/question-banks/hram-drobei.json'

export type FallbackQuestion = {
  id: number
  question: string
  answers: string[]
  correct_index: number
  dungeon_name: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export const FALLBACK_BY_DUNGEON: Record<string, FallbackQuestion[]> = {
  'Пещера сложения': pecheraSlozheniya as FallbackQuestion[],
  'Пещера вычитания': pecheraVychitaniya as FallbackQuestion[],
  'Башня умножения': bashnyaUmnozheniya as FallbackQuestion[],
  'Пещера деления': pecheraDeleniya as FallbackQuestion[],
  'Храм дробей': hramDrobei as FallbackQuestion[],
}

export function mergeWithFallback(dungeon: string, fromDb: any[]): any[] {
  const fb = FALLBACK_BY_DUNGEON[dungeon] || []
  const merged = [...fromDb]
  for (const q of fb) {
    if (!merged.some(m => m.question === q.question)) merged.push(q)
  }
  return merged
}
