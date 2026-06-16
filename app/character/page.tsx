'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PixelCharacter from '@/components/PixelCharacter'
import PixelPet from '@/components/PixelPet'
import PixelAvatar from '@/components/PixelAvatar'
import PixelItem from '@/components/PixelItem'
import { consumablePixelId } from '@/lib/consumable-visuals'
import EquipmentCard from '@/components/EquipmentCard'
import EquipSlotButton from '@/components/EquipSlotButton'
import AppNav from '@/components/AppNav'
import { BATTLE_CONSUMABLES, parseConsumables } from '@/lib/battle-consumables'
import {
  EQUIP_SLOTS,
  EQUIPMENT_ITEMS,
  computeEquipBonuses,
  itemById,
  ownedItemIds,
  bonusLabel,
  PET_ITEM_IDS,
  visualEquipFromEquipped,
  type EquipSlot,
  type EquippedMap,
  type EquipmentItem,
} from '@/lib/equipment'
import { loadEquipped, loadOwnedIds, saveEquipped, addOwnedItem } from '@/lib/equipment-storage'
import { navUnlockFromUser } from '@/lib/nav-unlock'
import { layout } from '@/lib/layout-classes'
import { xpProgress } from '@/lib/economy'
import { LoadingScreen } from '@/components/LoadingScreen'

const RACE_LABELS: Record<string, string> = {
  human: 'Странствующий маг', elf: 'Архивист', dwarf: 'Рунный кузнец', orc: 'Боевой учёный', undead: 'Некромант знаний',
}

