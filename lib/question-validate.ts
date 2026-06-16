import { answersMatch } from '@/lib/scroll-display'

const INTEGER_DUNGEONS = new Set([
  'Пещера сложения',
  'Пещера вычитания',
  'Башня умножения',
  'Пещера деления',
])

function normalizeMathExpr(expr: string): string {
  return expr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
}

export function evaluateIntegerExpression(expr: string): number | null {
  const cleaned = normalizeMathExpr(expr)
  if (!cleaned || !/^[0-9+\-*/()]+$/.test(cleaned)) return null
  try {
    const value = Function(`"use strict"; return (${cleaned})`)() as number
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) return null
    return value
  } catch {
    return null
  }
}

export function expectedIntegerAnswer(question: string): number | null {
  const match = question.match(/^(.+?)\s*=\s*\??\s*$/)
  if (!match) return null
  return evaluateIntegerExpression(match[1])
}

type QuestionRow = {
  question: string
  answers: string[]
  correct_index: number
  dungeon_name?: string
}

export function isQuestionAnswerValid(q: QuestionRow): boolean {
  const correct = q.answers?.[q.correct_index]
  if (!correct || !q.question) return false

  const expected = expectedIntegerAnswer(q.question)
  if (expected === null) return true

  if (q.dungeon_name && !INTEGER_DUNGEONS.has(q.dungeon_name)) return true
  return answersMatch(String(expected), correct)
}

export function filterValidQuestions<T extends QuestionRow>(questions: T[]): T[] {
  return questions.filter(q => isQuestionAnswerValid(q))
}
