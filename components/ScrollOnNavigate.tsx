'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { migrateLegacyStorageKeys } from '@/lib/storage-migrate'
import { warmupAudio } from '@/lib/sounds'

/** После перехода по вкладкам — показываем верх страницы (контент, не сайдбар). */
export default function ScrollOnNavigate() {
  const pathname = usePathname()

  useEffect(() => {
    migrateLegacyStorageKeys()
    const warm = () => warmupAudio()
    window.addEventListener('pointerdown', warm, { once: true })
    return () => window.removeEventListener('pointerdown', warm)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
