'use client'

import { useMemo } from 'react'
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

export function LoadingScreen({ flavor = 'default' }: { flavor?: LoadingFlavor }) {
  const message = useMemo(() => pickLoadingMessage(flavor), [flavor])
  return <div style={shellStyle}>{message}</div>
}
