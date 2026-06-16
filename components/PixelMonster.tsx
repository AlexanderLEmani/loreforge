import React from 'react'
import type { MonsterVisualId } from '@/lib/monster-visuals'

type Props = {
  visualId: string
  size?: number
}

const DARK = '#1a0a2e'
const DAMAGE = '#e05555'
const IRON = '#3a3a48'
const IRON_SHADOW = '#252530'
const GOLD = '#e0bc6a'
const GOLD_SHADOW = '#8B6914'
const WOOD = '#5a4030'
const WOOD_SHADOW = '#4a3520'
const SLIME = '#3a6a4a'
const SLIME_BRIGHT = '#5aaa6a'
const PAPER = '#d2b48c'
const PAPER_SHADOW = '#8b7355'
const STONE = '#5a5a68'
const CRYSTAL = '#7b6cff'

function ScribScrib() {
  return <>
    <rect x="6" y="12" width="12" height="15" fill={PAPER} />
    <rect x="5" y="14" width="1" height="11" fill={PAPER_SHADOW} />
    <rect x="18" y="14" width="1" height="11" fill={PAPER_SHADOW} />
    <rect x="5" y="11" width="14" height="2" fill={PAPER_SHADOW} />
    <rect x="5" y="26" width="14" height="2" fill={PAPER_SHADOW} />
    <rect x="9" y="16" width="2" height="2" fill={DARK} />
    <rect x="9" y="16" width="1" height="1" fill={DAMAGE} />
    <rect x="13" y="16" width="2" height="2" fill={DARK} />
    <rect x="14" y="16" width="1" height="1" fill={DAMAGE} />
    <rect x="8" y="20" width="3" height="1" fill={CRYSTAL} opacity="0.6" />
    <rect x="12" y="22" width="4" height="1" fill={CRYSTAL} opacity="0.6" />
  </>
}

function Collector() {
  return <>
    <rect x="7" y="10" width="10" height="18" fill="#2a2040" />
    <rect x="6" y="14" width="12" height="14" fill={DARK} />
    <rect x="9" y="5" width="6" height="6" fill={IRON} />
    <rect x="9" y="9" width="6" height="2" fill={IRON_SHADOW} />
    <rect x="10" y="7" width="1" height="1" fill={DAMAGE} />
    <rect x="13" y="7" width="1" height="1" fill={DAMAGE} />
    <rect x="10" y="17" width="4" height="3" fill={WOOD} />
    <rect x="11" y="17" width="2" height="1" fill={GOLD} />
  </>
}

function SlimeSprite() {
  return <>
    <rect x="5" y="16" width="14" height="12" fill={SLIME} />
    <rect x="6" y="14" width="12" height="2" fill={SLIME} />
    <rect x="7" y="13" width="10" height="1" fill={SLIME} />
    <rect x="7" y="15" width="4" height="2" fill={SLIME_BRIGHT} />
    <rect x="14" y="16" width="3" height="1" fill={SLIME_BRIGHT} />
    <rect x="6" y="19" width="1" height="5" fill={SLIME_BRIGHT} />
    <rect x="9" y="18" width="2" height="2" fill={DARK} />
    <rect x="9" y="18" width="1" height="1" fill="#ffffff" />
    <rect x="13" y="18" width="2" height="2" fill={DARK} />
    <rect x="13" y="18" width="1" height="1" fill="#ffffff" />
  </>
}

