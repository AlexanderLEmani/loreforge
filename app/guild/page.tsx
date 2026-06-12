'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { buildGuildQuests, todayIso } from '@/lib/guild-quests'
import { navUnlockFromUser } from '@/lib/nav-unlock'
import { syncQuestRewards, withGuildClaimed } from '@/lib/quest-rewards'
import { spendGlory } from '@/lib/glory-wallet'
import { GUILD_RANKS, guildRankProgress } from '@/lib/guild-ranks'
import { fetchSpellKills, fetchUserRow } from '@/lib/user-profile'

const DUNGEONS = [
  { id: 'add',   icon: '➕', name: 'Пещера сложения',   tag: 'Ур.1', desc: 'Сложение до 1000. Базовый данж. Бесплатно.', cost: 0,   color: '#c9a84c', rarity: null,    level: 1, route: 'Пещера сложения' },
  { id: 'sub',   icon: '➖', name: 'Пещера вычитания',  tag: 'Ур.1', desc: 'Вычитание до 1000. Базовый данж. Бесплатно.', cost: 0,  color: '#c9a84c', rarity: null,    level: 1, route: 'Пещера вычитания' },
  { id: 'mul',   icon: '✕',  name: 'Башня умножения',   tag: 'Ур.2', desc: 'Таблица умножения. Монстры атакуют быстро.', cost: 80,  color: '#a99fff', rarity: 'rare',  level: 2, route: 'Башня умножения' },
  { id: 'div', icon: '÷', name: 'Пещера деления', tag: 'Ур.2', desc: 'Деление до 100. Остатки и комбинированные действия.', cost: 60, color: '#3db87a', rarity: null, level: 2, route: 'Пещера деления' },
  { id: 'lab',   icon: '🌀', name: 'Лабиринт порядка',  tag: 'Ур.2', desc: 'Смешанные действия со скобками. Повышенная сложность.', cost: 120, color: '#a99fff', rarity: 'rare', level: 2, route: 'Башня умножения' },
  { id: 'frac',  icon: '½',  name: 'Храм дробей',       tag: 'Ур.3', desc: 'Дроби: ½ ⅓ ¼, общий знаменатель, × и ÷. Примеры с дробями — свитки III в дропе.', cost: 200, color: '#e05555', rarity: 'epic', level: 3, route: 'Храм дробей' },
  { id: 'market',icon: '💰', name: 'Рынок процентов',   tag: 'Ур.4', desc: '10%, 25%, скидки и наценки. Нужен игровой ур.4.', cost: 300, color: '#3db87a', rarity: null, level: 4, route: 'Рынок процентов' },
]


