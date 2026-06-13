'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { pickLoadingMessage, type LoadingFlavor } from '@/lib/loading-flavor'

const shellStyle: CSSProperties = {
  background: '#0b0c10',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9590a8',
  fontFamily: 'serif',
  fontSize: '18px',
  padding: '2rem',
  textAlign: 'center',
  lineHeight: 1.5,
}

/** Стабильный placeholder для SSR — случайный текст только после mount (без hydration mismatch). */
const SSR_PLACEHOLDER = '· · ·'

export function LoadingScreen({ flavor = 'default' }: { flavor?: LoadingFlavor }) {
  const [message, setMessage] = useState(SSR_PLACEHOLDER)

  useEffect(() => {
    setMessage(pickLoadingMessage(flavor))
  }, [flavor])

  return <div style={shellStyle}>{message}</div>
}

export function useLoadingMessage(flavor: LoadingFlavor, active = true): string {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!active) {
      setMessage('')
      return
    }
    setMessage(pickLoadingMessage(flavor))
  }, [flavor, active])

  return message
}
