'use client'

import { useEffect, useState } from 'react'
import { isSoundEnabled, playSound, setSoundEnabled } from '@/lib/sounds'

type Props = {
  className?: string
  style?: React.CSSProperties
}

export default function SoundToggle({ className, style }: Props) {
  const [on, setOn] = useState(true)

  useEffect(() => {
    setOn(isSoundEnabled())
  }, [])

  return (
    <button
      type="button"
      className={className ?? 'lf-sound-toggle'}
      style={style}
      aria-label={on ? 'Выключить звук' : 'Включить звук'}
      title={on ? 'Звук вкл.' : 'Звук выкл.'}
      onClick={() => {
        const next = !on
        setOn(next)
        setSoundEnabled(next)
        if (next) playSound('tap')
      }}
    >
      {on ? '🔊' : '🔇'}
    </button>
  )
}
