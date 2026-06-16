const DEBRIEF_KEY = 'loreheim_debrief_payload'

export type DebriefPayload = {
  result: 'win' | 'lose'
  score: number
  total: number
  dungeonId: string
  mistakes: string[]
  hard?: boolean
  champion?: boolean
  spell?: boolean
}

export function stashDebriefPayload(payload: DebriefPayload) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DEBRIEF_KEY, JSON.stringify(payload))
}

export function readDebriefPayload(): DebriefPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DEBRIEF_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DebriefPayload
  } catch {
    return null
  }
}

export function clearDebriefPayload() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(DEBRIEF_KEY)
}

export function debriefHref(payload: DebriefPayload): string {
  const q = new URLSearchParams({
    result: payload.result,
    score: String(payload.score),
    total: String(payload.total),
    dungeon: payload.dungeonId,
  })
  if (payload.hard) q.set('hard', 'true')
  if (payload.champion) q.set('champion', '1')
  if (payload.spell) q.set('spell', '1')
  return `/debrief?${q.toString()}`
}
