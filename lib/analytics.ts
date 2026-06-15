import type { User } from '@supabase/supabase-js'
import { getPostHogClient, initPostHog, isPostHogConfigured } from '@/lib/posthog-client'

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

function cleanProps(props?: AnalyticsProps): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!props) return out
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue
    out[key] = value
  }
  return out
}

export function isAnalyticsEnabled(): boolean {
  return isPostHogConfigured()
}

export function track(event: string, props?: AnalyticsProps) {
  if (!isPostHogConfigured()) return
  if (!initPostHog()) return
  try {
    getPostHogClient().capture(event, cleanProps(props))
    if (typeof window !== 'undefined' && window.location.search.includes('ph_debug=1')) {
      console.info('[LoreHeim analytics]', event, cleanProps(props))
    }
  } catch (err) {
    console.warn('[LoreHeim analytics] capture failed:', event, err)
  }
}

export function identifyUser(user: User, traits?: AnalyticsProps) {
  if (!isPostHogConfigured()) return
  if (!initPostHog()) return
  try {
    getPostHogClient().identify(user.id, cleanProps(traits))
  } catch {
    /* optional */
  }
}

export const AUTH_PENDING_KEY = 'loreheim_auth_pending'

export function markAuthPending(method: 'google' | 'guest') {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_PENDING_KEY, method)
}

export function flushAuthCompleted() {
  if (typeof window === 'undefined') return
  const method = sessionStorage.getItem(AUTH_PENDING_KEY)
  if (!method) return
  sessionStorage.removeItem(AUTH_PENDING_KEY)
  track('auth_completed', { method })
}
