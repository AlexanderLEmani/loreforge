export type SwarmQuestion = {
  id?: number
  question: string
  answers: string[]
  correct_index: number
}

export type SwarmRoundData = {
  questions: SwarmQuestion[]
  answerPool: string[]
  correctByQuestion: string[]
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 3 примера + 4 варианта (3 верных + 1 ложный) */
export function buildSwarmRoundFromQuestions(questions: SwarmQuestion[]): SwarmRoundData | null {
  if (questions.length === 0) return null
  const correctByQuestion = questions.map(q => q.answers[q.correct_index])
  const correctSet = new Set(correctByQuestion)

  let decoy: string | null = null
  for (const q of questions) {
    for (let i = 0; i < q.answers.length; i++) {
      const ans = q.answers[i]
      if (i !== q.correct_index && !correctSet.has(ans)) {
        decoy = ans
        break
      }
    }
    if (decoy) break
  }
  if (!decoy) {
    const q = questions[0]
    decoy = q.answers.find((_, i) => i !== q.correct_index) ?? '0'
  }

  const answerPool = shuffle([...correctByQuestion, decoy])
  return { questions, answerPool, correctByQuestion }
}

export function swarmAssignmentCorrect(
  round: SwarmRoundData,
  questionIdx: number,
  poolIdx: number | null,
): boolean {
  if (poolIdx === null || poolIdx < 0) return false
  const picked = round.answerPool[poolIdx]
  return picked === round.correctByQuestion[questionIdx]
}
