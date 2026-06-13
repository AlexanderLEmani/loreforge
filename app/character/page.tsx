'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PixelCharacter from '@/components/PixelCharacter'
import AppNav from '@/components/AppNav'
import { BATTLE_CONSUMABLES, parseConsumables } from '@/lib/battle-consumables'
import {
  EQUIP_SLOTS,
  EQUIPMENT_ITEMS,
  computeEquipBonuses,
  itemById,
  ownedItemIds,
  bonusLabel,
  type EquipSlot,
  type EquippedMap,
  type EquipmentItem,
} from '@/lib/equipment'
import { loadEquipped, loadOwnedIds, saveEquipped } from '@/lib/equipment-storage'
import { navUnlockFromUser } from '@/lib/nav-unlock'
import { layout } from '@/lib/layout-classes'
import { xpProgress } from '@/lib/economy'
import { LoadingScreen } from '@/components/LoadingScreen'

const RACE_ICONS: Record<string, string> = {
  human: '🧙', elf: '🧝', dwarf: '⛏️', orc: '👹', undead: '💀',
}

const RACE_LABELS: Record<string, string> = {
  human: 'Странствующий маг', elf: 'Архивист', dwarf: 'Рунный кузнец', orc: 'Боевой учёный', undead: 'Некромант знаний',
}