export default function CharacterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [character, setCharacter] = useState<any>(null)
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
      let owned = await loadOwnedIds(user.id)
      for (const petId of PET_ITEM_IDS) {
        if (!owned.includes(petId)) {
          const res = await addOwnedItem(user.id, petId)
          owned = res.ids
        }
      }
      setOwnedIds(ownedItemIds(level, owned))

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

  const visualEquip = visualEquipFromEquipped(equipped)

  const ownedItems = EQUIPMENT_ITEMS.filter(i => ownedIds.includes(i.id))
  const bagItems = ownedItems.filter(i => {
    if (bagFilter !== 'all' && i.slot !== bagFilter) return false
    return equipped[i.slot] !== i.id
  })
  const equippedCount = EQUIP_SLOTS.filter(s => equipped[s.id]).length
  const maxGlowTier = EQUIP_SLOTS.reduce<1 | 2 | 3 | undefined>((max, s) => {
    const id = equipped[s.id]
    if (!id) return max
    const item = itemById(id)
    if (!item) return max
    if (!max || item.tier > max) return item.tier
    return max
  }, undefined)

  const leftSlots = EQUIP_SLOTS.filter(s => s.id === 'head' || s.id === 'body' || s.id === 'pet')
  const rightSlots = EQUIP_SLOTS.filter(s => s.id === 'weapon' || s.id === 'hands' || s.id === 'feet')
  const petItem = equipped.pet ? itemById(equipped.pet) : null
  const slotTotal = EQUIP_SLOTS.length

  const bonusParts = bonusLabel(equipBonuses).split(' · ').filter(p => p && p !== '—')

  const bonusStrip = bonusParts.length > 0 ? (
    <div className="lf-char-bonus-strip flex flex-wrap justify-center items-center gap-x-1 gap-y-0.5 text-[10px] leading-snug">
      {bonusParts.map(part => (
        <span key={part} className="lf-char-bonus-part whitespace-nowrap">{part}</span>
      ))}
    </div>
  ) : null

  const statsRows = [
    ['⚔️', 'Сила атаки', stats.attack, '#e6e2f0'],
    ['🛡️', 'Защита', stats.defense, '#e6e2f0'],
    ['⚡', 'Скорость', stats.speed, '#a99fff'],
    ['🧠', 'Интеллект', stats.intel, '#2dd9b8'],
    ['💰', 'Золото', userData?.gold || 0, '#e0bc6a'],
  ] as const

  const bagFiltersDesktop = (
    <div className="lf-char-bag-filters">
      <button
        type="button"
        className={`lf-char-bag-filter${bagFilter === 'all' ? ' lf-char-bag-filter--active' : ''}`}
        onClick={() => setBagFilter('all')}
      >
        Все
      </button>
      {EQUIP_SLOTS.map(s => (
        <button
          key={s.id}
          type="button"
          className={`lf-char-bag-filter${bagFilter === s.id ? ' lf-char-bag-filter--active' : ''}`}
          onClick={() => setBagFilter(s.id)}
        >
          {s.icon} {s.label}
        </button>
      ))}
    </div>
  )
  const bagFiltersMobile = (
    <div className="lf-char-bag-filters lf-char-bag-filters--mobile">
      <button
        type="button"
        className={`lf-char-bag-filter${bagFilter === 'all' ? ' lf-char-bag-filter--active' : ''}`}
        onClick={() => setBagFilter('all')}
      >
        Все
      </button>
      {EQUIP_SLOTS.map(s => (
        <button
          key={s.id}
          type="button"
          className={`lf-char-bag-filter${bagFilter === s.id ? ' lf-char-bag-filter--active' : ''}`}
          onClick={() => setBagFilter(s.id)}
        >
          {s.icon} {s.label}
        </button>
      ))}
    </div>
  )

  const bagItemsListDesktop = (
    <>
      {ownedItems.length === 0 && (
        <div className="lf-char-bag-empty">Пока пусто. Пройди данж и победи — шанс получить предмет.</div>
      )}
      {bagItems.map(item => (
        <EquipmentCard
          key={item.id}
          item={item}
          action="equip"
          onAction={() => equipItem(item)}
          compact
        />
      ))}
    </>
  )

  const bagItemsListMobile = (
    <>
      {ownedItems.length === 0 && (
        <div className="lf-char-bag-empty">Пока пусто. Пройди данж и победи — шанс получить предмет.</div>
      )}
      {bagItems.map(item => (
        <EquipmentCard
          key={item.id}
          item={item}
          action="equip"
          onAction={() => equipItem(item)}
          compact
          mobileRow
        />
      ))}
    </>
  )

  const consumablesList = (
    <>
      <div className="lf-char-bag-section-label">Расходники</div>
      <div className="lf-char-consumables-grid">
        {BATTLE_CONSUMABLES.map(c => (
          <div key={c.effect} className="lf-char-consumable-card">
            <div className="lf-char-consumable-card-icon">
              <PixelItem itemId={consumablePixelId(c.effect)} size={24} />
            </div>
            <span className="lf-char-consumable-card-label">
              {c.name} ({consumables[c.effect]})
            </span>
          </div>
        ))}
      </div>
    </>
  )

  const combatStats = [
    ['⚔️', 'АТК', stats.attack, '#e6e2f0'],
    ['🛡️', 'ЗАЩ', stats.defense, '#e6e2f0'],
    ['⚡', 'СКР', stats.speed, '#a99fff'],
    ['🧠', 'ИНТ', stats.intel, '#2dd9b8'],
  ] as const

  return (
    <div className="lf-char-page">
      <nav className={layout.navBar} style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e0bc6a', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', border: '1.5px solid #c9a84c', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>✦</div>
          LoreHeim
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#5a5670' }}>
          <PixelAvatar
              race={race}
              skinColor={character?.skin_color || '#c8a882'}
              hairStyle={character?.hair_style || 'a1'}
              hairColor={character?.hair_color || '#3d2b1f'}
              cloakColor={character?.cloak_color || '#4a1f6e'}
              equipment={visualEquip}
              size={40}
            />
          {character?.name} · Ур.{level}
        </div>
      </nav>

      {/* ── Mobile: fixed HUD + scrollable inventory (< md) ── */}
      <div className="md:hidden flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <section className="lf-char-mobile-hud h-[42%] shrink-0 flex flex-col min-h-0">
          <div className="lf-char-mobile-hud-top shrink-0">
            <div className="lf-char-mobile-hud-head">
              <div className="lf-char-mobile-hud-name">{character?.name}</div>
              <div className="lf-char-mobile-hud-sub">
                {RACE_LABELS[race]?.toUpperCase()} · УР. {level} · {equippedCount}/{slotTotal}
              </div>
            </div>

            <div className="lf-char-mobile-stats">
              {combatStats.map(([icon, label, val, color]) => (
                <div key={label} className="lf-char-mobile-stat">
                  <span className="lf-char-mobile-stat-icon">{icon}</span>
                  <span className="lf-char-mobile-stat-label">{label}</span>
                  <span className="lf-char-mobile-stat-val" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="lf-char-mobile-xp mt-3">
              <div className="lf-char-mobile-xp-labels">
                <span>УР. {level}</span>
                <span>{xpCurrent}/{xpNext}</span>
              </div>
              <div className="lf-char-mobile-xp-track">
                <div className="lf-char-mobile-xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>

          <div className="lf-char-mobile-stage flex-1 min-h-0 overflow-hidden">
            <div className="lf-char-mobile-hero">
              <div className="lf-char-mobile-slots lf-char-mobile-slots--left">
                {leftSlots.map(slot => (
                  <EquipSlotButton
                    key={slot.id}
                    slot={slot}
                    equipped={equipped}
                    onEquip={setBagFilter}
                    onUnequip={unequipSlot}
                  />
                ))}
              </div>

              <div className="lf-char-mobile-portrait">
                <div className="lf-char-portrait-frame lf-char-portrait-frame--mobile">
                  <PixelCharacter
                    race={race}
                    skinColor={character?.skin_color || '#c8a882'}
                    hairStyle={character?.hair_style || 'a1'}
                    hairColor={character?.hair_color || '#3d2b1f'}
                    cloakColor={character?.cloak_color || '#4a1f6e'}
                    equipment={visualEquip}
                    size={90}
                    glowTier={maxGlowTier}
                  />
                </div>
                {petItem && (
                  <div className="lf-char-pet-visual lf-char-pet-visual--mobile">
                    <PixelPet visualId={petItem.visualId} size={40} />
                  </div>
                )}
              </div>

              <div className="lf-char-mobile-slots lf-char-mobile-slots--right">
                {rightSlots.map(slot => (
                  <EquipSlotButton
                    key={slot.id}
                    slot={slot}
                    equipped={equipped}
                    onEquip={setBagFilter}
                    onUnequip={unequipSlot}
                  />
                ))}
              </div>
            </div>
          </div>

          {bonusStrip && (
            <div className="lf-char-bonus-wrap lf-char-bonus-wrap--mobile shrink-0">
              {bonusStrip}
            </div>
          )}
        </section>

        <section className="lf-char-mobile-bag h-[58%] shrink-0 flex flex-col bg-[#0b0c10] border-t border-white/10">
          <div className="lf-char-mobile-bag-head">
            <div className="lf-char-mobile-bag-title">Сумка · {ownedItems.length} предм.</div>
          </div>
          {bagFiltersMobile}
          <div className="lf-char-mobile-bag-list flex-1 overflow-y-auto min-h-0 px-3 pb-3">
            {bagItemsListMobile}
            {consumablesList}
          </div>
        </section>
      </div>

      {/* ── Tablet / Desktop: 2-column RPG layout (≥ md) ── */}
      <div className="hidden md:flex h-[calc(100vh-64px)] overflow-hidden">
        <aside className="lf-char-desk-left w-[45%] shrink-0 min-w-0 flex flex-col overflow-hidden bg-[#111318] border-r border-white/10">
          <div className="lf-char-desk-head shrink-0 px-5 pt-4 pb-3">
            <div className="lf-char-hero-title">{character?.name}</div>
            <div className="lf-char-hero-sub">
              {RACE_LABELS[race]?.toUpperCase()} · УР. {level} · {equippedCount}/{slotTotal} слотов
            </div>
            <div className="lf-char-desk-xp">
              <div className="lf-char-desk-xp-labels">
                <span>УРОВЕНЬ {level}</span>
                <span>{xpCurrent} / {xpNext}</span>
              </div>
              <div className="lf-char-desk-xp-track">
                <div className="lf-char-desk-xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>

          <div className="lf-char-desk-hero shrink-0 px-4 py-2">
            <div className="lf-char-desk-hero-grid">
              <div className="lf-char-desk-slots lf-char-desk-slots--left">
                {leftSlots.map(slot => (
                  <EquipSlotButton
                    key={slot.id}
                    slot={slot}
                    equipped={equipped}
                    onEquip={setBagFilter}
                    onUnequip={unequipSlot}
                  />
                ))}
              </div>

              <div className="lf-char-desk-portrait">
                <div className="lf-char-portrait-frame lf-char-portrait-frame--desk">
                  <PixelCharacter
                    race={race}
                    skinColor={character?.skin_color || '#c8a882'}
                    hairStyle={character?.hair_style || 'a1'}
                    hairColor={character?.hair_color || '#3d2b1f'}
                    cloakColor={character?.cloak_color || '#4a1f6e'}
                    equipment={visualEquip}
                    size={180}
                    glowTier={maxGlowTier}
                  />
                </div>
                <div className="lf-char-pet-visual lf-char-pet-visual--desk">
                  {petItem ? (
                    <PixelPet visualId={petItem.visualId} size={72} />
                  ) : (
                    <div className="lf-char-pet-placeholder lf-char-pet-placeholder--desk" aria-hidden>
                      <span>🐾</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lf-char-desk-slots lf-char-desk-slots--right">
                {rightSlots.map(slot => (
                  <EquipSlotButton
                    key={slot.id}
                    slot={slot}
                    equipped={equipped}
                    onEquip={setBagFilter}
                    onUnequip={unequipSlot}
                  />
                ))}
              </div>
            </div>

            {bonusStrip && (
              <div className="lf-char-bonus-wrap lf-char-bonus-wrap--desk shrink-0">
                {bonusStrip}
              </div>
            )}
          </div>

          <div className="lf-char-desk-stats flex-1 min-h-0 overflow-y-auto px-5 pb-4">
            <div className="lf-char-desk-stats-label">Характеристики</div>
            {statsRows.map(([icon, name, val, color]) => (
              <div key={name} className="lf-char-desk-stat-row">
                <div className="lf-char-desk-stat-name">
                  <span>{icon}</span>{name}
                </div>
                <div className="lf-char-desk-stat-val" style={{ color }}>{val}</div>
              </div>
            ))}
            <div className="lf-char-desk-nav">
              <AppNav step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />
            </div>
          </div>
        </aside>

        <section className="lf-char-desk-right w-[55%] shrink-0 flex flex-col h-full min-w-0 bg-[#0b0c10] overflow-hidden">
          <div className="lf-char-desk-bag-head shrink-0 px-5 pt-4 pb-2">
            <div className="lf-char-desk-bag-title">Сумка · {ownedItems.length} предм.</div>
            <div className="lf-char-desk-bag-hint">
              Снаряжение выпадает из данжей (~72% шанс дропа). Надеть — на персонаже.
            </div>
          </div>
          <div className="shrink-0 px-5">{bagFiltersDesktop}</div>
          <div className="lf-char-desk-bag-list flex-1 overflow-y-auto min-h-0 px-5 pb-5">
            {bagItemsListDesktop}
            {consumablesList}
          </div>
        </section>
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
