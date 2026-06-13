'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  DAILY_STUDY_TARGET_SECONDS,
  fetchDailyStudy,
  formatStudyMinutes,
  studyProgressRatio,
} from '@/lib/daily-study'

type Props = {
  active?: boolean
}

export default function StudyProgressChip({ active = true }: Props) {
  const [seconds, setSeconds] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!active) return
    const supabase = createClient()
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const state = await fetchDailyStudy(supabase, user.id)
      if (!cancelled) {
        setSeconds(state.seconds)
        setReady(true)
      }
    }

    load()
    const id = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [active])

  if (!active || !ready) return null

  const done = seconds >= DAILY_STUDY_TARGET_SECONDS
  const pct = studyProgressRatio(seconds) * 100

  return (
    <div className="lf-study-chip" aria-label="Прогресс дневной практики">
      <div className="lf-study-chip-row">
        <span className="lf-study-chip-icon">{done ? '🔥' : '⏱'}</span>
        <span className="lf-study-chip-label">
          {done ? 'День засчитан' : `${formatStudyMinutes(seconds)} / ${formatStudyMinutes(DAILY_STUDY_TARGET_SECONDS)}`}
        </span>
      </div>
      <div className="lf-study-chip-bar">
        <div
          className={`lf-study-chip-fill${done ? ' lf-study-chip-fill--done' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