export default function GuildPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [quests, setQuests] = useState<ReturnType<typeof buildGuildQuests>>([])
  const [runHistory, setRunHistory] = useState<any[]>([])
  const [rewardToast, setRewardToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const data = await fetchUserRow(supabase, user.id)
      let ud: Record<string, unknown> | null = data ? { ...data, id: user.id } : null
      if (ud && !ud.visited_guild) {
        setShowWelcome(true)
        await supabase.from('users').update({ visited_guild: true }).eq('id', user.id)
        ud = { ...ud, visited_guild: true }
      }
      setUserData(ud)

      const { data: runs } = await supabase
        .from('dungeon_runs')
        .select('result, mistakes, dungeon_name, created_at, score, total')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const today = todayIso()
      const { count: answersToday } = await supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)

      const spellKills = ud?.spell_kills != null
        ? Number(ud.spell_kills)
        : await fetchSpellKills(supabase, user.id)

      const built = buildGuildQuests(runs || [], answersToday ?? 0, spellKills)

      const rewards = await syncQuestRewards(supabase, user.id)
      if (rewards.gloryDelta > 0 || rewards.goldDelta > 0) {
        if (ud) {
          if (rewards.gloryDelta > 0) {
            ud = {
              ...ud,
              glory: Number(ud.glory ?? 0) + rewards.gloryDelta,
              glory_total: Number(ud.glory_total ?? ud.glory ?? 0) + rewards.gloryDelta,
            }
          }
          if (rewards.goldDelta > 0) ud = { ...ud, gold: Number(ud.gold ?? 0) + rewards.goldDelta }
        }
        const parts: string[] = []
        if (rewards.gloryDelta > 0) parts.push(`+${rewards.gloryDelta} славы`)
        if (rewards.goldDelta > 0) parts.push(`+${rewards.goldDelta} золота`)
        setRewardToast(`${parts.join(' · ')} с квестов`)
        setTimeout(() => setRewardToast(null), 4000)
      }
      if (ud && (rewards.gloryDelta > 0 || rewards.goldDelta > 0)) setUserData(ud)

      setQuests(withGuildClaimed(built, rewards.claims))
      setRunHistory((runs || []).slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  async function buyDungeon(dungeon: typeof DUNGEONS[0]) {
    if (!userData || dungeon.cost > (userData.glory || 0)) return
    if (dungeon.level > (userData.level || 1)) return
    setBuying(dungeon.id)
    const ok = await spendGlory(supabase, userData.id, dungeon.cost)
    if (!ok) {
      setBuying(null)
      return
    }
    setUserData((prev: any) => ({ ...prev, glory: (prev.glory || 0) - dungeon.cost }))
    setBuying(null)
    router.push(`/prepare?dungeon=${encodeURIComponent(dungeon.route)}`)
  }

  if (loading) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Загрузка...
    </div>
  )

  const level = userData?.level || 1
  const gloryWallet = userData?.glory || 0
  const reputation = userData?.glory_total ?? gloryWallet
  const xpThresholds = [0, 100, 250, 500, 900, 1400]
  const xpToNext = [100, 150, 250, 400, 500, 600]
  const xpBase = xpThresholds[level - 1] || 0
  const xpNext = xpToNext[level - 1] || 100
  const xpCurrent = Math.max(0, (userData?.xp || 0) - xpBase)

  const { rank, next: nextRank, pct: rankPct, idx: rankIdx } = guildRankProgress(reputation)

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      {rewardToast && (
        <div style={{ position: 'fixed', top: '64px', left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'rgba(123,108,255,0.95)', border: '1px solid rgba(201,168,76,0.5)', borderRadius: '10px', padding: '12px 24px', fontFamily: 'serif', fontSize: '15px', color: '#e0bc6a' }}>
          {rewardToast}
        </div>
      )}

      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
          Гильдия Авантюристов · {rank.name}
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px' }}>

        <Sidebar
          level={level}
          xp={xpCurrent}
          xpNext={xpNext}
          gold={userData?.gold || 0}
          step={userData?.onboarding_step || 0}
          navUnlock={navUnlockFromUser(userData)}
        />

        {/* ЦЕНТР */}
        <div style={{ padding: '1.75rem 2rem', background: '#0b0c10' }}>

          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Гильдия Авантюристов</div>
            <div style={{ fontFamily: 'serif', fontSize: '26px', color: '#e0bc6a', marginBottom: '4px' }}>Доска заданий</div>
            <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>
              Ранг растёт от суммарной репутации. На вход в данж тратится слава из кошелька — репутация не падает.
            </div>
          </div>

          {/* РАНГ */}
          <div style={{ background: 'linear-gradient(135deg, rgba(123,108,255,0.08), transparent)', border: '1px solid rgba(123,108,255,0.3)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'rgba(123,108,255,0.15)', border: '1px solid rgba(123,108,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🗡️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#a99fff', marginBottom: '3px' }}>{rank.name.toUpperCase()}</div>
              <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '6px' }}>
                {nextRank ? `До ${nextRank.name}: ${nextRank.min - reputation} репутации` : 'Максимальный ранг'}
              </div>
              <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#a99fff', width: `${rankPct}%`, transition: 'width 0.4s' }}></div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>
                Репутация {reputation}{nextRank ? ` / ${nextRank.min}` : ''} · Кошелёк {gloryWallet} ⭐
              </div>
            </div>
          </div>

          {/* БЕСПЛАТНЫЕ ДАНЖИ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>
            <span>Бесплатные данжи</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.5rem' }}>
            {DUNGEONS.filter(d => d.cost === 0).map(d => (
              <div key={d.id} onClick={() => router.push(`/prepare?dungeon=${encodeURIComponent(d.route)}`)}
                style={{ background: 'rgba(61,184,122,0.06)', border: '1px solid rgba(61,184,122,0.25)', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,184,122,0.5)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,184,122,0.25)'}
              >
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{d.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'serif', fontSize: '14px', color: '#e6e2f0', marginBottom: '2px' }}>{d.name}</div>
                  <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic' }}>Математика · {d.tag} · Бесплатно</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#3db87a', padding: '5px 12px', border: '1px solid rgba(61,184,122,0.4)', borderRadius: '6px', background: 'rgba(61,184,122,0.08)', whiteSpace: 'nowrap' }}>▶ Войти</div>
              </div>
            ))}
          </div>

          {level >= 3 && (
            <div style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.25)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#e05555', letterSpacing: '0.12em', marginBottom: '8px' }}>½ ХРАМ ДРОБЕЙ · КАК ПОДГОТОВИТЬСЯ</div>
              <div style={{ fontSize: '13px', color: '#c8c0d8', lineHeight: 1.65 }}>
                Примеры с дробями: <span style={{ color: '#e0bc6a' }}>½ + ⅓</span>, <span style={{ color: '#e0bc6a' }}>¾ − ¼</span>.
                Сначала общий знаменатель, потом считай. Лекция III в Коллегии → тренировка на ½ → свитки из дропа.
                В бою таймер чуть длиннее — можно записать шаги в Гримуар.
              </div>
            </div>
          )}

          {level >= 4 && (
            <div style={{ background: 'rgba(61,184,122,0.06)', border: '1px solid rgba(61,184,122,0.25)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#3db87a', letterSpacing: '0.12em', marginBottom: '8px' }}>% РЫНОК ПРОЦЕНТОВ</div>
              <div style={{ fontSize: '13px', color: '#c8c0d8', lineHeight: 1.65 }}>
                <span style={{ color: '#e0bc6a' }}>10% от 80 = 8</span>. Скидка 20%: вычти пятую часть цены.
                Лекция IV → тренировка на % → данж ниже (300 ⭐ славы).
              </div>
            </div>
          )}

          {/* ДОСКА */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>
            <span>Доска заданий</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            <span style={{ whiteSpace: 'nowrap', color: '#3a3650' }}>Обновление через 04:23:11</span>
          </div>

          <div style={{ background: '#1a1610', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {DUNGEONS.filter(d => d.cost > 0).map(d => {
                const locked = d.level > level
                const canAfford = gloryWallet >= d.cost
                return (
                  <div key={d.id}
                    onClick={() => !locked && canAfford && buyDungeon(d)}
                    style={{ background: '#1c1f2a', border: `1px solid ${locked ? 'rgba(255,255,255,0.05)' : canAfford ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '10px', padding: '1rem', cursor: locked || !canAfford ? 'default' : 'pointer', opacity: locked ? 0.4 : 1, position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
                    onMouseEnter={e => { if (!locked && canAfford) (e.currentTarget as HTMLElement).style.borderColor = `rgba(${d.color === '#e05555' ? '224,85,85' : d.color === '#a99fff' ? '123,108,255' : '201,168,76'},0.4)` }}
                    onMouseLeave={e => { if (!locked && canAfford) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: locked ? '#3a3d4a' : d.color }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '24px' }}>{locked ? '🔒' : d.icon}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', border: `1px solid ${locked ? 'rgba(255,255,255,0.06)' : 'rgba(201,168,76,0.3)'}`, color: locked ? '#3a3650' : '#c9a84c', background: locked ? 'transparent' : 'rgba(201,168,76,0.06)' }}>{d.tag}</span>
                        {d.rarity === 'rare' && <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', border: '1px solid rgba(123,108,255,0.4)', color: '#a99fff', background: 'rgba(123,108,255,0.08)' }}>Редкий</span>}
                        {d.rarity === 'epic' && <span style={{ fontFamily: 'monospace', fontSize: '9px', padding: '2px 7px', borderRadius: '3px', border: '1px solid rgba(224,85,85,0.4)', color: '#e05555', background: 'rgba(224,85,85,0.08)' }}>Эпик</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'serif', fontSize: '14px', color: locked ? '#5a5670' : '#e6e2f0', marginBottom: '4px' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.4, marginBottom: '10px' }}>{d.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: locked ? '#3a3650' : canAfford ? '#a99fff' : '#e05555' }}>
                        ⭐ {d.cost} славы
                      </div>
                      {!locked && !canAfford && <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#e05555' }}>Не хватает славы</div>}
                      {buying === d.id && <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670' }}>...</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* КВЕСТЫ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', textTransform: 'uppercase', marginBottom: '10px' }}>
            <span>Квесты гильдии</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          </div>
          {quests.map(q => (
            <div key={q.id} style={{ background: '#1c1f2a', border: `1px solid ${q.claimed ? 'rgba(201,168,76,0.3)' : q.done ? 'rgba(61,184,122,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '9px', padding: '10px 14px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', color: q.claimed ? '#e0bc6a' : q.done ? '#3db87a' : '#e6e2f0' }}>
                  {q.claimed ? '⭐ ' : q.done ? '✓ ' : ''}{q.title}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: q.claimed ? '#e0bc6a' : '#a99fff', whiteSpace: 'nowrap', marginLeft: '8px', textAlign: 'right' }}>
                  {q.claimed ? 'получено' : (
                    <>
                      +{q.glory} ⭐
                      {q.gold > 0 && <span style={{ color: '#e0bc6a' }}> · +{q.gold} 💰</span>}
                    </>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', marginBottom: '6px' }}>{q.desc}</div>
              {!q.claimed && (
                <>
                  <div style={{ height: '2px', background: '#171920', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
                    <div style={{ height: '100%', background: q.color, width: `${(q.prog / q.total) * 100}%` }}></div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670' }}>{q.prog} / {q.total}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ПРАВЫЙ САЙДБАР */}
        <div style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Слава</div>
          <div style={{ background: 'rgba(123,108,255,0.1)', border: '1px solid rgba(123,108,255,0.25)', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginBottom: '4px' }}>Кошелёк (данжи)</div>
            <div style={{ fontFamily: 'serif', fontSize: '32px', color: '#a99fff', lineHeight: 1 }}>{gloryWallet} ⭐</div>
          </div>
          <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginBottom: '4px' }}>Репутация (ранг)</div>
            <div style={{ fontFamily: 'serif', fontSize: '24px', color: '#e0bc6a', lineHeight: 1 }}>{reputation}</div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Ранги гильдии</div>

          {GUILD_RANKS.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', marginBottom: '3px', background: i === rankIdx ? 'rgba(123,108,255,0.08)' : 'transparent', border: `1px solid ${i === rankIdx ? 'rgba(123,108,255,0.2)' : 'transparent'}` }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0 }}></div>
              <div style={{ flex: 1, fontSize: '13px', color: i === rankIdx ? '#e6e2f0' : '#5a5670' }}>{r.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3a3650' }}>{r.min}+</div>
            </div>
          ))}

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>История данжей</div>

          {runHistory.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>Ещё нет забегов — войди в данж.</div>
          ) : runHistory.map((r, i) => {
            const win = r.result === 'win'
            const gloryEst = win ? `+${Math.max(10, (r.score || 0) * 8)}⭐` : ''
            const short = (r.dungeon_name || 'Данж').replace('Пещера ', '').replace('Башня ', '')
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '13px', color: '#9590a8' }}>{short}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: win ? '#3db87a' : '#e05555' }}>
                  {win ? 'Победа' : 'Провал'} {gloryEst}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '460px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>⚔️</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '6px' }}>Гильдия Авантюристов</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>ДОСКА ЗАДАНИЙ</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Здесь ты выбираешь <span style={{ color: '#e0bc6a' }}>данжи</span> и отправляешься в бой.
              <br/><br/>
              <span style={{ color: '#e6e2f0' }}>Бесплатные данжи</span> — всегда доступны. Меньше наград.
              <br/>
              <span style={{ color: '#e6e2f0' }}>Платные данжи</span> — за <span style={{ color: '#a99fff' }}>⭐ славу</span>. Дроп: снаряжение, свитки, расходники.
              <br/><br/>
              Выполняй <span style={{ color: '#e0bc6a' }}>квесты</span> чтобы зарабатывать дополнительную славу и повышать <span style={{ color: '#a99fff' }}>ранг</span> в гильдии.
              <br/><br/>
              Побеждай. Расти. Становись легендой.
            </div>
            <div onClick={() => setShowWelcome(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#e0bc6a', cursor: 'pointer' }}>
              Понял, ищу данж →
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
