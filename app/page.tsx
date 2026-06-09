'use client'

import { createClient } from '@/lib/supabase'

export default function Home() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/hub`
      }
    })
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0b0c10',
      color: '#e0bc6a',
      fontFamily: 'serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '8px' }}>LoreForge</h1>
      <p style={{ color: '#9590a8', marginBottom: '40px' }}>Знание есть сила</p>
      <button
        onClick={signInWithGoogle}
        style={{
          padding: '14px 32px',
          background: 'transparent',
          border: '1px solid #c9a84c',
          color: '#e0bc6a',
          fontSize: '16px',
          cursor: 'pointer',
          fontFamily: 'serif'
        }}
      >
        Войти через Google
      </button>
    </main>
  )
}