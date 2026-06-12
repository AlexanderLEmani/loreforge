'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PixelCharacter from '@/components/PixelCharacter'
import AppNav from '@/components/AppNav'
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
import { addOwnedItem, loadEquipped, loadOwnedIds, saveEquipped } from '@/lib/equipment-storage'
import { navUnlockFromUser } from '@/lib/nav-unlock'

const RACE_ICONS: Record<string, string> = {
  human: '🧙', elf: '🧝', dwarf: '⛏️', orc: '👹', undead: '💀'
}

const RACE_LABELS: Record<string, string> = {
  human: 'Странствующий маг', elf: 'Архивист', dwarf: 'Рунный кузнец', orc: 'Боевой учёный', undead: 'Некромант знаний'
}

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400]
const XP_TO_NEXT =    [100, 150, 250, 400, 500, 600, 700, 800, 900, 1000, 1100]

export default function CharacterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [character, setCharacter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [equipped, setEquipped] = useState<EquippedMap>({})
  const [ownedIds, setOwnedIds] = useState<string[]>([])
  const [bagFilter, setBagFilter] = useState<'all' | EquipSlot>('all')
  const [buying, setBuying] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const { data: ud } = await supabase
        .from('users')
        .select('xp, level, gold, streak, total_answers, visited_character, onboarding_step, visited_college, visited_training, visited_guild, visited_grimoire, visited_shop, visited_skills, quest_first_dungeon')
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
      const purchased = await loadOwnedIds(user.id)
      setOwnedIds(ownedItemIds(level, purchased))
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
    setToast('Предмет снят — лежит в сумке')
    setTimeout(() => setToast(null), 2000)
  }

  async function buyAndOwn(item: EquipmentItem) {
    if (!user?.id || !userData || buying) return
    if ((userData.gold || 0) < item.goldCost) {
      setToast('Недостаточно золота')
      setTimeout(() => setToast(null), 2000)
      return
    }
    setBuying(item.id)
    const newGold = userData.gold - item.goldCost
    await supabase.from('users').update({ gold: newGold }).eq('id', user.id)
    const nextOwned = await addOwnedItem(user.id, item.id)
    setUserData({ ...userData, gold: newGold })
    setOwnedIds(ownedItemIds(userData.level || 1, nextOwned))
    await equipItem(item)
    setBuying(null)
  }

  if (loading) return (
    <div style={{ background: '#0b0c10', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9590a8', fontFamily: 'serif', fontSize: '18px' }}>
      Загрузка...
    </div>
  )

  const level = userData?.level || 1
  const xp = userData?.xp || 0
  const xpBase = XP_THRESHOLDS[level - 1] || 0
  const xpNext = XP_TO_NEXT[level - 1] || 100
  const xpCurrent = Math.max(0, xp - xpBase)
  const xpPct = Math.min((xpCurrent / xpNext) * 100, 100)

  // Характеристики на основе уровня и расы
  const race = character?.race || 'human'
  const equipBonuses = computeEquipBonuses(equipped)
  const stats = {
    attack:  10 + level * 4 + (race === 'orc' ? 8 : 0) + Math.round((equipBonuses.attackPct || 0) * 0.4),
    defense: 5  + level * 2 + (race === 'dwarf' ? 5 : 0) + Math.round((equipBonuses.defensePct || 0) * 0.3),
    speed:   8  + level * 3 + (race === 'elf' ? 4 : 0) + Math.round((equipBonuses.attackPct || 0) * 0.2),
    intel:   10 + level * 6 + (race === 'elf' ? 10 : 0) + (race === 'human' ? 4 : 0) + Math.round((equipBonuses.spellDamagePct || 0) * 0.5),
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

      {/* НАВБАР */}
      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', minHeight: 'calc(100vh - 56px)' }}>

        {/* ЛЕВЫЙ САЙДБАР */}
        <div style={{ background: '#111318', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Персонаж</div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', marginBottom: '4px' }}>
              <span>УРОВЕНЬ {level}</span><span>{xpCurrent} / {xpNext}</span>
            </div>
            <div style={{ height: '3px', background: '#171920', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#7b6cff', borderRadius: '2px', width: `${xpPct}%` }}></div>
            </div>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>Характеристики</div>

          {[
            ['⚔️', 'Сила атаки', stats.attack, '#e6e2f0'],
            ['🛡️', 'Защита',    stats.defense, '#e6e2f0'],
            ['⚡', 'Скорость',  stats.speed,   '#a99fff'],
            ['🧠', 'Интеллект', stats.intel,   '#2dd9b8'],
            ['💰', 'Золото',    userData?.gold || 0, '#e0bc6a'],
          ].map(([icon, name, val, color]) => (
            <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9590a8' }}><span>{icon as string}</span>{name as string}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: color as string }}>{val as number}</div>
            </div>
          ))}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '14px 0 12px' }}></div>
          <AppNav step={userData?.onboarding_step || 0} navUnlock={navUnlockFromUser(userData)} />
        </div>

        {/* ЦЕНТР */}
        <div style={{ padding: '2rem', background: '#0b0c10', overflowY: 'auto' }}>
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '4px' }}>Снаряжение и внешность</div>
            <div style={{ fontFamily: 'monospace', fontSize: '26px', color: '#e0bc6a' }}>Твой персонаж</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Карточка персонажа */}
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e0bc6a', marginBottom: '4px' }}>{character?.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#a99fff', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>
                {RACE_LABELS[race]?.toUpperCase()} · УР. {level}
              </div>

             {/* Аватар */}
              <div style={{ background: '#0d0f14', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.15)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                {equippedCount > 0 ? bonusLabel(equipBonuses) : 'Ничего не надето — выбери из сумки →'}
              </div>

              <div style={{ width: '100%', marginBottom: '10px' }}>
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
                          {item?.name ?? 'Пусто'}
                        </div>
                      </div>
                      {item ? (
                        <div
                          onClick={() => unequipSlot(slot.id)}
                          style={{ fontFamily: 'monospace', fontSize: '9px', color: '#e05555', cursor: 'pointer', padding: '4px 8px', border: '1px solid rgba(224,85,85,0.35)', borderRadius: '4px' }}
                        >
                          Снять
                        </div>
                      ) : (
                        <div
                          onClick={() => setBagFilter(slot.id)}
                          style={{ fontFamily: 'monospace', fontSize: '9px', color: '#a99fff', cursor: 'pointer', padding: '4px 8px' }}
                        >
                          Надеть →
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Статистика */}
            <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#e0bc6a', marginBottom: '1rem', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                Статистика
              </div>

              {[
                ['📚', 'Ответов дано', userData?.total_answers || 0],
                ['🔥', 'Дней подряд', userData?.streak || 0],
                ['⚗️', 'Данжей пройдено', '—'],
                ['📖', 'Тем изучено', '—'],
                ['⏱️', 'Часов в игре', '—'],
              ].map(([icon, label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9590a8' }}>
                    <span>{icon as string}</span>{label as string}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e0bc6a' }}>{val as any}</div>
                </div>
              ))}

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>Раса</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#171920', borderRadius: '8px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '28px' }}>{RACE_ICONS[race]}</span>
                  <div>
                    <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e6e2f0' }}>{['human','elf','dwarf','orc','undead'].includes(race) ? ['Человек','Эльф','Дварф','Орк','Нежить'][['human','elf','dwarf','orc','undead'].indexOf(race)] : race}</div>
                    <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginTop: '2px' }}>
                      {race === 'human' && '+10% к XP за все предметы'}
                      {race === 'elf'   && '+20% к XP за магию и теорию'}
                      {race === 'dwarf' && 'Таймер защиты +5 секунд'}
                      {race === 'orc'   && 'Кулак наносит +5 урона'}
                      {race === 'undead' && 'Тёмная магия кулдаун -1 ход'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>Ветки знаний</div>
                <div style={{ background: '#171920', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#9590a8' }}>
                    <span>∑</span> Математика
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c9a84c' }}>Ур. {level}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ПРАВЫЙ САЙДБАР — Сумка */}
        <div style={{ background: '#111318', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.25rem', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '10px' }}>
            Сумка · {ownedItems.length} предм.
          </div>
          <div style={{ fontSize: '11px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '12px' }}>
            Все твои вещи здесь. Надеть — на персонаже. Снять — возвращает в сумку.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
            <div
              onClick={() => setBagFilter('all')}
              style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace', cursor: 'pointer', border: `1px solid ${bagFilter === 'all' ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`, color: bagFilter === 'all' ? '#e0bc6a' : '#5a5670' }}
            >
              Все
            </div>
            {EQUIP_SLOTS.map(s => (
              <div
                key={s.id}
                onClick={() => setBagFilter(s.id)}
                style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace', cursor: 'pointer', border: `1px solid ${bagFilter === s.id ? 'rgba(123,108,255,0.5)' : 'rgba(255,255,255,0.08)'}`, color: bagFilter === s.id ? '#a99fff' : '#5a5670' }}
              >
                {s.icon}
              </div>
            ))}
          </div>

          {bagItems.length === 0 && (
            <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic', marginBottom: '12px' }}>
              {bagFilter === 'all' ? 'Все предметы надеты или купи новые ниже.' : 'В этом слоте нет свободных предметов.'}
            </div>
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
              <div
                onClick={() => equipItem(item)}
                style={{ padding: '6px', borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer', background: 'rgba(123,108,255,0.1)', border: '1px solid rgba(123,108,255,0.3)', color: '#a99fff' }}
              >
                Надеть
              </div>
            </div>
          ))}

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>Лавка снаряжения</div>

          {EQUIPMENT_ITEMS.filter(i => !ownedIds.includes(i.id) && i.goldCost > 0).map(item => {
            const canBuy = level >= item.minLevel && (userData?.gold || 0) >= item.goldCost
            return (
              <div key={item.id} style={{ background: '#1a1610', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '9px', padding: '10px 12px', marginBottom: '6px', opacity: item.minLevel > level ? 0.5 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#e6e2f0' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: '#7b6cff' }}>{item.desc}</div>
                  </div>
                </div>
                {item.minLevel > level ? (
                  <div style={{ fontSize: '10px', color: '#5a5670' }}>Нужен ур. {item.minLevel}</div>
                ) : (
                  <div
                    onClick={() => canBuy && buyAndOwn(item)}
                    style={{ padding: '6px', borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', cursor: canBuy ? 'pointer' : 'default', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', color: canBuy ? '#e0bc6a' : '#e05555' }}
                  >
                    {buying === item.id ? '...' : `💰 ${item.goldCost} золота`}
                  </div>
                )}
              </div>
            )
          })}

          <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '14px 0 12px' }}>Расходники</div>

          {[
            ['🧪', 'Зелья HP', '0'],
            ['📜', 'Свитки', '0'],
            ['⚡', 'Двойная атака', '0'],
          ].map(([icon, name, count]) => (
            <div key={name as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', marginBottom: '5px', opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9590a8' }}>
                <span>{icon as string}</span>{name as string}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#5a5670' }}>{count as string}</div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '2rem' }}>
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(123,108,255,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '460px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>👤</div>
              <div style={{ fontFamily: 'serif', fontSize: '22px', color: '#a99fff', marginBottom: '6px' }}>Твой персонаж</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', letterSpacing: '0.2em' }}>СНАРЯЖЕНИЕ И СТАТИСТИКА</div>
            </div>
            <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Здесь живёт твой персонаж. Со временем здесь появится:
              <br/><br/>
              <span style={{ color: '#e6e2f0' }}>🎽 Снаряжение</span> — предметы которые ты находишь в данжах. Надевай лучшее.
              <br/>
              <span style={{ color: '#e6e2f0' }}>📊 Характеристики</span> — растут с уровнем и зависят от расы.
              <br/>
              <span style={{ color: '#e6e2f0' }}>📦 Инвентарь</span> — зелья, свитки и расходники для боя.
              <br/><br/>
              Пока слоты пустые — иди в данжи и заполняй их.
            </div>
            <div onClick={() => setShowWelcome(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(123,108,255,0.12)', border: '1px solid rgba(123,108,255,0.4)', borderRadius: '10px', textAlign: 'center', fontFamily: 'serif', fontSize: '16px', color: '#a99fff', cursor: 'pointer' }}>
              Понял →
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
