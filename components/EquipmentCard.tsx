'use client'

import {
  type EquipmentItem,
  tierMeta,
} from '@/lib/equipment'

type Props = {
  item: EquipmentItem
  action?: 'equip' | 'unequip' | 'none'
  equipped?: boolean
  onAction?: () => void
  compact?: boolean
  mobileRow?: boolean
}

export default function EquipmentCard({
  item,
  action = 'none',
  equipped = false,
  onAction,
  compact = false,
  mobileRow = false,
}: Props) {
  const tier = tierMeta(item.tier)

  return (
    <div
      className={`lf-equip-card lf-equip-card--tier-${item.tier}${equipped ? ' lf-equip-card--equipped' : ''}${compact ? ' lf-equip-card--compact' : ''}${mobileRow ? ' lf-equip-card--mobile-row' : ''}`}
      style={{
        borderColor: tier.border,
        background: `linear-gradient(145deg, ${tier.bg}, rgba(20, 24, 32, 0.95))`,
        boxShadow: equipped ? `0 0 20px ${tier.glow}` : undefined,
      }}
    >
      <div className="lf-equip-card-icon" style={{ color: tier.color }}>
        {item.icon}
      </div>
      <div className="lf-equip-card-body">
        <div className="lf-equip-card-name">{item.name}</div>
        <div className="lf-equip-card-tier" style={{ color: tier.color }}>
          {mobileRow ? item.desc : `${tier.label} · ${item.desc}`}
        </div>
      </div>
      {action !== 'none' && onAction && (
        <button
          type="button"
          className={`lf-equip-card-btn${action === 'unequip' ? ' lf-equip-card-btn--danger' : ''}`}
          onClick={onAction}
        >
          {action === 'equip' ? 'Надеть' : 'Снять'}
        </button>
      )}
    </div>
  )
}
