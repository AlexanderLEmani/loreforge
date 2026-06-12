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

/** Unicode vulgar fractions ↔ ASCII */
const UNICODE_TO_FRACTION: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
}

const UNICODE_FRACTION_CHARS = Object.keys(UNICODE_TO_FRACTION).join('')

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function expandUnicodeFractions(s: string): string {
  let out = s
  for (const [unicode, ascii] of Object.entries(UNICODE_TO_FRACTION)) {
    out = out.split(unicode).join(ascii)
  }
  return out
}

function parseRational(raw: string): { n: number; d: number } | null {
  const s = expandUnicodeFractions(raw.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.'))
  if (!s) return null

  const frac = s.match(/^(-?\d+)\/(-?\d+)$/)
  if (frac) {
    const n = parseInt(frac[1], 10)
    const d = parseInt(frac[2], 10)
    if (d === 0) return null
    const g = gcd(n, d)
    return { n: n / g, d: d / g }
  }

  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const f = parseFloat(s)
    if (!Number.isFinite(f)) return null
    const n = Math.round(f * 10000)
    const d = 10000
    const g = gcd(n, d)
    return { n: n / g, d: d / g }
  }

  return null
}

function canonicalAnswer(s: string): string {
  const rational = parseRational(s)
  if (rational) {
    if (rational.d === 1) return String(rational.n)
    return `${rational.n}/${rational.d}`
  }
  return expandUnicodeFractions(s.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.'))
}

/** Разрешённые символы в поле ответа (дроби, %, целые) */
export function sanitizeAnswerInput(value: string): string {
  const allowed = `0-9./\\-\\s,%${UNICODE_FRACTION_CHARS}`
  return value.replace(new RegExp(`[^${allowed}]`, 'g'), '')
}

/** Сравнение ответа игрока с правильным (дроби, пробелы, ½ = 1/2) */
export function answersMatch(player: string, correct: string): boolean {
  const a = canonicalAnswer(player)
  const b = canonicalAnswer(correct)
  if (a === b) return true

  const ra = parseRational(player)
  const rb = parseRational(correct)
  if (ra && rb) return ra.n === rb.n && ra.d === rb.d

  const na = parseFloat(a)
  const nb = parseFloat(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb) && Math.abs(na - nb) < 1e-6) return true
  return false
}
