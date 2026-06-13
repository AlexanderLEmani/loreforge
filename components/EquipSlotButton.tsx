'use client'

import {
  type EquipSlot,
  type EquipmentItem,
  itemById,
  tierMeta,
  type EquippedMap,
} from '@/lib/equipment'

type SlotDef = { id: EquipSlot; icon: string; label: string }

type Props = {
  slot: SlotDef
  equipped: EquippedMap
  onEquip: (slot: EquipSlot) => void
  onUnequip: (slot: EquipSlot) => void
}

export default function EquipSlotButton({ slot, equipped, onEquip, onUnequip }: Props) {
  const id = equipped[slot.id]
  const item = id ? itemById(id) : null
  const tier = item ? tierMeta(item.tier) : null
  const empty = !item

  return (
    <button
      type="button"
      className={`lf-equip-slot${empty ? ' lf-equip-slot--empty' : ''}`}
      style={
        tier
          ? {
              borderColor: tier.border,
              background: `linear-gradient(160deg, ${tier.bg}, rgba(12, 14, 20, 0.9))`,
              boxShadow: `0 0 14px ${tier.glow}`,
            }
          : undefined
      }
      onClick={() => (item ? onUnequip(slot.id) : onEquip(slot.id))}
      title={item ? `${item.name} — клик чтобы снять` : `${slot.label} — клик чтобы надеть`}
    >
      <span className="lf-equip-slot-icon">{item?.icon ?? slot.icon}</span>
      <span className="lf-equip-slot-label">{slot.label}</span>
      {item && (
        <span className="lf-equip-slot-tier" style={{ color: tier?.color }}>
          {tier?.label}
        </span>
      )}
      {empty && <span className="lf-equip-slot-hint">пусто</span>}
    </button>
  )
}