function Mimic() {
  return <>
    <rect x="5" y="15" width="14" height="11" fill={WOOD} />
    <rect x="4" y="16" width="1" height="9" fill={WOOD_SHADOW} />
    <rect x="19" y="16" width="1" height="9" fill={WOOD_SHADOW} />
    <rect x="5" y="25" width="14" height="2" fill={IRON} />
    <rect x="9" y="15" width="2" height="10" fill={IRON} />
    <rect x="13" y="15" width="2" height="10" fill={IRON} />
    <rect x="5" y="13" width="14" height="2" fill={DARK} />
    <rect x="6" y="13" width="1" height="1" fill="#ffffff" />
    <rect x="9" y="13" width="1" height="1" fill="#ffffff" />
    <rect x="12" y="13" width="1" height="1" fill="#ffffff" />
    <rect x="15" y="13" width="1" height="1" fill="#ffffff" />
    <rect x="17" y="13" width="1" height="1" fill="#ffffff" />
    <rect x="7" y="14" width="2" height="1" fill={DAMAGE} />
    <rect x="5" y="7" width="14" height="6" fill={WOOD} />
    <rect x="6" y="6" width="12" height="1" fill={WOOD} />
    <rect x="5" y="9" width="14" height="1" fill={IRON} />
    <rect x="8" y="9" width="2" height="2" fill={CRYSTAL} />
    <rect x="14" y="9" width="2" height="2" fill={CRYSTAL} />
  </>
}

function FractionGolem() {
  return <>
    <rect x="6" y="22" width="12" height="6" fill={STONE} />
    <rect x="5" y="24" width="14" height="3" fill="#4a4a58" />
    <rect x="5" y="13" width="6" height="7" fill={STONE} />
    <rect x="13" y="13" width="6" height="7" fill={STONE} />
    <rect x="10" y="15" width="4" height="2" fill={CRYSTAL} />
    <rect x="11" y="14" width="2" height="4" fill="#a99fff" />
    <rect x="9" y="4" width="6" height="6" fill={STONE} />
    <rect x="10" y="3" width="4" height="1" fill={STONE} />
    <rect x="11" y="6" width="2" height="2" fill={DARK} />
    <rect x="11" y="6" width="1" height="1" fill={GOLD} />
  </>
}

function GoblinAppraiser() {
  return <>
    <rect x="9" y="14" width="6" height="12" fill="#5a8a3a" />
    <rect x="8" y="16" width="8" height="8" fill={WOOD_SHADOW} />
    <rect x="9" y="6" width="6" height="7" fill="#5a8a3a" />
    <rect x="5" y="8" width="4" height="2" fill="#4a6a2a" />
    <rect x="15" y="8" width="4" height="2" fill="#4a6a2a" />
    <rect x="8" y="10" width="2" height="1" fill="#5a8a3a" />
    <rect x="10" y="8" width="1" height="1" fill={GOLD} />
    <rect x="13" y="8" width="1" height="1" fill={DARK} />
    <rect x="4" y="15" width="5" height="9" fill={PAPER_SHADOW} />
    <rect x="3" y="17" width="6" height="6" fill={PAPER} />
    <rect x="4" y="19" width="2" height="2" fill={GOLD} />
  </>
}

function BossCollector() {
  return <>
    <rect x="5" y="8" width="14" height="20" fill={DARK} />
    <rect x="4" y="12" width="16" height="16" fill="#140520" />
    <rect x="8" y="12" width="1" height="16" fill={GOLD} />
    <rect x="15" y="12" width="1" height="16" fill={GOLD} />
    <rect x="8" y="3" width="8" height="7" fill={IRON} />
    <rect x="7" y="2" width="2" height="3" fill={IRON_SHADOW} />
    <rect x="15" y="2" width="2" height="3" fill={IRON_SHADOW} />
    <rect x="10" y="5" width="1" height="1" fill={DAMAGE} />
    <rect x="13" y="5" width="1" height="1" fill={DAMAGE} />
    <rect x="19" y="4" width="2" height="23" fill={WOOD} />
    <rect x="18" y="2" width="4" height="3" fill={GOLD} />
    <rect x="19" y="0" width="2" height="2" fill={CRYSTAL} />
  </>
}

