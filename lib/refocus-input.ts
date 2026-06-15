import type { MouseEvent, TouchEvent } from 'react'

/** Держит фокус в поле ввода — важно для спринта на мобилке */
export function refocusInput(el: HTMLInputElement | null | undefined) {
  if (!el) return
  try {
    el.focus({ preventScroll: true })
  } catch {
    el.focus()
  }
}

/** Кнопка «✓» не крадёт фокус — клавиатура не закрывается */
export function keepInputFocusOnPress(e: MouseEvent | TouchEvent) {
  e.preventDefault()
}
