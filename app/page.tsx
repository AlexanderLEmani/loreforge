'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ensureGuestUserRow, guestLandingPath, signInAsGuest } from '@/lib/quick-start-auth'

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'google' | 'guest' | null>(null)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setLoading('google')
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/hub`,
      },
    })
    if (oauthError) {
      setError('Не удалось открыть вход через Google. Попробуй ещё раз.')
      setLoading(null)
    }
  }

  async function quickStart() {
    setLoading('guest')
    setError('')
    const { user, errorMessage } = await signInAsGuest(supabase)
    if (!user) {
      setError(
        errorMessage?.toLowerCase().includes('rate limit')
          ? 'Лимит писем Supabase (часто после многих попыток). Подожди ~1 час или добавь SUPABASE_SERVICE_ROLE_KEY в Vercel и передеплой — тогда письма не нужны.'
          : errorMessage?.includes('Signups not allowed')
            ? 'Регистрация отключена в Supabase. Включи Sign-ups в Authentication → Providers → Email.'
            : errorMessage ?? 'Не удалось начать игру. Попробуй ещё раз или войди через Google.',
      )
      setLoading(null)
      return
    }
    await ensureGuestUserRow(supabase, user)
    const path = await guestLandingPath(supabase, user.id)
    router.push(path)
    setLoading(null)
  }

  const busy = loading !== null

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: '#0b0c10',
        color: '#e0bc6a',
        fontFamily: 'serif',
      }}
    >
      <h1 style={{ fontSize: '48px', marginBottom: '8px' }}>LoreForge</h1>
      <p style={{ color: '#9590a8', marginBottom: '12px' }}>Знание есть сила</p>
      <p style={{ color: '#5a5670', fontSize: '13px', marginBottom: '36px', maxWidth: '360px', textAlign: 'center', lineHeight: 1.6 }}>
        Можно начать без Google — создай персонажа в один клик. Прогресс сохранится на этом устройстве.
      </p>

      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          onClick={quickStart}
          disabled={busy}
          style={{
            padding: '16px 24px',
            background: busy && loading !== 'guest' ? 'rgba(61,184,122,0.04)' : 'rgba(61,184,122,0.14)',
            border: '1px solid rgba(61,184,122,0.55)',
            color: busy && loading !== 'guest' ? '#5a5670' : '#3db87a',
            fontSize: '17px',
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'serif',
            borderRadius: '10px',
          }}
        >
          {loading === 'guest' ? 'Загрузка...' : 'Я Иоанн и у меня нет гугл почты'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.1em' }}>ИЛИ</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={busy}
          style={{
            padding: '14px 24px',
            background: 'transparent',
            border: '1px solid #c9a84c',
            color: busy && loading !== 'google' ? '#5a5670' : '#e0bc6a',
            fontSize: '15px',
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'serif',
            borderRadius: '10px',
          }}
        >
          {loading === 'google' ? 'Перенаправление...' : 'Войти через Google'}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: '20px', maxWidth: '360px', fontSize: '13px', color: '#e05555', textAlign: 'center', lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </main>
  )
}
