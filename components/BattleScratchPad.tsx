'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Tool = 'pen' | 'eraser'

const MIN_W = 260
const MIN_H = 200

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
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
  const panelRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const hasInk = useRef(false)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  const [tool, setTool] = useState<Tool>('pen')
  const [pos, setPos] = useState({ x: 24, y: 120 })
  const [size, setSize] = useState({ w: 380, h: 300 })

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
      img.onload = () => ctx.drawImage(img, 0, 0, w, h)
      img.src = snapshot
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const blockTouch = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault()
    }
    const blockCtx = (e: Event) => e.preventDefault()
    canvas.addEventListener('touchstart', blockTouch, { passive: false })
    canvas.addEventListener('touchmove', blockTouch, { passive: false })
    canvas.addEventListener('contextmenu', blockCtx)
    return () => {
      canvas.removeEventListener('touchstart', blockTouch)
      canvas.removeEventListener('touchmove', blockTouch)
      canvas.removeEventListener('contextmenu', blockCtx)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const blockPanelTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button')) return
      if (e.cancelable) e.preventDefault()
    }
    panel.addEventListener('touchstart', blockPanelTouch, { passive: false })
    panel.addEventListener('touchmove', blockPanelTouch, { passive: false })
    return () => {
      panel.removeEventListener('touchstart', blockPanelTouch)
      panel.removeEventListener('touchmove', blockPanelTouch)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = clamp(Math.min(420, vw - 24), MIN_W, vw - 24)
    const h = clamp(Math.min(340, vh * 0.42), MIN_H, vh - 24)
    setSize({ w, h })
    setPos({
      x: clamp((vw - w) / 2, 8, vw - w - 8),
      y: clamp(vh - h - 72, 8, vh - h - 8),
    })
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
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function strokeAt(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, activeTool: Tool) {
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = 20
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#e8e4f0'
      ctx.lineWidth = 2.5
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    canvas.setPointerCapture(e.pointerId)
    drawing.current = true
    lastPoint.current = pointerPos(canvas, e)
  }

  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !lastPoint.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const p = pointerPos(canvas, e)
    strokeAt(ctx, lastPoint.current, p, tool)
    lastPoint.current = p
    hasInk.current = true
  }

  function onCanvasPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    drawing.current = false
    lastPoint.current = null
  }

  function onDragPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
    e.stopPropagation()
  }

  function onDragPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const vw = window.innerWidth
    const vh = window.innerHeight
    setPos({
      x: clamp(dragRef.current.origX + dx, 4, vw - size.w - 4),
      y: clamp(dragRef.current.origY + dy, 4, vh - size.h - 4),
    })
  }

  function onDragPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    dragRef.current = null
  }

  function onResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeRef.current) return
    const dx = e.clientX - resizeRef.current.startX
    const dy = e.clientY - resizeRef.current.startY
    const vw = window.innerWidth
    const vh = window.innerHeight
    setSize({
      w: clamp(resizeRef.current.origW + dx, MIN_W, vw - pos.x - 8),
      h: clamp(resizeRef.current.origH + dy, MIN_H, vh - pos.y - 8),
    })
  }

  function onResizePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    resizeRef.current = null
    setTimeout(resizeCanvas, 0)
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
    <div className="lf-battle-scratch-layer" role="dialog" aria-modal="false" aria-label="Черновик для счёта">
      <div
        ref={panelRef}
        className="lf-battle-scratch-panel lf-battle-scratch-panel--floating"
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
        draggable={false}
        onContextMenu={e => e.preventDefault()}
      >
        <div
          className="lf-battle-scratch-head lf-battle-scratch-drag"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
        >
          <div className="lf-battle-scratch-drag-grip">⠿</div>
          <div className="lf-battle-scratch-head-text">
            <div className="lf-battle-scratch-title">Черновик</div>
            <div className="lf-battle-scratch-hint">Тяни заголовок · угол — размер · таймер идёт</div>
          </div>
          <div className="lf-battle-scratch-tools">
            <button
              type="button"
              className={`lf-battle-scratch-tool${tool === 'pen' ? ' lf-battle-scratch-tool--active' : ''}`}
              onClick={() => setTool('pen')}
              aria-label="Карандаш"
            >
              ✏️
            </button>
            <button
              type="button"
              className={`lf-battle-scratch-tool${tool === 'eraser' ? ' lf-battle-scratch-tool--active' : ''}`}
              onClick={() => setTool('eraser')}
              aria-label="Губка"
            >
              🧽
            </button>
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
            draggable={false}
            onContextMenu={e => e.preventDefault()}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerCancel={onCanvasPointerUp}
          />
        </div>
        <div
          className="lf-battle-scratch-resize"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