function BossMimic() {
  return <>
    <rect x="3" y="12" width="18" height="15" fill={WOOD_SHADOW} />
    <rect x="2" y="14" width="20" height="11" fill={WOOD} />
    <rect x="2" y="12" width="20" height="2" fill={GOLD} />
    <rect x="2" y="23" width="20" height="2" fill={GOLD} />
    <rect x="6" y="12" width="2" height="13" fill={GOLD_SHADOW} />
    <rect x="16" y="12" width="2" height="13" fill={GOLD_SHADOW} />
    <rect x="3" y="10" width="18" height="3" fill={DARK} />
    <rect x="4" y="10" width="1" height="1" fill="#ffffff" />
    <rect x="7" y="10" width="1" height="2" fill="#ffffff" />
    <rect x="10" y="10" width="2" height="1" fill="#ffffff" />
    <rect x="14" y="10" width="1" height="2" fill="#ffffff" />
    <rect x="18" y="10" width="1" height="1" fill="#ffffff" />
    <rect x="9" y="11" width="6" height="2" fill={CRYSTAL} />
    <rect x="13" y="13" width="4" height="2" fill="#a99fff" />
    <rect x="16" y="15" width="2" height="1" fill={DAMAGE} />
    <rect x="5" y="6" width="14" height="5" fill={WOOD} />
    <rect x="6" y="7" width="1" height="1" fill={DAMAGE} />
    <rect x="9" y="5" width="2" height="2" fill={DAMAGE} />
    <rect x="14" y="6" width="1" height="1" fill={DAMAGE} />
    <rect x="17" y="7" width="2" height="1" fill={DAMAGE} />
  </>
}

function Bat() {
  return <>
    <rect x="10" y="10" width="4" height="4" fill="#3a2048" />
    <rect x="8" y="11" width="2" height="2" fill="#2a1038" />
    <rect x="14" y="11" width="2" height="2" fill="#2a1038" />
    <rect x="6" y="12" width="3" height="1" fill="#4a3058" />
    <rect x="15" y="12" width="3" height="1" fill="#4a3058" />
    <rect x="4" y="13" width="4" height="2" fill="#3a2048" />
    <rect x="16" y="13" width="4" height="2" fill="#3a2048" />
    <rect x="9" y="14" width="6" height="8" fill="#3a2048" />
    <rect x="10" y="11" width="1" height="1" fill={DAMAGE} />
    <rect x="13" y="11" width="1" height="1" fill={DAMAGE} />
  </>
}

function Spark() {
  return <>
    <rect x="11" y="6" width="2" height="3" fill={GOLD} />
    <rect x="10" y="9" width="4" height="2" fill={GOLD} />
    <rect x="9" y="11" width="6" height="3" fill="#e0bc6a" />
    <rect x="8" y="14" width="8" height="4" fill={GOLD} />
    <rect x="10" y="18" width="4" height="6" fill={GOLD_SHADOW} />
    <rect x="7" y="12" width="2" height="2" fill="#fff8c0" />
    <rect x="15" y="15" width="2" height="2" fill="#fff8c0" />
    <rect x="11" y="10" width="2" height="2" fill="#ffffff" />
  </>
}

function Split() {
  return <>
    <rect x="8" y="8" width="8" height="10" fill={DARK} />
    <rect x="7" y="10" width="10" height="8" fill="#2a2040" />
    <rect x="11" y="6" width="2" height="16" fill={CRYSTAL} />
    <rect x="5" y="14" width="4" height="2" fill={IRON} />
    <rect x="15" y="14" width="4" height="2" fill={IRON} />
    <rect x="4" y="15" width="2" height="4" fill={IRON_SHADOW} />
    <rect x="18" y="15" width="2" height="4" fill={IRON_SHADOW} />
    <rect x="9" y="11" width="2" height="2" fill={DAMAGE} />
    <rect x="13" y="11" width="2" height="2" fill={DAMAGE} />
    <rect x="8" y="20" width="8" height="6" fill="#2a2040" />
  </>
}

function Shade() {
  return <>
    <rect x="8" y="8" width="8" height="10" fill="#3a3a58" opacity="0.85" />
    <rect x="7" y="10" width="10" height="8" fill="#2a2a48" opacity="0.9" />
    <rect x="9" y="18" width="6" height="8" fill="#2a2a48" opacity="0.75" />
    <rect x="10" y="11" width="1" height="2" fill={CRYSTAL} />
    <rect x="13" y="11" width="1" height="2" fill={CRYSTAL} />
    <rect x="6" y="14" width="2" height="3" fill="#4a4a68" opacity="0.5" />
    <rect x="16" y="14" width="2" height="3" fill="#4a4a68" opacity="0.5" />
  </>
}

