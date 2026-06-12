'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TYPE_COLORS,
  type SkillTreeNode,
  getNodeState,
} from '@/lib/skill-tree'

const BG = '#151820'
const GOLD = '#e0bc6a'
const PURPLE = '#b8aeff'
const LOCKED = '#5a6070'
const LOCKED_LINE = '#3a4050'

type Props = {
  nodes: SkillTreeNode[]
  unlockedIds: Set<number>
  userLevel: number
  skillPoints: number
  selectedId: number | null
  onSelect: (id: number | null) => void
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
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 })
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const downPointerRef = useRef({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)

  const fitToNodes = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || nodes.length === 0) return

    const xs = nodes.map(n => n.position_x)
    const ys = nodes.map(n => n.position_y)
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
  }, [nodes])

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

    ctx.fillStyle = BG
    ctx.fillRect(0, 0, w, h)

    // subtle grid
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1 / scale
    for (let x = -200; x < 1200; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, -200)
      ctx.lineTo(x, 800)
      ctx.stroke()
    }
    for (let y = -200; y < 800; y += 40) {
      ctx.beginPath()
      ctx.moveTo(-200, y)
      ctx.lineTo(1200, y)
      ctx.stroke()
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // edges
    for (const node of nodes) {
      if (node.requires === null) continue
      const parent = nodeMap.get(node.requires)
      if (!parent) continue

      const pState = getNodeState(parent, unlockedIds, userLevel, skillPoints)
      const cState = getNodeState(node, unlockedIds, userLevel, skillPoints)
      const lit = pState === 'unlocked' && (cState === 'unlocked' || cState === 'available')

      ctx.beginPath()
      ctx.moveTo(parent.position_x, parent.position_y)
      ctx.lineTo(node.position_x, node.position_y)
      ctx.strokeStyle = lit ? (pState === 'unlocked' && cState === 'unlocked' ? GOLD : PURPLE) : LOCKED_LINE
      ctx.globalAlpha = lit ? 0.85 : 0.35
      ctx.lineWidth = lit ? 2.5 / scale : 1.5 / scale
      if (lit) {
        ctx.shadowColor = cState === 'unlocked' ? GOLD : PURPLE
        ctx.shadowBlur = 8 / scale
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    // nodes
    for (const node of nodes) {
      const state = getNodeState(node, unlockedIds, userLevel, skillPoints)
      const r = nodeRadius(node.type)
      const color = TYPE_COLORS[node.type]
      const isSelected = selectedId === node.id

      ctx.beginPath()
      ctx.arc(node.position_x, node.position_y, r + 6, 0, Math.PI * 2)
      if (state === 'unlocked') {
        ctx.fillStyle = `${color}18`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(node.position_x, node.position_y, r, 0, Math.PI * 2)
      if (state === 'unlocked') {
        ctx.fillStyle = '#1e2430'
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5 / scale
        ctx.shadowColor = color
        ctx.shadowBlur = 14 / scale
      } else if (state === 'available') {
        ctx.fillStyle = '#222836'
        ctx.strokeStyle = color
        ctx.lineWidth = 2 / scale
        ctx.shadowColor = color
        ctx.shadowBlur = 8 / scale
      } else {
        ctx.fillStyle = '#1a1f28'
        ctx.strokeStyle = LOCKED
        ctx.lineWidth = 1.5 / scale
        ctx.shadowBlur = 0
      }
      if (isSelected) {
        ctx.strokeStyle = GOLD
        ctx.lineWidth = 3 / scale
        ctx.shadowColor = GOLD
        ctx.shadowBlur = 18 / scale
      }
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.fillStyle = state === 'locked' ? '#7a8090' : color
      ctx.font = `bold ${(node.type === 'passive' ? 12 : 14) / scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.icon || '✦', node.position_x, node.position_y)
    }

    ctx.restore()
  }, [nodes, unlockedIds, userLevel, skillPoints, selectedId])

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

  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    downPointerRef.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
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
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        cursor: 'grab',
        touchAction: 'none',
        background: BG,
      }}
      onWheel={onWheel}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
