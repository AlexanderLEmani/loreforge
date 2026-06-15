'use client'

import { useCallback, useEffect, useRef } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function drawPaperGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1a1e28'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = 1

  const colStep = Math.max(36, Math.round(w / 10))
  for (let x = colStep; x < w; x += colStep) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  const rowStep = 32
  for (let y = rowStep; y < h; y += rowStep) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
}

export default function BattleScratchPad({ open, onOpenChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const hasInk = useRef(false)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const rect = wrap.getBoundingClientRect()
    const w = Math.max(1, Math.floor(rect.width))
    const h = Math.max(1, Math.floor(rect.height))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const snapshot = hasInk.current ? canvas.toDataURL() : null

    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawPaperGrid(ctx, w, h)

    if (snapshot) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h)
      }
      img.src = snapshot
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(resizeCanvas, 0)
    return () => clearTimeout(t)
  }, [open, resizeCanvas])

  useEffect(() => {
    if (!open) return
    const wrap = wrapRef.current
    if (!wrap || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => resizeCanvas())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [open, resizeCanvas])

  function pointerPos(canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    canvas.setPointerCapture(e.pointerId)
    drawing.current = true
    lastPoint.current = pointerPos(canvas, e)
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const p = pointerPos(canvas, e)
    ctx.strokeStyle = '#e8e4f0'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPoint.current = p
    hasInk.current = true
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId)
    }
    drawing.current = false
    lastPoint.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const rect = wrap.getBoundingClientRect()
    const w = Math.max(1, Math.floor(rect.width))
    const h = Math.max(1, Math.floor(rect.height))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawPaperGrid(ctx, w, h)
    hasInk.current = false
  }

  if (!open) return null

  return (
    <div
      className="lf-battle-scratch-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Черновик для счёта"
      onClick={() => onOpenChange(false)}
    >
      <div className="lf-battle-scratch-panel" onClick={e => e.stopPropagation()}>
        <div className="lf-battle-scratch-head">
          <div>
            <div className="lf-battle-scratch-title">Черновик</div>
            <div className="lf-battle-scratch-hint">Считай в столбик · таймер не останавливается</div>
          </div>
          <div className="lf-battle-scratch-actions">
            <button type="button" className="lf-battle-scratch-btn" onClick={clearCanvas}>
              Очистить
            </button>
            <button type="button" className="lf-battle-scratch-btn lf-battle-scratch-btn--primary" onClick={() => onOpenChange(false)}>
              Скрыть
            </button>
          </div>
        </div>
        <div ref={wrapRef} className="lf-battle-scratch-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="lf-battle-scratch-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>
    </div>
  )
}
