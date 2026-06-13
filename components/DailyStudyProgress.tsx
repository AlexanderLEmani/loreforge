'use client'

import {
  DAILY_STUDY_TARGET_SECONDS,
  formatStudyMinutes,
  normalizeStudySeconds,
  studyProgressRatio,
} from '@/lib/daily-study'

type Props = {
  seconds?: number
  studyDate?: string | null
  compact?: boolean
}

export default function DailyStudyProgress({ seconds = 0, studyDate, compact = false }: Props) {
  const sec = normalizeStudySeconds(seconds, studyDate)
  const done = sec >= DAILY_STUDY_TARGET_SECONDS
  const pct = studyProgressRatio(sec) * 100

  return (
    <div
      className={`lf-daily-study${compact ? ' lf-daily-study--compact' : ''}`}
      aria-label="Прогресс дневной практики"
    >
      <div className="lf-daily-study-head">
        <span className="lf-daily-study-icon">{done ? '🔥' : '⏱'}</span>
        <div>
          <div className="lf-daily-study-title">
            {done ? 'День засчитан' : 'Практика сегодня'}
          </div>
          <div className="lf-daily-study-time">
            {done
              ? 'Стрик активен'
              : `${formatStudyMinutes(sec)} / ${formatStudyMinutes(DAILY_STUDY_TARGET_SECONDS)}`}
          </div>
        </div>
      </div>
      <div className="lf-daily-study-bar">
        <div
          className={`lf-daily-study-fill${done ? ' lf-daily-study-fill--done' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!done && !compact && (
        <p className="lf-daily-study-hint">
          Считается время в тренировке, данже и на экзамене — не просто вход в игру.
        </p>
      )}
    </div>
  )
}
