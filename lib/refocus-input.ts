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

/** iOS часто закрывает клавиатуру после Enter — несколько попыток refocus */
export function scheduleInputRefocus(el: HTMLInputElement | null | undefined) {
  if (!el) return
  const focus = () => refocusInput(el)
  requestAnimationFrame(focus)
  setTimeout(focus, 0)
  setTimeout(focus, 50)
  setTimeout(focus, 120)
}

/** Кнопка «✓» не крадёт фокус — клавиатура не закрывается */
export function keepInputFocusOnPress(e: MouseEvent | TouchEvent) {
  e.preventDefault()
}
