/**
 * LoreHeim v1 = арифметика до процентов (экзамен IV).
 * После экзамена IV игрок становится ур. 5 — «выпускник v1», без экзамена V.
 */

export const V1_MAX_EXAM_LEVEL = 4
/** Уровень игрока после успешного экзамена IV */
export const V1_GRADUATE_PLAYER_LEVEL = 5

export function isV1Graduate(playerLevel: number): boolean {
  return playerLevel >= V1_GRADUATE_PLAYER_LEVEL
}

/** Можно сдать экзамен: ур. 1–4 и набран XP на текущий уровень */
export function canTakeExam(playerLevel: number, examReady: boolean): boolean {
  return examReady && playerLevel >= 1 && playerLevel <= V1_MAX_EXAM_LEVEL
}

export function examLevelForPlayer(playerLevel: number): number {
  return Math.min(Math.max(1, playerLevel), V1_MAX_EXAM_LEVEL)
}

export function isValidExamLevel(examLevel: number): boolean {
  return examLevel >= 1 && examLevel <= V1_MAX_EXAM_LEVEL
}

export const V1_COMPLETE_TITLE = 'Арифметика v1 завершена'
export const V1_COMPLETE_DESC =
  'Ты прошёл курс от сложения до процентов. Смешанные действия, скобки и алгебра — в следующих обновлениях. Продолжай данжи, тренировку и skill tree.'
