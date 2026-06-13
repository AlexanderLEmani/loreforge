'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BRANCHES,
  TYPE_COLORS,
  type SkillBranch,
  type SkillTreeNode,
  getNodeState,
} from '@/lib/skill-tree'

const BG_TOP = '#0c0e14'
const BG_BOTTOM = '#06080c'
const GOLD = '#e0bc6a'
const PURPLE = '#b8aeff'
const LOCKED = '#5a6070'
const LOCKED_LINE = '#2a3040'

type Props = {
  nodes: SkillTreeNode[]
  unlockedIds: Set<number>
  userLevel: number
  skillPoints: number
  selectedId: number | null
  onSelect: (id: number | null) => void
  highlightBranch?: SkillBranch | null
}

function nodeRadius(type: SkillTreeNode['type']): number {
  if (type === 'passive') return 16
  if (type === 'defense') return 22
  return 20
}

export default function SkillTreeCanvas({
  nodes,
  unlockedIds,
  userLevel,
  skillPoints,
  selectedId,
  onSelect,
  highlightBranch = null,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 })
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const downPointerRef = useRef({ x: 0, y: 0 })
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const [ready, setReady] = useState(false)

  const fitToNodes = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || nodes.length === 0) return

    const filtered = highlightBranch
      ? nodes.filter(n => n.branch === highlightBranch)
      : nodes
    const target = filtered.length > 0 ? filtered : nodes

    const xs = target.map(n => n.position_x)
    const ys = target.map(n => n.position_y)
    const minX = Math.min(...xs) - 80
    const maxX = Math.max(...xs) + 80
    const minY = Math.min(...ys) - 80
    const maxY = Math.max(...ys) + 80
    const w = maxX - minX
    const h = maxY - minY
    const pad = 40
    const scaleX = (container.clientWidth - pad * 2) / w
    const scaleY = (container.clientHeight - pad * 2) / h
    const scale = Math.min(scaleX, scaleY, 1.4)

    transformRef.current = {
      scale,
      offsetX: (container.clientWidth - w * scale) / 2 - minX * scale,
      offsetY: (container.clientHeight - h * scale) / 2 - minY * scale,
    }
  }, [nodes, highlightBranch])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const w = container.clientWidth
    const h = container.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const { scale, offsetX, offsetY } = transformRef.current

    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, BG_TOP)
    grad.addColorStop(1, BG_BOTTOM)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, h * 0.85)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.04)'
    ctx.lineWidth = 1 / scale
    for (let x = -200; x < 1600; x += 48) {
      ctx.beginPath()
      ctx.moveTo(x, -200)
      ctx.lineTo(x, 800)
      ctx.stroke()
    }
    for (let y = -200; y < 800; y += 48) {
      ctx.beginPath()
      ctx.moveTo(-200, y)
      ctx.lineTo(1600, y)
      ctx.stroke()
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    function branchDim(branch: SkillBranch): number {
      if (!highlightBranch) return 1
      return branch === highlightBranch ? 1 : 0.22
    }

    for (const node of nodes) {
      if (node.requires === null) continue
      const parent = nodeMap.get(node.requires)
      if (!parent) continue

      const dim = Math.min(branchDim(node.branch), branchDim(parent.branch))
      const pState = getNodeState(parent, unlockedIds, userLevel, skillPoints)
      const cState = getNodeState(node, unlockedIds, userLevel, skillPoints)
      const lit = pState === 'unlocked' && (cState === 'unlocked' || cState === 'available')

      ctx.beginPath()
      ctx.moveTo(parent.position_x, parent.position_y)
      ctx.lineTo(node.position_x, node.position_y)
      ctx.strokeStyle = lit ? (cState === 'unlocked' ? GOLD : PURPLE) : LOCKED_LINE
      ctx.globalAlpha = lit ? 0.9 * dim : 0.25 * dim
      ctx.lineWidth = lit ? 3 / scale : 1.5 / scale
      if (lit && dim > 0.5) {
        ctx.shadowColor = cState === 'unlocked' ? GOLD : PURPLE
        ctx.shadowBlur = 10 / scale
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    for (const node of nodes) {
      const dim = branchDim(node.branch)
      const state = getNodeState(node, unlockedIds, userLevel, skillPoints)
      const r = nodeRadius(node.type)
      const branchColor = BRANCHES.find(b => b.id === node.branch)?.color ?? TYPE_COLORS[node.type]
      const color = state === 'locked' ? TYPE_COLORS[node.type] : branchColor
      const isSelected = selectedId === node.id

      ctx.globalAlpha = dim

      ctx.beginPath()
      ctx.arc(node.position_x, node.position_y, r + 8, 0, Math.PI * 2)
      if (state === 'unlocked') {
        ctx.fillStyle = `${color}20`
        ctx.fill()
      } else if (state === 'available') {
        ctx.fillStyle = `${color}12`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(node.position_x, node.position_y, r, 0, Math.PI * 2)
      if (state === 'unlocked') {
        ctx.fillStyle = '#12161f'
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5 / scale
        ctx.shadowColor = color
        ctx.shadowBlur = 16 / scale
      } else if (state === 'available') {
        ctx.fillStyle = '#1a2030'
        ctx.strokeStyle = color
        ctx.lineWidth = 2 / scale
        ctx.shadowColor = color
        ctx.shadowBlur = 12 / scale
      } else {
        ctx.fillStyle = '#10141c'
        ctx.strokeStyle = LOCKED
        ctx.lineWidth = 1.5 / scale
        ctx.shadowBlur = 0
      }
      if (isSelected) {
        ctx.strokeStyle = GOLD
        ctx.lineWidth = 3.5 / scale
        ctx.shadowColor = GOLD
        ctx.shadowBlur = 22 / scale
      }
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.fillStyle = state === 'locked' ? '#6a7080' : color
      ctx.font = `bold ${(node.type === 'passive' ? 12 : 14) / scale}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.icon || '✦', node.position_x, node.position_y)

      ctx.globalAlpha = 1
    }

    ctx.restore()
  }, [nodes, unlockedIds, userLevel, skillPoints, selectedId, highlightBranch])

  useEffect(() => {
    fitToNodes()
    setReady(true)
  }, [fitToNodes])

  useEffect(() => {
    if (!ready) return
    draw()
  }, [draw, ready])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      fitToNodes()
      draw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [draw, fitToNodes])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function touchDist(touches: TouchList) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pinchRef.current = { dist: touchDist(e.touches), scale: transformRef.current.scale }
        draggingRef.current = false
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!el || e.touches.length !== 2 || !pinchRef.current) return
      e.preventDefault()
      const dist = touchDist(e.touches)
      const ratio = dist / pinchRef.current.dist
      const newScale = Math.min(2.5, Math.max(0.35, pinchRef.current.scale * ratio))
      const rect = el.getBoundingClientRect()
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
        const { scale, offsetX, offsetY } = transformRef.current
        const wx = (mx - offsetX) / scale
        const wy = (my - offsetY) / scale
        transformRef.current.scale = newScale
        transformRef.current.offsetX = mx - wx * newScale
        transformRef.current.offsetY = my - wy * newScale
        draw()
    }

    function onTouchEnd() {
      pinchRef.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [draw])

  function worldFromClient(clientX: number, clientY: number) {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    const { scale, offsetX, offsetY } = transformRef.current
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    }
  }

  function hitTest(wx: number, wy: number): number | null {
    for (const node of nodes) {
      const r = nodeRadius(node.type) + 4
      const dx = wx - node.position_x
      const dy = wy - node.position_y
      if (dx * dx + dy * dy <= r * r) return node.id
    }
    return null
  }

  function zoomAt(factor: number) {
    const container = containerRef.current
    if (!container) return
    const mx = container.clientWidth / 2
    const my = container.clientHeight / 2
    const { scale, offsetX, offsetY } = transformRef.current
    const newScale = Math.min(2.5, Math.max(0.35, scale * factor))
    const wx = (mx - offsetX) / scale
    const wy = (my - offsetY) / scale
    transformRef.current.scale = newScale
    transformRef.current.offsetX = mx - wx * newScale
    transformRef.current.offsetY = my - wy * newScale
    draw()
  }

  function onPointerDown(e: React.PointerEvent) {
    if (pinchRef.current) return
    draggingRef.current = true
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    downPointerRef.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || pinchRef.current) return
    const dx = e.clientX - lastPointerRef.current.x
    const dy = e.clientY - lastPointerRef.current.y
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    transformRef.current.offsetX += dx
    transformRef.current.offsetY += dy
    draw()
  }

  function onPointerUp(e: React.PointerEvent) {
    const moved =
      Math.abs(e.clientX - downPointerRef.current.x) > 4 ||
      Math.abs(e.clientY - downPointerRef.current.y) > 4
    draggingRef.current = false
    if (!moved) {
      const { x, y } = worldFromClient(e.clientX, e.clientY)
      const hit = hitTest(x, y)
      onSelect(hit === selectedId ? null : hit)
    }
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { scale, offsetX, offsetY } = transformRef.current
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const newScale = Math.min(2.5, Math.max(0.35, scale * factor))
    const wx = (mx - offsetX) / scale
    const wy = (my - offsetY) / scale
    transformRef.current.scale = newScale
    transformRef.current.offsetX = mx - wx * newScale
    transformRef.current.offsetY = my - wy * newScale
    draw()
  }

  return (
    <div className="lf-skill-tree-canvas-wrap">
      <div
        ref={containerRef}
        className="lf-skill-tree-canvas-inner"
        onWheel={onWheel}
      >
        <canvas
          ref={canvasRef}
          className="lf-skill-tree-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>
      <div className="lf-skill-tree-zoom">
        <button type="button" className="lf-skill-tree-zoom-btn" onClick={() => zoomAt(1.15)} aria-label="Увеличить">+</button>
        <button type="button" className="lf-skill-tree-zoom-btn" onClick={() => zoomAt(0.87)} aria-label="Уменьшить">−</button>
        <button type="button" className="lf-skill-tree-zoom-btn" onClick={() => { fitToNodes(); draw() }} aria-label="Центр">◎</button>
      </div>
      <div className="lf-skill-tree-hint lf-skill-tree-hint--desktop">Перетаскивание · колёсико — зум</div>
      <div className="lf-skill-tree-hint lf-skill-tree-hint--mobile">Тяни · два пальца — зум</div>
    </div>
  )
}
