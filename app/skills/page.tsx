'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SkillTreeCanvas from '@/components/SkillTreeCanvas'
import {
  BRANCHES,
  PROTOTYPE_NODES,
  TYPE_COLORS,
  TYPE_LABELS,
  branchMeta,
  getLockReason,
  getNodeState,
  loadDemoSkillState,
  saveDemoSkillState,
  type SkillTreeNode,
} from '@/lib/skill-tree'
import { SKILL_POINTS_PER_LEVEL } from '@/lib/skill-points'
import { navUnlockFromUser, USER_NAV_SELECT } from '@/lib/nav-unlock'
import { SKILL_TREE_PATH_HINT } from '@/lib/onboarding-quest'

export default function SkillsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [nodes, setNodes] = useState<SkillTreeNode[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set())
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data, error: userError } = await supabase
        .from('users')
        .select(`${USER_NAV_SELECT}, skill_points`)
        .eq('id', user.id)
        .single()

      if (userError && userError.message.includes('skill_points')) {
        setDbError('Колонка skill_points не найдена. Выполни supabase/skill_tree.sql в Supabase.')
      } else if (data) {
        setUserData({ ...data, id: user.id })
        if (!data.visited_skills) {
          setShowHelp(true)
          await supabase.from('users').update({ visited_skills: true }).eq('id', user.id)
        }
      }

      const { data: allNodes, error: nodesError } = await supabase
        .from('skill_tree_nodes')
        .select('*')
        .order('id')

      const dbNodes = nodesError
        ? []
        : (allNodes || []).map(n => ({
            ...n,
            effect: typeof n.effect === 'object' ? n.effect : {},
            requires: n.requires ?? null,
          })) as SkillTreeNode[]

      const useDemo = !!nodesError || dbNodes.length === 0
      setDemoMode(useDemo)

      if (nodesError) {
        setDbError('Таблица skill_tree_nodes не найдена — показан прототип. Выполни supabase/skill_tree.sql в Supabase.')
      } else if (dbNodes.length === 0) {
        setDbError('Узлы в БД пусты — показан локальный прототип. Запусти: npm run db:apply')
      }

      setNodes(useDemo ? PROTOTYPE_NODES : dbNodes)

      if (useDemo) {
        const demo = loadDemoSkillState()
        setUnlockedIds(new Set(demo.unlocked))
        if (data) {
          setUserData({
            ...data,
            id: user.id,
            skill_points: (data.skill_points ?? 0) > 0 ? data.skill_points : demo.points,
          })
        }
      } else {
        const { data: skills } = await supabase
          .from('user_skills')
          .select('node_id')
          .eq('user_id', user.id)
        setUnlockedIds(new Set((skills || []).map(s => s.node_id)))
      }

      setLoading(false)
    }
    load()
  }, [])

  const level = userData?.level || 1
  const skillPoints = userData?.skill_points ?? 0
  const xpThresholds = [0, 100, 250, 500, 900, 1400]
  const xpToNext = [100, 150, 250, 400, 500, 600]
  const xpBase = xpThresholds[level - 1] || 0
  const xpNext = xpToNext[level - 1] || 100
  const xpCurrent = Math.max(0, (userData?.xp || 0) - xpBase)

  const selectedNode = selectedId
    ? nodes.find(n => n.id === selectedId)
    : null

  const selectedBranchMeta = selectedNode ? branchMeta(selectedNode.branch) : null

  async function unlockNode(node: SkillTreeNode) {
    if (!userData || unlocking) return
    const state = getNodeState(node, unlockedIds, level, skillPoints)
    if (state !== 'available') return

    setUnlocking(true)
    const newPoints = skillPoints - node.cost

    if (demoMode) {
      const nextUnlocked = [...unlockedIds, node.id]
      setUnlockedIds(new Set(nextUnlocked))
      setUserData({ ...userData, skill_points: newPoints })
      saveDemoSkillState({ unlocked: nextUnlocked, points: newPoints })
      setToast(`Открыто: ${node.name}`)
      setTimeout(() => setToast(null), 2500)
      setUnlocking(false)
      return
    }

    const { error: insertError } = await supabase.from('user_skills').insert({
      user_id: userData.id,
      node_id: node.id,
    })

    if (insertError) {
      setToast('Не удалось открыть способность')
      setTimeout(() => setToast(null), 2500)
      setUnlocking(false)
      return
    }

    if (node.cost > 0) {
      await supabase.from('users').update({ skill_points: newPoints }).eq('id', userData.id)
      setUserData({ ...userData, skill_points: newPoints })
    }

    setUnlockedIds(prev => new Set([...prev, node.id]))
    setToast(`Открыто: ${node.name}`)
    setTimeout(() => setToast(null), 2500)
    setUnlocking(false)
  }

  if (loading) {
    return (
      <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
        Загрузка...
      </div>
    )
  }

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>
      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#9590a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✦ <span style={{ color: '#b8aeff', fontWeight: 600 }}>{skillPoints}</span>
            <span>очков способностей</span>
          </div>
          <div onClick={() => setShowHelp(true)}
            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#5a5670', cursor: 'pointer', fontFamily: 'monospace' }}>
            ?
          </div>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr' }}>
        <Sidebar level={level} xp={xpCurrent} xpNext={xpNext} gold={userData?.gold || 0} step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />

        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 56px)' }}>
          <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#8a849c', textTransform: 'uppercase', marginBottom: '4px' }}>Древо знаний</div>
            <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '4px' }}>Способности</div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.5 }}>
              Одно древо по темам математики. +{SKILL_POINTS_PER_LEVEL} очка за уровень.
            </div>
          </div>

          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '20px', lineHeight: 1 }}>🧭</div>
            <div style={{ fontSize: '13px', color: '#d4c4a0', lineHeight: 1.65 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.12em', color: '#c9a84c', display: 'block', marginBottom: '6px' }}>ПОРЯДОК ТЕМ</span>
              {SKILL_TREE_PATH_HINT}
            </div>
          </div>

          {dbError && (
            <div style={{ background: demoMode ? 'rgba(169,159,255,0.08)' : 'rgba(224,85,85,0.08)', border: `1px solid ${demoMode ? 'rgba(169,159,255,0.35)' : 'rgba(224,85,85,0.35)'}`, borderRadius: '10px', padding: '14px 18px', fontSize: '13px', color: demoMode ? '#b8b0d8' : '#e8a0a0', lineHeight: 1.6 }}>
              {dbError}
            </div>
          )}

          {/* Легенда тем */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {BRANCHES.map(b => {
              const locked = level < b.minLevel
              const unlockedInBranch = nodes.filter(n => n.branch === b.id && unlockedIds.has(n.id)).length
              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontFamily: 'monospace', fontSize: '10px', color: locked ? '#5a5670' : '#9590a8',
                    opacity: locked ? 0.5 : 1,
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  {b.icon} {b.name}
                  {locked ? ` · ур.${b.minLevel}` : unlockedInBranch > 0 ? ` · ${unlockedInBranch}` : ''}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', flex: 1, minHeight: 0 }}>
            <div style={{ minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8a849c', marginBottom: '8px' }}>
                Перетаскивание — пан, колёсико — зум · связи между темами — через «Мастер…»
              </div>
              {nodes.length > 0 ? (
                <SkillTreeCanvas
                  nodes={nodes}
                  unlockedIds={unlockedIds}
                  userLevel={level}
                  skillPoints={skillPoints}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#5a5670', fontSize: '14px' }}>
                  Узлы не загружены
                </div>
              )}
            </div>

            {/* Панель узла */}
            <div style={{ background: '#1a1f28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!selectedNode ? (
                <div style={{ color: '#b8b0c8', fontSize: '14px', lineHeight: 1.7 }}>
                  Кликни на узел дерева, чтобы увидеть описание и открыть способность.
                  <br /><br />
                  <span style={{ color: '#b8aeff' }}>●</span> <span style={{ color: '#9590a8' }}>доступен</span>
                  <span style={{ color: '#e0bc6a' }}> ●</span> <span style={{ color: '#9590a8' }}>открыт</span>
                  <span style={{ color: '#5a6070' }}> ●</span> <span style={{ color: '#9590a8' }}>заблокирован</span>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.2em', color: selectedBranchMeta?.color ?? TYPE_COLORS[selectedNode.type], textTransform: 'uppercase', marginBottom: '6px' }}>
                      {selectedBranchMeta ? `${selectedBranchMeta.icon} ${selectedBranchMeta.name}` : ''} · {TYPE_LABELS[selectedNode.type]}
                    </div>
                    <div style={{ fontSize: '20px', color: '#e0bc6a', marginBottom: '6px' }}>{selectedNode.name}</div>
                    <div style={{ fontSize: '14px', color: '#c8c0d8', lineHeight: 1.65 }}>{selectedNode.description}</div>
                  </div>

                  {selectedNode.effect?.detail && (
                    <div style={{ background: 'rgba(169,159,255,0.08)', border: '1px solid rgba(169,159,255,0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#b8b0d8', lineHeight: 1.5 }}>
                      {selectedNode.effect.detail}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '12px', color: '#9590a8' }}>
                    <span>Стоимость</span>
                    <span style={{ color: '#a99fff' }}>{selectedNode.cost} очк.</span>
                  </div>

                  {(() => {
                    const state = getNodeState(selectedNode, unlockedIds, level, skillPoints)
                    if (state === 'unlocked') {
                      return (
                        <div style={{ textAlign: 'center', padding: '12px', border: '1px solid rgba(224,188,106,0.3)', borderRadius: '8px', color: '#e0bc6a', fontSize: '13px' }}>
                          ✦ Открыто
                        </div>
                      )
                    }
                    if (state === 'available') {
                      return (
                        <div
                          onClick={() => unlockNode(selectedNode)}
                          style={{
                            textAlign: 'center',
                            padding: '12px',
                            background: 'rgba(169,159,255,0.12)',
                            border: '1px solid rgba(169,159,255,0.45)',
                            borderRadius: '8px',
                            color: '#a99fff',
                            fontSize: '14px',
                            cursor: unlocking ? 'default' : 'pointer',
                            opacity: unlocking ? 0.6 : 1,
                          }}
                        >
                          {unlocking ? 'Открываем...' : `Открыть (−${selectedNode.cost} очк.)`}
                        </div>
                      )
                    }
                    const reason = getLockReason(selectedNode, nodes, unlockedIds, level, skillPoints)
                    return (
                      <div style={{ textAlign: 'center', padding: '12px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#5a5670', fontSize: '13px' }}>
                        🔒 {reason}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1c1f2a', border: '1px solid rgba(169,159,255,0.4)', borderRadius: '10px', padding: '12px 24px', fontFamily: 'monospace', fontSize: '12px', color: '#a99fff', zIndex: 300 }}>
          {toast}
        </div>
      )}

      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(169,159,255,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '460px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>✦</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '6px' }}>Древо способностей</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>PATH OF EXPEDITION</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              {SKILL_TREE_PATH_HINT}
              <br /><br />
              <span style={{ color: '#e0bc6a' }}>Атаки</span> — урон, <span style={{ color: '#a99fff' }}>защиты</span> — щит, <span style={{ color: '#3db87a' }}>«Мастер…»</span> — ключ к следующей теме.
              <br /><br />
              Перетаскивай поле, колёсико — зум.
            </div>
            <div onClick={() => setShowHelp(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(169,159,255,0.12)', border: '1px solid rgba(169,159,255,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#a99fff', cursor: 'pointer' }}>
              Понял →
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