export default function CharacterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [character, setCharacter] = useState<any>(null)
  const [scrollCount, setScrollCount] = useState(0)
  const [equipped, setEquipped] = useState<EquippedMap>({})
  const [ownedIds, setOwnedIds] = useState<string[]>([])
  const [bagFilter, setBagFilter] = useState<'all' | EquipSlot>('all')
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const { data: ud } = await supabase
        .from('users')
        .select('xp, level, gold, streak, total_answers, visited_character, onboarding_step, consumables, visited_college, visited_training, visited_guild, visited_grimoire, visited_shop, visited_skills, quest_first_dungeon')
        .eq('id', user.id)
        .single()
      setUserData(ud)
      if (ud && !ud.visited_character) {
        setShowWelcome(true)
        await supabase.from('users').update({ visited_character: true }).eq('id', user.id)
      }

      const { data: ch, error: chError } = await supabase
        .from('characters')
        .select('name, race, skin_color, hair_style, hair_color, cloak_color')
        .eq('user_id', user.id)
        .maybeSingle()
      if (chError || !ch) { router.push('/create-character'); return }
      setCharacter(ch)

      const level = ud?.level || 1
      setEquipped(await loadEquipped(user.id))
      const owned = await loadOwnedIds(user.id)
      setOwnedIds(ownedItemIds(level, owned))

      const { count } = await supabase
        .from('user_scrolls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setScrollCount(count ?? 0)

      setLoading(false)
    }
    load()
  }, [])

  async function equipItem(item: EquipmentItem) {
    if (!user?.id) return
    const next = { ...equipped, [item.slot]: item.id }
    setEquipped(next)
    await saveEquipped(user.id, next)
    setToast(`Надето: ${item.name}`)
    setTimeout(() => setToast(null), 2000)
  }

  async function unequipSlot(slot: EquipSlot) {
    if (!user?.id) return
    const next = { ...equipped }
    delete next[slot]
    setEquipped(next)
    await saveEquipped(user.id, next)
    setToast('Предмет снят — в сумке')
    setTimeout(() => setToast(null), 2000)
  }

  if (loading) return <LoadingScreen />

  const level = userData?.level || 1
  const { current: xpCurrent, next: xpNext } = xpProgress(userData?.xp || 0, level)
  const xpPct = Math.min((xpCurrent / xpNext) * 100, 100)
  const consumables = parseConsumables(userData?.consumables)
  const race = character?.race || 'human'
  const equipBonuses = computeEquipBonuses(equipped)

  const stats = {
    attack: 10 + level * 4 + (race === 'orc' ? 8 : 0) + Math.round((equipBonuses.attackPct || 0) * 0.4),
    defense: 5 + level * 2 + (race === 'dwarf' ? 5 : 0) + Math.round((equipBonuses.defensePct || 0) * 0.3),
    speed: 8 + level * 3 + (race === 'elf' ? 4 : 0) + Math.round((equipBonuses.attackPct || 0) * 0.2),
    intel: 10 + level * 6 + (race === 'elf' ? 10 : 0) + (race === 'human' ? 4 : 0) + Math.round((equipBonuses.spellDamagePct || 0) * 0.5),
  }

  const visualEquip: Partial<Record<EquipSlot, string>> = {}
  for (const slot of EQUIP_SLOTS) {
    const id = equipped[slot.id]
    if (!id) continue
    const item = itemById(id)
    if (item) visualEquip[slot.id] = item.visualId
  }

  const ownedItems = EQUIPMENT_ITEMS.filter(i => ownedIds.includes(i.id))
  const bagItems = ownedItems.filter(i => {
    if (bagFilter !== 'all' && i.slot !== bagFilter) return false
    return equipped[i.slot] !== i.id
  })
  const equippedCount = EQUIP_SLOTS.filter(s => equipped[s.id]).length

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>
      <nav className={layout.navBar} style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e0bc6a', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', border: '1.5px solid #c9a84c', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>✦</div>
          LoreForge
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
          <div style={{ width: '28px', height: '28px', border: '1px solid #c9a84c', borderRadius: '50%', background: '#1c1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
            {RACE_ICONS[race]}
          </div>
          {character?.name} · Ур.{level}
        </div>
      </nav>

      <div className={layout.character}>
        <div className={layout.sidebarL} style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Персонаж</div>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', marginBottom: '4px' }}>
              <span>УРОВЕНЬ {level}</span><span>{xpCurrent} / {xpNext}</span>
            </div>
            <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#7b6cff', borderRadius: '2px', width: `${xpPct}%` }} />
            </div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Характеристики</div>
          {[
            ['⚔️', 'Сила атаки', stats.attack, '#e6e2f0'],
            ['🛡️', 'Защита', stats.defense, '#e6e2f0'],
            ['⚡', 'Скорость', stats.speed, '#a99fff'],
            ['🧠', 'Интеллект', stats.intel, '#2dd9b8'],
            ['💰', 'Золото', userData?.gold || 0, '#e0bc6a'],
          ].map(([icon, name, val, color]) => (
            <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon as string}</span>{name as string}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: color as string }}>{val as number}</div>
            </div>
          ))}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '14px 0 12px' }} />
          <div className="lf-sidebar-nav">
            <AppNav step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />
          </div>
        </div>

        <div className={`${layout.main} lf-main lf-pad-main`} style={{ background: '#0b0c10', overflowY: 'auto' }}>
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Снаряжение и внешность</div>
            <div style={{ fontFamily: 'monospace', fontSize: '26px', color: '#e0bc6a' }}>Твой персонаж</div>
          </div>

          <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e0bc6a', marginBottom: '4px' }}>{character?.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#a99fff', letterSpacing: '0.15em', marginBottom: '1rem' }}>
                {RACE_LABELS[race]?.toUpperCase()} · УР. {level}
              </div>
              <div style={{ background: '#0d0f14', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.15)', padding: '1rem', marginBottom: '1rem' }}>
                <PixelCharacter
                  race={race}
                  skinColor={character?.skin_color || '#c8a882'}
                  hairStyle={character?.hair_style || 'a1'}
                  hairColor={character?.hair_color || '#3d2b1f'}
                  cloakColor={character?.cloak_color || '#4a1f6e'}
                  equipment={visualEquip}
                  size={200}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#7b6cff', textAlign: 'center', marginBottom: '12px', fontFamily: 'monospace' }}>
                {equippedCount > 0 ? bonusLabel(equipBonuses) : 'Снаряжение — только из данжей'}
              </div>
              <div style={{ width: '100%' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.12em', marginBottom: '8px' }}>НА ПЕРСОНАЖЕ</div>
                {EQUIP_SLOTS.map(slot => {
                  const id = equipped[slot.id]
                  const item = id ? itemById(id) : null
                  return (
                    <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '16px', width: '24px', textAlign: 'center' }}>{item?.icon ?? slot.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: '#9590a8' }}>{slot.label}</div>
                        <div style={{ fontSize: '12px', color: item ? '#e6e2f0' : '#5a5670', fontStyle: item ? 'normal' : 'italic' }}>
                          {item?.name ?? 'Пусто — выбей в данже'}
                        </div>
                      </div>
                      {item ? (
                        <div onClick={() => unequipSlot(slot.id)} style={{ fontFamily: 'monospace', fontSize: '9px', color: '#e05555', cursor: 'pointer', padding: '4px 8px', border: '1px solid rgba(224,85,85,0.35)', borderRadius: '4px' }}>Снять</div>
                      ) : (
                        <div onClick={() => setBagFilter(slot.id)} style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', cursor: 'pointer', padding: '4px 8px' }}>Надеть →</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#e0bc6a', marginBottom: '1rem', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Статистика</div>
              {[
                ['📚', 'Ответов дано', userData?.total_answers || 0],
                ['🔥', 'Дней подряд', userData?.streak || 0],
                ['📖', 'Свитков в гримуаре', scrollCount],
                ['🎽', 'Предметов снаряжения', ownedItems.length],
              ].map(([icon, label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9590a8' }}>
                    <span>{icon as string}</span>{label as string}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e0bc6a' }}>{val as number}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={layout.sidebarR} style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '10px' }}>
            Сумка · {ownedItems.length} предм.
          </div>
          <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '12px' }}>
            Снаряжение выпадает из данжей (~72% шанс дропа). Надеть — на персонаже.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
            <div onClick={() => setBagFilter('all')} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace', cursor: 'pointer', border: `1px solid ${bagFilter === 'all' ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`, color: bagFilter === 'all' ? '#e0bc6a' : '#5a5670' }}>Все</div>
            {EQUIP_SLOTS.map(s => (
              <div key={s.id} onClick={() => setBagFilter(s.id)} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace', cursor: 'pointer', border: `1px solid ${bagFilter === s.id ? 'rgba(123,108,255,0.5)' : 'rgba(255,255,255,0.08)'}`, color: bagFilter === s.id ? '#a99fff' : '#5a5670' }}>{s.icon}</div>
            ))}
          </div>

          {ownedItems.length === 0 && (
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '14px' }}>Пока пусто. Пройди данж и победи — шанс получить предмет.</div>
          )}

          {bagItems.map(item => (
            <div key={item.id} style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', padding: '10px 12px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#e6e2f0' }}>{item.name}</div>
                  <div style={{ fontSize: '10px', color: '#7b6cff', fontFamily: 'monospace' }}>{item.desc}</div>
                </div>
              </div>
              <div onClick={() => equipItem(item)} style={{ padding: '6px', borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', background: 'rgba(123,108,255,0.1)', border: '1px solid rgba(123,108,255,0.3)', color: '#a99fff' }}>Надеть</div>
            </div>
          ))}

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>Расходники</div>
          {BATTLE_CONSUMABLES.map(c => (
            <div key={c.effect} style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '10px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#9590a8' }}>{c.name}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#a99fff' }}>×{consumables[c.effect]}</span>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '10px', padding: '12px 24px', fontFamily: 'monospace', fontSize: '12px', color: '#e0bc6a', zIndex: 300 }}>
          {toast}
        </div>
      )}

      {showWelcome && (
        <div className="lf-modal-overlay">
          <div className="lf-modal-panel">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>👤</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#a99fff', marginBottom: '6px' }}>Твой персонаж</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Снаряжение выпадает из данжей при победе. Свитки — в Гримуар. Расходники — в Лавке или из данжа.
            </div>
            <div onClick={() => setShowWelcome(false)} style={{ width: '100%', padding: '14px', background: 'rgba(123,108,255,0.12)', border: '1px solid rgba(123,108,255,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#a99fff', cursor: 'pointer' }}>
              Понял →
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
