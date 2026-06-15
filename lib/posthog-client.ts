import posthog from 'posthog-js'

let initAttempted = false

function posthogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined
}

function posthogApiHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim()
  return host || 'https://eu.i.posthog.com'
}

function posthogUiHost(): string {
  const ui = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST?.trim()
  if (ui) return ui
  const api = posthogApiHost()
  if (api.includes('eu.i.posthog.com')) return 'https://eu.posthog.com'
  if (api.includes('us.i.posthog.com')) return 'https://us.posthog.com'
  return 'https://posthog.com'
}

/** Синхронный init на клиенте — до первого track(). */
export function initPostHog(): boolean {
  if (typeof window === 'undefined') return false
  const key = posthogKey()
  if (!key) return false
  if (initAttempted) return true
  initAttempted = true

  try {
    posthog.init(key, {
      api_host: posthogApiHost(),
      ui_host: posthogUiHost(),
      person_profiles: 'identified_only',
      capture_pageview: 'history_change',
      capture_pageleave: true,
    })
    if (window.location.search.includes('ph_debug=1')) {
      posthog.debug()
    }
    return true
  } catch (err) {
    console.warn('[LoreHeim] PostHog init failed:', err)
    return false
  }
}

export function isPostHogConfigured(): boolean {
  return Boolean(posthogKey())
}

export function getPostHogClient() {
  initPostHog()
  return posthog
}
