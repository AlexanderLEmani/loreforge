/** Перемешивает варианты ответа и обновляет correct_index */
export function shuffleQuestionAnswers<T extends { answers: string[]; correct_index: number }>(q: T): T {
  const correctAnswer = q.answers[q.correct_index]
  const answers = [...q.answers]
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[answers[i], answers[j]] = [answers[j], answers[i]]
  }
  return { ...q, answers, correct_index: answers.indexOf(correctAnswer) }
}

export function shuffleQuestions<T extends { answers: string[]; correct_index: number }>(list: T[]): T[] {
  return list.map(shuffleQuestionAnswers)
}