function Pie() {
  return <>
    <rect x="6" y="18" width="12" height="4" fill={PAPER} />
    <rect x="5" y="19" width="14" height="2" fill={PAPER_SHADOW} />
    <rect x="7" y="14" width="10" height="5" fill="#c8860a" />
    <rect x="8" y="13" width="8" height="2" fill="#e0bc6a" />
    <rect x="9" y="15" width="6" height="2" fill="#8B4513" />
    <rect x="10" y="16" width="1" height="1" fill={DARK} />
    <rect x="13" y="16" width="1" height="1" fill={DARK} />
  </>
}

function Half() {
  return <>
    <rect x="9" y="14" width="6" height="12" fill="#5a4030" />
    <rect x="9" y="6" width="6" height="7" fill="#c8a882" />
    <rect x="8" y="8" width="2" height="4" fill="#c8a882" />
    <rect x="14" y="8" width="2" height="4" fill="#8aaa7a" />
    <rect x="9" y="6" width="3" height="7" fill="#c8a882" />
    <rect x="12" y="6" width="3" height="7" fill="#5a8a3a" />
    <rect x="10" y="8" width="1" height="1" fill={DARK} />
    <rect x="13" y="8" width="1" height="1" fill={DAMAGE} />
    <rect x="11" y="10" width="2" height="1" fill={DARK} opacity="0.4" />
  </>
}

function Rat() {
  return <>
    <rect x="8" y="14" width="8" height="6" fill="#6a5a48" />
    <rect x="14" y="15" width="6" height="3" fill="#5a4a38" />
    <rect x="18" y="16" width="2" height="1" fill="#4a3a28" />
    <rect x="9" y="12" width="5" height="4" fill="#7a6a58" />
    <rect x="8" y="11" width="2" height="2" fill="#8a7a68" />
    <rect x="10" y="13" width="1" height="1" fill={DAMAGE} />
    <rect x="7" y="10" width="2" height="2" fill="#8a7a68" />
    <rect x="12" y="10" width="2" height="2" fill="#8a7a68" />
    <rect x="6" y="18" width="2" height="3" fill="#5a4a38" />
    <rect x="10" y="19" width="2" height="3" fill="#5a4a38" />
  </>
}

function Ogre() {
  return <>
    <rect x="8" y="14" width="8" height="12" fill="#5a8a3a" />
    <rect x="7" y="16" width="10" height="8" fill="#4a6a2a" />
    <rect x="9" y="5" width="6" height="8" fill="#5a8a3a" />
    <rect x="7" y="7" width="2" height="3" fill="#4a6a2a" />
    <rect x="15" y="7" width="2" height="3" fill="#4a6a2a" />
    <rect x="10" y="8" width="1" height="1" fill={DAMAGE} />
    <rect x="13" y="8" width="1" height="1" fill={DAMAGE} />
    <rect x="11" y="10" width="2" height="1" fill={DARK} />
    <rect x="6" y="18" width="3" height="6" fill="#4a6a2a" />
    <rect x="15" y="18" width="3" height="6" fill="#4a6a2a" />
  </>
}

function Leech() {
  return <>
    <rect x="7" y="14" width="10" height="10" fill="#4a2040" />
    <rect x="8" y="12" width="8" height="3" fill="#5a2848" />
    <rect x="9" y="10" width="6" height="3" fill="#6a3050" />
    <rect x="10" y="16" width="1" height="1" fill={DAMAGE} />
    <rect x="13" y="16" width="1" height="1" fill={DAMAGE} />
    <rect x="11" y="18" width="2" height="1" fill={DAMAGE} />
    <rect x="5" y="16" width="3" height="2" fill="#3a1830" />
    <rect x="16" y="16" width="3" height="2" fill="#3a1830" />
  </>
}

