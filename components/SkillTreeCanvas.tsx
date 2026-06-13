'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BRANCHES,
  TYPE_COLORS,
  branchMeta,
  type SkillTreeNode,
  getNodeState,
} from '@/lib/skill-tree'
import {
  BRANCH_SPINE_LINKS,
  branchWedgeAngles,
  isBranchMasterNode,
  isSpineLinkPair,
  SKILL_TREE_DETAIL_RADIUS,
  SKILL_TREE_LAYOUT_RADIUS,
} from '@/lib/skill-tree-layout'

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
  highlightBranch?: string | null
  /** Все узлы с координатами — для мостов между темами */
  allNodes?: SkillTreeNode[]
  fitAll?: boolean
  compact?: boolean
  /** Кривые мосты между темами — только в обзоре на мобилке */
  spineCurves?: boolean
}

function nodeRadius(node: SkillTreeNode): number {
  if (node.id === 0) return 24
  if (node.type === 'passive') return 15
  if (node.type === 'defense') return 19
  return 17
}

export default function SkillTreeCanvas({
  nodes,
  unlockedIds,
  userLevel,
  skillPoints,
  selectedId,
  onSelect,
  highlightBranch = null,
  allNodes,
  fitAll = false,
  compact = false,
  spineCurves = false,
}: Props) {
  const layoutNodes = allNodes ?? nodes
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 })
  const draggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const downPointerRef = useRef({ x: 0, y: 0 })
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const [ready, setReady] = useState(false)

  const fitToNodes = useCallback(() => {
    const container = containerRef.current
    if (!container || nodes.length === 0) return

    const filtered = highlightBranch
      ? nodes.filter(n => n.branch === highlightBranch || n.id === 0)
      : nodes
    const target = filtered.length > 0 ? filtered : nodes

    const xs = target.map(n => n.position_x)
    const ys = target.map(n => n.position_y)
    const margin = compact ? 56 : 120
    const minX = Math.min(...xs) - margin
    const maxX = Math.max(...xs) + margin
    const minY = Math.min(...ys) - margin
    const maxY = Math.max(...ys) + margin
    const w = maxX - minX
    const h = maxY - minY
    const pad = fitAll ? 24 : 40
    const scaleX = (container.clientWidth - pad * 2) / w
    const scaleY = (container.clientHeight - pad * 2) / h
    const maxScale = fitAll ? 1.05 : 1.4
    const scale = Math.min(scaleX, scaleY, maxScale)

    transformRef.current = {
      scale,
      offsetX: (container.clientWidth - w * scale) / 2 - minX * scale,
      offsetY: (container.clientHeight - h * scale) / 2 - minY * scale,
    }
  }, [nodes, highlightBranch, fitAll])

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

    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    bg.addColorStop(0, '#141820')
    bg.addColorStop(1, '#06080c')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    const detailView = compact && !spineCurves
    const visibleIds = new Set(nodes.map(n => n.id))

    let cx: number
    let cy: number
    if (detailView && nodes.length > 0) {
      const xs = nodes.map(n => n.position_x)
      const ys = nodes.map(n => n.position_y)
      cx = (Math.min(...xs) + Math.max(...xs)) / 2
      cy = (Math.min(...ys) + Math.max(...ys)) / 2
    } else {
      cx = nodes.find(n => n.id === 0)?.position_x ?? 500
      cy = nodes.find(n => n.id === 0)?.position_y ?? 440
    }
    const wedgeR = detailView ? SKILL_TREE_DETAIL_RADIUS : SKILL_TREE_LAYOUT_RADIUS

    if (detailView) {
      const branchColor =
        BRANCHES.find(b => b.id === nodes.find(n => n.id > 0)?.branch)?.color ?? '#3db87a'
      ctx.beginPath()
      ctx.arc(cx, cy, wedgeR, 0, Math.PI * 2)
      ctx.fillStyle = branchColor
      ctx.globalAlpha = 0.07
      ctx.fill()
      ctx.globalAlpha = 1
      for (let r = 50; r <= wedgeR; r += 50) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(201, 168, 76, 0.08)'
        ctx.lineWidth = 1 / scale
        ctx.stroke()
      }
    } else {
      for (const wedge of branchWedgeAngles()) {
        const dim = highlightBranch && highlightBranch !== wedge.branch ? 0.35 : 1
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, wedgeR, wedge.start, wedge.end)
        ctx.closePath()
        ctx.fillStyle = wedge.color
        ctx.globalAlpha = 0.06 * dim
        ctx.fill()
        ctx.globalAlpha = 1
      }

      for (let r = 70; r <= wedgeR; r += 50) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(201, 168, 76, 0.06)'
        ctx.lineWidth = 1 / scale
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(201, 168, 76, 0.04)'
      ctx.lineWidth = 1 / scale
      for (let a = 0; a < 6; a++) {
        const ang = -Math.PI / 2 + a * (Math.PI / 3)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(ang) * wedgeR, cy + Math.sin(ang) * wedgeR)
        ctx.stroke()
      }
    }

    const nodeMap = new Map(layoutNodes.map(n => [n.id, n]))
    const cxHub = layoutNodes.find(n => n.id === 0)?.position_x ?? 500
    const cyHub = layoutNodes.find(n => n.id === 0)?.position_y ?? 420

    function branchDim(branch: string): number {
      if (!highlightBranch) return 1
      return branch === highlightBranch ? 1 : 0.2
    }

    function drawSpineCurve(
      c: CanvasRenderingContext2D,
      from: SkillTreeNode,
      to: SkillTreeNode,
      lit: boolean,
      available: boolean,
    ) {
      const dim = Math.min(branchDim(from.branch), branchDim(to.branch))
      const fx = from.position_x
      const fy = from.position_y
      const tx = to.position_x
      const ty = to.position_y
      const mx = (fx + tx) / 2
      const my = (fy + ty) / 2
      const dx = mx - cxHub
      const dy = my - cyHub
      const len = Math.hypot(dx, dy) || 1
      const bulge = compact ? 22 : 38
      const cpx = mx + (dx / len) * bulge
      const cpy = my + (dy / len) * bulge

      c.beginPath()
      c.moveTo(fx, fy)
      c.quadraticCurveTo(cpx, cpy, tx, ty)
      const stroke = lit ? GOLD : available ? PURPLE : 'rgba(90, 96, 112, 0.55)'
      c.strokeStyle = stroke
      c.globalAlpha = lit ? 0.95 * dim : available ? 0.75 * dim : 0.45 * dim
      c.lineWidth = (lit || available ? 4 : 2.5) / scale
      if (lit || available) {
        c.shadowColor = lit ? GOLD : PURPLE
        c.shadowBlur = (compact ? 6 : 14) / scale
      }
      if (!lit && !available) c.setLineDash([6 / scale, 5 / scale])
      c.stroke()
      c.setLineDash([])
      c.shadowBlur = 0
      c.globalAlpha = 1

      const toMeta = branchMeta(to.branch)
      if (toMeta && dim > 0.35 && scale > 0.25) {
        const label = `${toMeta.icon}`
        c.font = `bold ${Math.max(9, 11 / scale)}px serif`
        c.fillStyle = lit ? GOLD : available ? PURPLE : '#6a7080'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillText(label, cpx, cpy)
      }
    }

    for (const link of BRANCH_SPINE_LINKS) {
      if (!spineCurves) continue
      const from = nodeMap.get(link.fromId)
      const to = nodeMap.get(link.toId)
      if (!from || !to) continue
      const fromVisible = nodes.some(n => n.id === link.fromId)
      const toVisible = nodes.some(n => n.id === link.toId)
      if (!fromVisible && !toVisible) continue

      const pState = getNodeState(from, unlockedIds, userLevel, skillPoints)
      const cState = getNodeState(to, unlockedIds, userLevel, skillPoints)
      const lit = pState === 'unlocked' && cState === 'unlocked'
      const available = pState === 'unlocked' && cState === 'available'
      drawSpineCurve(ctx, from, to, lit, available)
    }

    const addRoot = nodeMap.get(1)
    const center = nodeMap.get(0)
    if (spineCurves && center && addRoot && nodes.some(n => n.id === 0 || n.id === 1)) {
      const lit = unlockedIds.has(1)
      const avail = getNodeState(addRoot, unlockedIds, userLevel, skillPoints) === 'available'
      drawSpineCurve(ctx, center, addRoot, lit, avail && !lit)
    }

    for (const node of nodes) {
      if (node.requires === null) continue
      const parent = nodeMap.get(node.requires)
      if (!parent) continue
      if (!visibleIds.has(parent.id)) continue
      if (spineCurves && isSpineLinkPair(parent.id, node.id)) continue

      const dim = Math.min(branchDim(node.branch), branchDim(parent.branch))
      const pState = getNodeState(parent, unlockedIds, userLevel, skillPoints)
      const cState = getNodeState(node, unlockedIds, userLevel, skillPoints)
      const lit = pState === 'unlocked' && (cState === 'unlocked' || cState === 'available')

      ctx.beginPath()
      ctx.moveTo(parent.position_x, parent.position_y)
      ctx.lineTo(node.position_x, node.position_y)
      ctx.strokeStyle = lit ? (cState === 'unlocked' ? GOLD : PURPLE) : LOCKED_LINE
      ctx.globalAlpha = lit ? 0.92 * dim : 0.28 * dim
      ctx.lineWidth = lit ? (compact ? 2.5 : 3.5) / scale : 1.5 / scale
      if (lit && dim > 0.4) {
        ctx.shadowColor = cState === 'unlocked' ? GOLD : PURPLE
        ctx.shadowBlur = (compact ? 5 : 12) / scale
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    for (const node of nodes) {
      const dim = branchDim(node.branch)
      const state = node.id === 0
        ? (unlockedIds.has(0) || true ? 'unlocked' : 'unlocked')
        : getNodeState(node, unlockedIds, userLevel, skillPoints)
      const r = nodeRadius(node)
      const branchColor = BRANCHES.find(b => b.id === node.branch)?.color ?? TYPE_COLORS[node.type]
      const color = state === 'locked' ? TYPE_COLORS[node.type] : branchColor
      const isSelected = selectedId === node.id

      ctx.globalAlpha = dim

      if (node.id === 0) {
        ctx.beginPath()
        ctx.arc(node.position_x, node.position_y, r + 14, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(201, 168, 76, 0.08)'
        ctx.fill()
      }

      if (isBranchMasterNode(node.id)) {
        ctx.beginPath()
        ctx.arc(node.position_x, node.position_y, r + 10, 0, Math.PI * 2)
        ctx.strokeStyle = state === 'unlocked' ? GOLD : state === 'available' ? PURPLE : 'rgba(201, 168, 76, 0.35)'
        ctx.lineWidth = 2 / scale
        ctx.setLineDash([4 / scale, 3 / scale])
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.beginPath()
      ctx.arc(node.position_x, node.position_y, r + (state === 'available' ? 6 : 4), 0, Math.PI * 2)
      if (state === 'unlocked' || node.id === 0) {
        ctx.fillStyle = `${color}22`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(node.position_x, node.position_y, r, 0, Math.PI * 2)
      if (state === 'unlocked' || node.id === 0) {
        ctx.fillStyle = '#10141c'
        ctx.strokeStyle = color
        ctx.lineWidth = (compact ? 2 : 2.5) / scale
        ctx.shadowColor = color
        ctx.shadowBlur = (compact ? 6 : (node.id === 0 ? 20 : 14)) / scale
      } else if (state === 'available') {
        ctx.fillStyle = '#1a2030'
        ctx.strokeStyle = color
        ctx.lineWidth = 2 / scale
        ctx.shadowColor = color
        ctx.shadowBlur = (compact ? 5 : 10) / scale
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
      ctx.font = `bold ${(node.id === 0 ? 16 : node.type === 'passive' ? 12 : 14) / scale}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.icon || '✦', node.position_x, node.position_y)

      ctx.globalAlpha = 1
    }

    ctx.restore()
  }, [nodes, unlockedIds, userLevel, skillPoints, selectedId, highlightBranch, compact, spineCurves, layoutNodes])

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
    if (!el || fitAll) return

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
  }, [draw, fitAll])

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
    const pad = compact ? 16 : 8
    let best: { id: number; d: number } | null = null
    for (const node of nodes) {
      const r = nodeRadius(node) + pad
      const dx = wx - node.position_x
      const dy = wy - node.position_y
      const d = dx * dx + dy * dy
      if (d <= r * r && (!best || d < best.d)) best = { id: node.id, d }
    }
    return best?.id ?? null
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
    downPointerRef.current = { x: e.clientX, y: e.clientY }
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    draggingRef.current = !fitAll
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (fitAll || !draggingRef.current || pinchRef.current) return
    const dx = e.clientX - lastPointerRef.current.x
    const dy = e.clientY - lastPointerRef.current.y
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    transformRef.current.offsetX += dx
    transformRef.current.offsetY += dy
    draw()
  }

  function onPointerUp(e: React.PointerEvent) {
    const moved =
      Math.abs(e.clientX - downPointerRef.current.x) > 10 ||
      Math.abs(e.clientY - downPointerRef.current.y) > 10
    draggingRef.current = false
    if (!moved) {
      const { x, y } = worldFromClient(e.clientX, e.clientY)
      const hit = hitTest(x, y)
      onSelect(hit === selectedId ? null : hit)
    }
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* capture may already be released */
    }
  }

  function onWheel(e: React.WheelEvent) {
    if (fitAll) return
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
        className={`lf-skill-tree-canvas-inner${fitAll ? ' lf-skill-tree-canvas-inner--fit' : ''}`}
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
      {!fitAll && (
        <div className="lf-skill-tree-zoom">
          <button type="button" className="lf-skill-tree-zoom-btn" onClick={() => zoomAt(1.15)} aria-label="Увеличить">+</button>
          <button type="button" className="lf-skill-tree-zoom-btn" onClick={() => zoomAt(0.87)} aria-label="Уменьшить">−</button>
          <button type="button" className="lf-skill-tree-zoom-btn" onClick={() => { fitToNodes(); draw() }} aria-label="Центр">◎</button>
        </div>
      )}
      {!fitAll && (
        <>
          <div className="lf-skill-tree-hint lf-skill-tree-hint--desktop">Перетаскивание · колёсико — зум</div>
          <div className="lf-skill-tree-hint lf-skill-tree-hint--mobile">Тяни · два пальца — зум</div>
        </>
      )}
      {fitAll && (
        <div className="lf-skill-tree-hint lf-skill-tree-hint--fit">Тап на узел · древо вписано в экран</div>
      )}
    </div>
  )
}
