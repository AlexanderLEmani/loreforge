'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Hub() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Сохраняем пользователя в БД если его там ещё нет
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      }, { onConflict: 'id' })

      setUser(user)
    }
    getUser()
  }, [])

  if (!user) return (
    <div style={{
      background: '#0b0c10',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9590a8',
      fontFamily: 'serif'
    }}>
      Загрузка...
    </div>
  )

  return (
    <main style={{
      background: '#0b0c10',
      minHeight: '100vh',
      color: '#e0bc6a',
      fontFamily: 'serif',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>LoreForge</h1>
      <p style={{ color: '#9590a8', marginBottom: '2rem' }}>
        Привет, {user.user_metadata?.full_name || user.email}
      </p>
      <div style={{
        background: '#1c1f2a',
        border: '1px solid #c9a84c',
        padding: '1.5rem',
        maxWidth: '400px'
      }}>
        <p style={{ fontSize: '14px', color: '#9590a8', marginBottom: '4px', fontFamily: 'monospace' }}>ПЕРСОНАЖ</p>
        <p style={{ fontSize: '24px' }}>🧙 Аркан</p>
        <p style={{ color: '#9590a8', fontSize: '14px' }}>Странствующий маг · Ур. 1</p>
      </div>
    </main>
  )
}