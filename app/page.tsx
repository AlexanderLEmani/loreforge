'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ensureGuestUserRow, guestLandingPath, signInAsGuest } from '@/lib/quick-start-auth'
import { useLoadingMessage } from '@/components/LoadingScreen'
import { markAuthPending, track, AUTH_PENDING_KEY } from '@/lib/analytics'

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'google' | 'guest' | null>(null)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setLoading('google')
    setError('')
    markAuthPending('google')
    track('auth_started', { method: 'google' })
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/hub`,
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
    markAuthPending('guest')
    track('auth_started', { method: 'guest' })
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
    track('auth_completed', { method: 'guest' })
    if (typeof window !== 'undefined') sessionStorage.removeItem(AUTH_PENDING_KEY)
    const path = await guestLandingPath(supabase, user.id)
    router.push(path)
    setLoading(null)
  }

  const busy = loading !== null
  const guestLoadingMsg = useLoadingMessage('auth', loading === 'guest')
  const googleLoadingMsg = useLoadingMessage('authGoogle', loading === 'google')

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
      <h1 style={{ fontSize: '48px', marginBottom: '8px' }}>LoreHeim</h1>
      <p style={{ color: '#9590a8', marginBottom: '12px' }}>Путь мастера: теория → практика → проверка. Для тех, кто учит математику сам.</p>
      <div style={{ maxWidth: '380px', marginBottom: '28px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
        <p style={{ color: '#9590a8', fontSize: '13px', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          <span style={{ color: '#3db87a' }}>Быстрый старт</span> — без Google, персонаж в один клик.
          Прогресс сохраняется <span style={{ color: '#e0bc6a' }}>на этом устройстве</span> (в этом браузере).
        </p>
        <p style={{ color: '#5a5670', fontSize: '12px', textAlign: 'center', lineHeight: 1.55, margin: '10px 0 0', fontStyle: 'italic' }}>
          Нужен тот же прогресс на другом телефоне или после очистки данных? — войди через Google ниже.
        </p>
      </div>

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
          {guestLoadingMsg || 'Войти без почты'}
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
          {googleLoadingMsg || 'Войти через Google'}
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