function Bee() {
  return <>
    <rect x="9" y="12" width="6" height="8" fill={GOLD} />
    <rect x="9" y="14" width="6" height="1" fill={DARK} />
    <rect x="9" y="16" width="6" height="1" fill={DARK} />
    <rect x="9" y="18" width="6" height="1" fill={DARK} />
    <rect x="7" y="10" width="4" height="3" fill="#fff8c0" opacity="0.7" />
    <rect x="13" y="10" width="4" height="3" fill="#fff8c0" opacity="0.7" />
    <rect x="10" y="13" width="1" height="1" fill={DARK} />
    <rect x="13" y="13" width="1" height="1" fill={DARK} />
    <rect x="11" y="20" width="2" height="2" fill={DARK} />
  </>
}

function Cultist() {
  return <>
    <rect x="7" y="10" width="10" height="16" fill="#2a2040" />
    <rect x="6" y="14" width="12" height="12" fill={DARK} />
    <rect x="8" y="6" width="8" height="6" fill="#2a2040" />
    <rect x="9" y="5" width="6" height="2" fill={DARK} />
    <rect x="10" y="8" width="1" height="1" fill={CRYSTAL} />
    <rect x="13" y="8" width="1" height="1" fill={CRYSTAL} />
    <rect x="11" y="12" width="2" height="3" fill={CRYSTAL} opacity="0.8" />
    <rect x="10" y="18" width="4" height="1" fill={GOLD} opacity="0.5" />
  </>
}

function Imp() {
  return <>
    <rect x="9" y="14" width="6" height="10" fill={DAMAGE} />
    <rect x="9" y="6" width="6" height="7" fill="#c04040" />
    <rect x="8" y="4" width="2" height="3" fill={DAMAGE} />
    <rect x="14" y="4" width="2" height="3" fill={DAMAGE} />
    <rect x="10" y="8" width="1" height="1" fill={DARK} />
    <rect x="13" y="8" width="1" height="1" fill={DARK} />
    <rect x="11" y="10" width="2" height="1" fill={DARK} />
    <rect x="8" y="18" width="2" height="4" fill="#8a3030" />
    <rect x="14" y="18" width="2" height="4" fill="#8a3030" />
  </>
}

function Fallback() {
  return <>
    <rect x="7" y="10" width="10" height="16" fill="#2a2040" />
    <rect x="8" y="8" width="8" height="4" fill="#3a3050" />
    <rect x="9" y="12" width="2" height="2" fill={DAMAGE} />
    <rect x="13" y="12" width="2" height="2" fill={DAMAGE} />
    <rect x="10" y="16" width="4" height="1" fill={DARK} />
  </>
}

const SPRITES: Record<MonsterVisualId, () => React.ReactNode> = {
  scrib_scrib: ScribScrib,
  collector: Collector,
  slime: SlimeSprite,
  mimic: Mimic,
  fraction_golem: FractionGolem,
  goblin_appraiser: GoblinAppraiser,
  boss_collector: BossCollector,
  boss_mimic: BossMimic,
  bat: Bat,
  spark: Spark,
  split: Split,
  shade: Shade,
  pie: Pie,
  half: Half,
  rat: Rat,
  ogre: Ogre,
  leech: Leech,
  bee: Bee,
  cultist: Cultist,
  imp: Imp,
  fallback: Fallback,
}

export default function PixelMonster({ visualId, size = 96 }: Props) {
  const aspect = 32 / 24
  const Sprite = SPRITES[visualId as MonsterVisualId] ?? Fallback

  return (
    <div className="lf-pixel-monster-wrap" style={{ width: size, height: size * aspect }}>
      <svg
        viewBox="0 0 24 32"
        width={size}
        height={size * aspect}
        style={{ imageRendering: 'pixelated' }}
        className="lf-pixel-monster-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <ellipse cx="12" cy="29" rx="7" ry="1.5" fill="rgba(0,0,0,0.4)" />
        <Sprite />
      </svg>
    </div>
  )
}
