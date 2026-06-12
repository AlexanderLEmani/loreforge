/** Локальные вопросы если в Supabase пусто — друг может играть без сида БД */

export type FallbackQuestion = {
  id: number
  question: string
  answers: string[]
  correct_index: number
  dungeon_name: string
  difficulty: 'easy' | 'medium' | 'hard'
}

function q(
  id: number,
  dungeon: string,
  text: string,
  correct: string,
  wrong: string[],
  difficulty: 'easy' | 'medium' | 'hard',
): FallbackQuestion {
  const answers = [correct, ...wrong].sort(() => Math.random() - 0.5)
  return {
    id,
    question: text,
    answers,
    correct_index: answers.indexOf(correct),
    dungeon_name: dungeon,
    difficulty,
  }
}

const ADD: FallbackQuestion[] = [
  q(1001, 'Пещера сложения', '7 + 5 = ?', '12', ['11', '13', '10'], 'easy'),
  q(1002, 'Пещера сложения', '23 + 14 = ?', '37', ['36', '38', '35'], 'medium'),
  q(1003, 'Пещера сложения', '156 + 48 = ?', '204', ['198', '212', '194'], 'hard'),
  q(1004, 'Пещера сложения', '9 + 8 = ?', '17', ['16', '18', '15'], 'easy'),
  q(1005, 'Пещера сложения', '45 + 27 = ?', '72', ['71', '73', '70'], 'medium'),
  q(1006, 'Пещера сложения', '12 + 15 + 8 = ?', '35', ['34', '36', '33'], 'hard'),
]

const SUB: FallbackQuestion[] = [
  q(2001, 'Пещера вычитания', '15 − 7 = ?', '8', ['7', '9', '6'], 'easy'),
  q(2002, 'Пещера вычитания', '52 − 19 = ?', '33', ['32', '34', '31'], 'medium'),
  q(2003, 'Пещера вычитания', '300 − 127 = ?', '173', ['172', '174', '163'], 'hard'),
  q(2004, 'Пещера вычитания', '20 − 11 = ?', '9', ['8', '10', '7'], 'easy'),
  q(2005, 'Пещера вычитания', '84 − 36 = ?', '48', ['47', '49', '46'], 'medium'),
]

const MUL: FallbackQuestion[] = [
  q(3001, 'Башня умножения', '6 × 7 = ?', '42', ['36', '48', '40'], 'easy'),
  q(3002, 'Башня умножения', '8 × 9 = ?', '72', ['64', '81', '70'], 'easy'),
  q(3003, 'Башня умножения', '12 × 11 = ?', '132', ['121', '144', '120'], 'medium'),
  q(3004, 'Башня умножения', '15 × 13 = ?', '195', ['180', '210', '185'], 'hard'),
  q(3005, 'Башня умножения', '7 × 8 = ?', '56', ['54', '58', '48'], 'easy'),
]

const DIV: FallbackQuestion[] = [
  q(4001, 'Пещера деления', '56 ÷ 7 = ?', '8', ['7', '9', '6'], 'easy'),
  q(4002, 'Пещера деления', '72 ÷ 9 = ?', '8', ['7', '9', '6'], 'easy'),
  q(4003, 'Пещера деления', '144 ÷ 12 = ?', '12', ['11', '13', '14'], 'medium'),
  q(4004, 'Пещера деления', '95 ÷ 5 = ?', '19', ['18', '20', '17'], 'medium'),
  q(4005, 'Пещера деления', '84 ÷ 6 = ?', '14', ['12', '13', '16'], 'hard'),
]

const FRAC: FallbackQuestion[] = [
  q(5001, 'Храм дробей', '½ + ½ = ?', '1', ['½', '2', '¼'], 'easy'),
  q(5002, 'Храм дробей', '¼ + ¼ = ?', '½', ['¼', '1', '¾'], 'easy'),
  q(5003, 'Храм дробей', '⅓ + ⅓ = ?', '⅔', ['⅓', '1', '½'], 'medium'),
  q(5004, 'Храм дробей', '¾ − ¼ = ?', '½', ['¼', '1', '⅔'], 'medium'),
  q(5005, 'Храм дробей', '½ × ½ = ?', '¼', ['½', '1', '⅓'], 'hard'),
  q(5006, 'Храм дробей', '1 − ⅓ = ?', '⅔', ['½', '⅓', '¼'], 'medium'),
]

export const FALLBACK_BY_DUNGEON: Record<string, FallbackQuestion[]> = {
  'Пещера сложения': ADD,
  'Пещера вычитания': SUB,
  'Башня умножения': MUL,
  'Пещера деления': DIV,
  'Храм дробей': FRAC,
}

export function mergeWithFallback(dungeon: string, fromDb: any[]): any[] {
  const fb = FALLBACK_BY_DUNGEON[dungeon] || []
  if (fromDb.length >= 5) return fromDb
  const merged = [...fromDb]
  for (const q of fb) {
    if (!merged.some(m => m.question === q.question)) merged.push(q)
  }
  return merged
}
