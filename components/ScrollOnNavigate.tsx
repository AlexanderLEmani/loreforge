'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** После перехода по вкладкам — показываем верх страницы (контент, не сайдбар). */
export default function ScrollOnNavigate() {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
