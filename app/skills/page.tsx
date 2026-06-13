'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import SkillTreeCanvas from '@/components/SkillTreeCanvas'
import SkillNodeDetail from '@/components/SkillNodeDetail'
import SkillBranchChips from '@/components/SkillBranchChips'
import {
  PROTOTYPE_NODES,
  loadDemoSkillState,
  saveDemoSkillState,
  getNodeState,
  type SkillBranch,
  type SkillTreeNode,
} from '@/lib/skill-tree'
import { SKILL_POINTS_PER_LEVEL } from '@/lib/skill-points'
import { navUnlockFromUser, USER_NAV_SELECT } from '@/lib/nav-unlock'
import { SKILL_TREE_PATH_HINT } from '@/lib/onboarding-quest'
import { layout } from '@/lib/layout-classes'
import { xpProgress } from '@/lib/economy'
import { LoadingScreen } from '@/components/LoadingScreen'
import { applyRadialSkillLayout, visibleSkillNodes } from '@/lib/skill-tree-layout'

export default function SkillsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [nodes, setNodes] = useState<SkillTreeNode[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set())
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [branchFilter, setBranchFilter] = useState<SkillBranch | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

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
        setDbError('Колонка skill_points не найдена. Выполни npm run db:push в Supabase.')
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
        setDbError('Таблица skill_tree_nodes пуста — показан прототип. Выполни npm run db:push (все миграции).')
      } else if (dbNodes.length === 0) {
        setDbError('Узлы в БД пусты — показан локальный прототип. Запусти: npm run db:apply')
      }

      setNodes(useDemo ? PROTOTYPE_NODES : dbNodes)

      if (useDemo) {
        const demo = loadDemoSkillState()
        setUnlockedIds(new Set([0, ...demo.unlocked]))
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
        setUnlockedIds(new Set([0, ...(skills || []).map(s => s.node_id)]))
      }

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (isMobile) setSelectedId(null)
  }, [branchFilter, isMobile])

  const treeNodes = useMemo(() => {
    const mode = isMobile
      ? (branchFilter ? 'compact-detail' : 'compact-overview')
      : 'full'
    return applyRadialSkillLayout(nodes, mode, branchFilter)
  }, [nodes, isMobile, branchFilter])

  const canvasNodes = useMemo(
    () => visibleSkillNodes(treeNodes, isMobile, branchFilter),
    [treeNodes, isMobile, branchFilter],
  )

  const level = userData?.level || 1
  const skillPoints = userData?.skill_points ?? 0
  const { current: xpCurrent, next: xpNext } = xpProgress(userData?.xp || 0, level)

  const selectedNode = selectedId != null ? treeNodes.find(n => n.id === selectedId) ?? null : null

  async function unlockNode(node: SkillTreeNode) {
    if (!userData || unlocking || node.id === 0) return
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

  const detailProps = {
    node: selectedNode,
    nodes: treeNodes,
    unlockedIds,
    level,
    skillPoints,
    unlocking,
    onUnlock: unlockNode,
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="lf-skills-page">
      <nav className={`${layout.navBar} lf-skills-nav`}>
        <div className="lf-skills-nav-brand">
          <div className="lf-skills-nav-sigil">✦</div>
          <span>Древо знаний</span>
        </div>
        <div className="lf-skills-nav-meta">
          <div className="lf-skill-points-badge">
            <span className="lf-skill-points-badge-icon">✦</span>
            <span className="lf-skill-points-badge-val">{skillPoints}</span>
            <span className="lf-skill-points-badge-label">очков</span>
          </div>
          <button type="button" className="lf-skills-help-btn" onClick={() => setShowHelp(true)} aria-label="Помощь">
            ?
          </button>
        </div>
      </nav>

      <div className={`${layout.twoCol} lf-skills-shell`}>
        <Sidebar
          level={level}
          xp={xpCurrent}
          xpNext={xpNext}
          gold={userData?.gold || 0}
          step={userData?.onboarding_step || 0}
          navUnlock={navUnlockFromUser(userData)}
        />

        <div className={`${layout.main} lf-skills-main lf-pad-main`}>
          <header className="lf-skills-intro lf-skills-intro--desktop">
            <p className="lf-skills-intro-kicker">Способности</p>
            <h1 className="lf-skills-intro-title">Путь математики</h1>
            <p className="lf-skills-intro-desc">
              Одно древо по темам. +{SKILL_POINTS_PER_LEVEL} очка за уровень — вложи в узлы, как в древе навыков.
            </p>
          </header>

          {dbError && (
            <div className={`lf-skills-db-notice${demoMode ? ' lf-skills-db-notice--demo' : ''}`}>
              {dbError}
            </div>
          )}

          <div className="lf-skills-path-hint lf-skills-path-hint--desktop">
            <span className="lf-skills-path-kicker">Порядок тем</span>
            {SKILL_TREE_PATH_HINT}
          </div>

          {isMobile && (
            <p className="lf-skills-mobile-hint">
              {branchFilter
                ? 'Ветка темы — тап на узел для описания. «Всё древо» — обзор.'
                : 'Обзор пути: тап на тему сверху — открыть ветку. Тап на ◎ или корень — описание.'}
            </p>
          )}

          <SkillBranchChips
            nodes={nodes}
            unlockedIds={unlockedIds}
            level={level}
            selectedBranch={branchFilter}
            onSelectBranch={id => setBranchFilter(id as SkillBranch | null)}
          />

          <div className={`${layout.skillsInner}${isMobile ? ' lf-skills-inner--mobile' : ''}`}>
            <div className={`lf-skill-tree-col${selectedNode && isMobile ? ' lf-skill-tree-col--split' : ''}`}>
              <div className="lf-skill-tree-frame lf-poe-frame">
                {canvasNodes.length > 0 ? (
                  <SkillTreeCanvas
                    nodes={canvasNodes}
                    allNodes={treeNodes}
                    unlockedIds={unlockedIds}
                    userLevel={level}
                    skillPoints={skillPoints}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    highlightBranch={isMobile ? null : branchFilter}
                    fitAll={isMobile}
                    compact={isMobile}
                  />
                ) : (
                  <div className="lf-skill-tree-empty">Узлы не загружены</div>
                )}
              </div>
            </div>

            {isMobile && selectedNode && (
              <div className="lf-skill-detail-mobile lf-poe-panel">
                <button
                  type="button"
                  className="lf-skill-detail-mobile-close"
                  onClick={() => setSelectedId(null)}
                  aria-label="Закрыть"
                >
                  ✕
                </button>
                <SkillNodeDetail {...detailProps} compact />
              </div>
            )}

            {!isMobile && (
              <aside className="lf-skill-detail-desktop lf-poe-panel">
                <SkillNodeDetail {...detailProps} />
              </aside>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="lf-skills-toast">{toast}</div>
      )}

      {showHelp && (
        <div className="lf-modal-overlay">
          <div className="lf-modal-panel lf-poe-panel lf-skills-help-modal">
            <div className="lf-skills-help-hero">
              <div className="lf-skills-help-sigil">✦</div>
              <h2>Древо способностей</h2>
              <p className="lf-skills-help-sub">PATH OF KNOWLEDGE</p>
            </div>
            <div className="lf-skills-help-body">
              {SKILL_TREE_PATH_HINT}
              <p>
                <span className="lf-help-gold">Атаки</span> — урон,
                <span className="lf-help-purple"> защиты</span> — щит,
                <span className="lf-help-green"> «Мастер…»</span> — мост к следующей теме.
              </p>
              <p className="lf-skills-help-mobile-only">На телефоне древо вписано в экран — тап на узел, описание снизу. Крестик закрывает.</p>
              <p className="lf-skills-help-desktop-only">На компьютере: перетаскивание и колёсико. Центр ◎ — единство, от него лучи тем.</p>
            </div>
            <button type="button" className="lf-skill-detail-cta lf-skill-detail-cta--unlock" onClick={() => setShowHelp(false)}>
              Понял →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
