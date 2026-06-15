import { STORAGE_PREFIX } from '@/lib/brand'
import type { KeyboardEvent } from 'react'

const SOUND_KEY = `${STORAGE_PREFIX}_sound_enabled`

export type Sfx =
  | 'key'
  | 'backspace'
  | 'submit'
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'hit'
  | 'miss'
  | 'block'
  | 'dark'
  | 'defeat'

let audioCtx: AudioContext | null = null
let keyTick = 0

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(SOUND_KEY) !== '0'
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_KEY, on ? '1' : '0')
}

/** Разблокировать AudioContext после первого жеста (iOS). */
export function warmupAudio() {
  try {
    getAudioContext()
  } catch {
    /* optional */
  }
}

function noiseBurst(
  ctx: AudioContext,
  t: number,
  opts: { dur: number; freq: number; gain: number; q?: number },
) {
  const samples = Math.max(1, Math.floor(ctx.sampleRate * opts.dur))
  const buffer = ctx.createBuffer(1, samples, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) {
    const env = Math.pow(1 - i / samples, 2.4)
    data[i] = (Math.random() * 2 - 1) * env
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = opts.freq
  filter.Q.value = opts.q ?? 1.1
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(opts.gain, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start(t)
  src.stop(t + opts.dur + 0.02)
}

function tone(
  ctx: AudioContext,
  t: number,
  freq: number,
  dur: number,
  vol: number,
  type: OscillatorType = 'sine',
  slideTo?: number,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t + dur)
  }
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export function playSound(type: Sfx) {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const t = ctx.currentTime

    switch (type) {
      case 'key':
        keyTick += 1
        const shift = (keyTick % 6) * 35
        noiseBurst(ctx, t, { dur: 0.03, freq: 1550 + shift, gain: 0.13, q: 0.85 })
        tone(ctx, t, 240 + shift * 0.25, 0.02, 0.035, 'triangle')
        break
      case 'backspace':
        noiseBurst(ctx, t, { dur: 0.022, freq: 880, gain: 0.07, q: 0.65 })
        break
      case 'submit':
        tone(ctx, t, 480, 0.05, 0.07)
        tone(ctx, t + 0.045, 620, 0.07, 0.055)
        break
      case 'tap':
        noiseBurst(ctx, t, { dur: 0.014, freq: 1100, gain: 0.055 })
        break
      case 'correct':
        tone(ctx, t, 523, 0.1, 0.09)
        tone(ctx, t + 0.07, 659, 0.16, 0.07)
        break
      case 'wrong':
        tone(ctx, t, 196, 0.14, 0.08, 'triangle', 160)
        break
      case 'hit':
        tone(ctx, t, 520, 0.15, 0.16, 'sine', 340)
        break
      case 'miss':
        tone(ctx, t, 180, 0.22, 0.12, 'sawtooth')
        break
      case 'block':
        tone(ctx, t, 440, 0.12, 0.1, 'square')
        break
      case 'dark':
        tone(ctx, t, 80, 0.55, 0.16, 'sawtooth')
        break
      case 'defeat':
        tone(ctx, t, 140, 0.35, 0.12, 'triangle', 70)
        break
    }
  } catch {
    /* optional */
  }
}

/** Звук печати при изменении поля ответа. */
export function soundOnAnswerInput(prev: string, next: string) {
  if (next.length > prev.length) playSound('key')
  else if (next.length < prev.length) playSound('backspace')
}

export function soundOnEnterKey(e: KeyboardEvent) {
  if (e.key === 'Enter') playSound('submit')
}
