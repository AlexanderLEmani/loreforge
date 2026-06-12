/** Два варианта из четырёх: правильный + один случайный неправильный. */
export function pickHintPair(correctIndex: number, answerCount: number): number[] {
  if (answerCount < 2) return [correctIndex]
  const wrong: number[] = []
  for (let i = 0; i < answerCount; i++) {
    if (i !== correctIndex) wrong.push(i)
  }
  const decoy = wrong[Math.floor(Math.random() * wrong.length)]
  return [correctIndex, decoy]
}

export function isHintHighlighted(indices: number[] | null, idx: number) {
  return indices?.includes(idx) ?? false
}
