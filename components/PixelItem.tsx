import React from 'react'

type Props = {
  itemId: string
  size?: number
}

const GLASS = 'rgba(255, 255, 255, 0.25)'
const HEAL = '#e05555'
const GOLD = '#e0bc6a'
const IRON = '#5a5a68'
const MAGIC = '#7b6cff'

function PotionHp() {
  return <>
    <rect x="7" y="2" width="2" height="1" fill="#8b5a2b" />
    <rect x="6" y="3" width="4" height="1" fill={GLASS} />
    <rect x="7" y="4" width="2" height="2" fill={GLASS} />
    <rect x="4" y="6" width="8" height="8" fill={GLASS} />
    <rect x="5" y="5" width="6" height="1" fill={GLASS} />
    <rect x="5" y="8" width="6" height="5" fill={HEAL} />
    <rect x="6" y="7" width="4" height="1" fill={HEAL} />
    <rect x="6" y="9" width="1" height="1" fill="#ffffff" opacity="0.6" />
  </>
}

function ItemShield() {
  return <>
    <rect x="3" y="2" width="10" height="2" fill={IRON} />
    <rect x="2" y="4" width="12" height="4" fill={IRON} />
    <rect x="3" y="8" width="10" height="2" fill={IRON} />
    <rect x="4" y="10" width="8" height="2" fill={IRON} />
    <rect x="6" y="12" width="4" height="2" fill="#4a4a58" />
    <rect x="7" y="14" width="2" height="1" fill="#3a3a48" />
    <rect x="7" y="4" width="2" height="6" fill={GOLD} />
    <rect x="5" y="6" width="6" height="2" fill={GOLD} />
  </>
}

function ItemScrollHint() {
  return <>
    <rect x="4" y="4" width="8" height="8" fill="#d2b48c" />
    <rect x="3" y="3" width="1" height="10" fill="#5a4030" />
    <rect x="12" y="3" width="1" height="10" fill="#5a4030" />
    <rect x="7" y="4" width="2" height="8" fill={MAGIC} />
    <rect x="8" y="7" width="2" height="2" fill={GOLD} />
    <rect x="5" y="5" width="2" height="1" fill="#ffffff" opacity="0.4" />
  </>
}

function PotionPower() {
  return <>
    <rect x="7" y="1" width="2" height="2" fill="#3a3a48" />
    <rect x="4" y="4" width="8" height="10" fill={GLASS} />
    <rect x="5" y="6" width="6" height="7" fill={MAGIC} />
    <rect x="6" y="5" width="4" height="1" fill={MAGIC} />
    <rect x="7" y="8" width="2" height="2" fill={GOLD} />
    <rect x="6" y="9" width="4" height="1" fill={GOLD} />
  </>
}

const SPRITES: Record<string, () => React.ReactNode> = {
  potion_hp: PotionHp,
  item_shield: ItemShield,
  item_scroll_hint: ItemScrollHint,
  potion_power: PotionPower,
}

export default function PixelItem({ itemId, size = 32 }: Props) {
  const Sprite = SPRITES[itemId]
  if (!Sprite) return null

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      className="lf-pixel-item-svg"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <Sprite />
    </svg>
  )
}
