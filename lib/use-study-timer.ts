'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { recordStudyHeartbeat, STUDY_HEARTBEAT_SECONDS } from '@/lib/daily-study'

/**
 * Считает активное время в тренировке / бою / экзамене.
 * Только при visible вкладке; heartbeat раз в 15 с.
 */
export function useStudyTimer(active: boolean) {
  const tickingRef = useRef(false)

  useEffect(() => {
    if (!active) return

    const supabase = createClient()
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function tick() {
      if (cancelled || tickingRef.current) return
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

      tickingRef.current = true
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        await recordStudyHeartbeat(supabase, user.id)
      } finally {
        tickingRef.current = false
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') tick()
    }

    intervalId = setInterval(tick, STUDY_HEARTBEAT_SECONDS * 1000)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active])
}
