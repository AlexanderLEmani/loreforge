export function scrollTeaserText(body?: string, maxLen = 120): string {
  if (!body) return ''
  const t = body.trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen).trim()}…`
}

export function scrollPreviewExampleLine(scroll: {
  example?: { task?: string; steps?: string[] } | string
}): string | null {
  let example: { task?: string; steps?: string[] } | undefined
  const raw = scroll.example
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { task?: string; steps?: string[] }
      example = parsed
    } catch {
      return null
    }
  } else {
    example = raw
  }
  if (!example?.task) return null
  const step = (example.steps || []).find(s => s && s.trim() && !s.startsWith('='))
  return step ? `${example.task} → ${step.replace(/^→\s*/, '')}` : example.task
}

export function scrollCombatTeaser(combat?: string, maxLen = 90): string {
  if (!combat) return ''
  const t = combat.trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen).trim()}…`
}

/** Сравнение ответа игрока с правильным (дроби, пробелы) */
export function answersMatch(player: string, correct: string): boolean {
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(',', '.')
  const a = norm(player)
  const b = norm(correct)
  if (a === b) return true
  const na = parseFloat(a)
  const nb = parseFloat(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) return true
  return false
}
