import React from 'react'
import type { EquipSlot } from '@/lib/equipment'

type Props = {
  race: string
  skinColor: string
  hairStyle: string
  hairColor: string
  cloakColor: string
  equipment?: Partial<Record<EquipSlot, string>>
  size?: number
  /** Максимальный tier снаряжения — свечение вокруг фигуры */
  glowTier?: 1 | 2 | 3
}

const GLOW_COLORS: Record<number, string> = {
  1: 'rgba(154, 168, 184, 0.25)',
  2: 'rgba(169, 159, 255, 0.35)',
  3: 'rgba(224, 188, 106, 0.45)',
}

const HAIR_STYLES: Record<string, (color: string) => React.ReactNode> = {
  a1: (c) => <>
    <rect x="9" y="11" width="10" height="3" fill={c} />
    <rect x="8" y="12" width="2" height="2" fill={c} />
    <rect x="18" y="12" width="2" height="2" fill={c} />
  </>,
  a2: (c) => <>
    <rect x="9" y="10" width="10" height="4" fill={c} />
    <rect x="7" y="12" width="3" height="10" fill={c} />
    <rect x="18" y="12" width="3" height="10" fill={c} />
  </>,
  a3: (c) => <>
    <rect x="9" y="10" width="10" height="4" fill={c} />
    <rect x="18" y="13" width="2" height="12" fill={c} />
    <rect x="19" y="15" width="2" height="8" fill={c} />
  </>,
  a4: (c) => <rect x="10" y="12" width="8" height="2" fill={c} />,
  a5: (c) => <>
    <rect x="8" y="9" width="3" height="4" fill={c} />
    <rect x="12" y="8" width="3" height="4" fill={c} />
    <rect x="16" y="9" width="3" height="3" fill={c} />
    <rect x="7" y="12" width="2" height="3" fill={c} />
    <rect x="19" y="12" width="2" height="3" fill={c} />
  </>,
}

function RaceFeatures({ race, skinColor }: { race: string; skinColor: string }) {
  if (race === 'elf') return <>
    <rect x="7" y="15" width="2" height="5" fill={skinColor} />
    <rect x="6" y="16" width="2" height="3" fill={skinColor} />
    <rect x="19" y="15" width="2" height="5" fill={skinColor} />
    <rect x="20" y="16" width="2" height="3" fill={skinColor} />
  </>
  if (race === 'orc') return <>
    <rect x="7" y="15" width="3" height="4" fill={skinColor} />
    <rect x="18" y="15" width="3" height="4" fill={skinColor} />
  </>
  if (race === 'undead') return <>
    <rect x="8" y="15" width="2" height="3" fill="#6a7a5a" />
    <rect x="18" y="15" width="2" height="3" fill="#6a7a5a" />
    <rect x="11" y="16" width="1" height="3" fill="#2a3a2a" opacity="0.5" />
    <rect x="14" y="15" width="1" height="2" fill="#2a3a2a" opacity="0.5" />
  </>
  if (race === 'dwarf') return <>
    <rect x="6" y="15" width="3" height="4" fill={skinColor} />
    <rect x="19" y="15" width="3" height="4" fill={skinColor} />
    <rect x="10" y="23" width="8" height="3" fill="#8B6914" />
    <rect x="9" y="24" width="10" height="3" fill="#8B6914" />
    <rect x="8" y="25" width="12" height="2" fill="#6B4A10" />
  </>
  return <>
    <rect x="8" y="16" width="2" height="3" fill={skinColor} />
    <rect x="18" y="16" width="2" height="3" fill={skinColor} />
  </>
}

function HeadGear({ visualId }: { visualId: string }) {
  if (visualId === 'head_cowl') return <>
    <rect x="7" y="10" width="14" height="5" fill="#3d2a1a" />
    <rect x="6" y="12" width="3" height="5" fill="#3d2a1a" />
    <rect x="19" y="12" width="3" height="5" fill="#3d2a1a" />
    <rect x="8" y="9" width="12" height="2" fill="#4a3520" />
  </>
  if (visualId === 'head_cap') return <>
    <rect x="7" y="11" width="14" height="3" fill="#2a3a5a" />
    <rect x="6" y="13" width="16" height="2" fill="#1f2d48" />
    <rect x="10" y="10" width="8" height="2" fill="#3a5080" />
  </>
  if (visualId === 'head_crown') return <>
    <rect x="9" y="9" width="2" height="3" fill="#e0bc6a" />
    <rect x="13" y="8" width="2" height="4" fill="#e0bc6a" />
    <rect x="17" y="9" width="2" height="3" fill="#e0bc6a" />
    <rect x="8" y="11" width="12" height="2" fill="#c9a84c" />
    <rect x="7" y="12" width="14" height="2" fill="#8B6914" />
  </>
  return null
}

function BodyGear({ visualId }: { visualId: string }) {
  if (visualId === 'body_cloth') return <>
    <rect x="6" y="26" width="3" height="11" fill="#b8a898" opacity="0.35" />
    <rect x="19" y="26" width="3" height="11" fill="#b8a898" opacity="0.35" />
    <rect x="9" y="35" width="10" height="2" fill="#6a5a48" opacity="0.45" />
    <rect x="11" y="37" width="6" height="1" fill="#c9a84c" opacity="0.35" />
  </>
  if (visualId === 'body_runed') return <>
    <rect x="9" y="28" width="1" height="14" fill="#e0bc6a" opacity="0.55" />
    <rect x="14" y="27" width="1" height="16" fill="#e0bc6a" opacity="0.45" />
    <rect x="18" y="28" width="1" height="14" fill="#e0bc6a" opacity="0.55" />
    <rect x="11" y="26" width="6" height="1" fill="#c9a84c" opacity="0.5" />
  </>
  if (visualId === 'body_mantle') return <>
    <rect x="4" y="25" width="5" height="4" fill="#5a5a6a" />
    <rect x="19" y="25" width="5" height="4" fill="#5a5a6a" />
    <rect x="3" y="27" width="3" height="6" fill="#4a4a58" />
    <rect x="22" y="27" width="3" height="6" fill="#4a4a58" />
    <rect x="10" y="25" width="8" height="1" fill="#7a7a8a" />
  </>
  return null
}

function WeaponGear({ visualId }: { visualId: string }) {
  if (visualId === 'weapon_birch') return <>
    <rect x="24" y="14" width="2" height="26" fill="#5a4030" />
    <rect x="23" y="12" width="4" height="3" fill="#8B6914" />
    <rect x="24" y="10" width="2" height="3" fill="#7b6cff" />
  </>
  if (visualId === 'weapon_iron') return <>
    <rect x="24" y="12" width="3" height="28" fill="#3a3a48" />
    <rect x="23" y="10" width="5" height="4" fill="#5a5a68" />
    <rect x="24" y="8" width="3" height="3" fill="#8a8a98" />
  </>
  if (visualId === 'weapon_crystal') return <>
    <rect x="24" y="15" width="2" height="25" fill="#2a2040" />
    <rect x="22" y="8" width="6" height="6" fill="#7b6cff" />
    <rect x="23" y="7" width="4" height="4" fill="#b8aeff" />
    <rect x="24" y="6" width="2" height="2" fill="#e0e8ff" />
  </>
  return <>
    <rect x="24" y="14" width="2" height="26" fill="#4a3520" />
    <rect x="23" y="12" width="4" height="4" fill="#8B6914" />
    <rect x="24" y="10" width="2" height="4" fill="#c9a84c" />
    <rect x="23" y="9" width="4" height="4" fill="#7b6cff" opacity="0.9" />
    <rect x="24" y="8" width="2" height="2" fill="#a99fff" />
  </>
}

function HandsGear({ visualId }: { visualId: string }) {
  const color = visualId === 'hands_leather' ? '#6a4a28' : visualId === 'hands_runes' ? '#4a3a6a' : '#4a4038'
  const accent = visualId === 'hands_runes' ? '#e0bc6a' : '#3a3028'
  return <>
    <rect x="3" y="36" width="4" height="4" fill={color} />
    <rect x="21" y="36" width="4" height="4" fill={color} />
    {visualId !== 'hands_cloth' && <>
      <rect x="4" y="37" width="2" height="1" fill={accent} />
      <rect x="22" y="37" width="2" height="1" fill={accent} />
    </>}
  </>
}

function FeetGear({ visualId }: { visualId: string }) {
  const main = visualId === 'feet_iron' ? '#4a4a58' : visualId === 'feet_swift' ? '#2a4a5a' : '#3a3028'
  return <>
    <rect x="5" y="43" width="6" height="3" fill={main} />
    <rect x="15" y="43" width="6" height="3" fill={main} />
    <rect x="4" y="44" width="2" height="2" fill={main} />
    <rect x="22" y="44" width="2" height="2" fill={main} />
    {visualId === 'feet_swift' && <>
      <rect x="6" y="42" width="2" height="1" fill="#a99fff" />
      <rect x="16" y="42" width="2" height="1" fill="#a99fff" />
    </>}
  </>
}

export default function PixelCharacter({
  race, skinColor, hairStyle, hairColor, cloakColor, equipment = {}, size = 200, glowTier,
}: Props) {
  const isOrc = race === 'orc'
  const isUndead = race === 'undead'
  const finalSkinColor = isOrc ? '#5a8a3a' : isUndead ? '#8aaa7a' : skinColor
  const aspect = 48 / 28

  const headV = equipment.head
  const bodyV = equipment.body
  const weaponV = equipment.weapon
  const handsV = equipment.hands
  const feetV = equipment.feet

  const raceTransform =
    race === 'elf' ? 'scale(1, 1.08) translate(0, -1.5)' :
    race === 'dwarf' ? 'scale(1.08, 0.92) translate(-1, 2)' :
    undefined

  return (
    <div className="lf-pixel-char-wrap" style={{ width: size, height: size * aspect }}>
      {glowTier && (
        <div
          className="lf-pixel-char-glow"
          style={{
            background: `radial-gradient(circle, ${GLOW_COLORS[glowTier]} 0%, transparent 68%)`,
          }}
        />
      )}
      <svg
        viewBox="0 0 28 48"
        width={size}
        height={size * aspect}
        style={{ imageRendering: 'pixelated' }}
        className="lf-pixel-char-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={raceTransform}>
          {/* Тень под ногами */}
          <ellipse cx="14" cy="44" rx="8" ry="2" fill="rgba(0,0,0,0.4)" />

          {/* Задний плащ / капюшон */}
          <rect x="6" y="12" width="16" height="30" fill={cloakColor} />
          <rect x="5" y="14" width="1" height="24" fill="#000000" opacity="0.3" />
          <rect x="22" y="14" width="1" height="24" fill="#000000" opacity="0.3" />
          <rect x="7" y="13" width="14" height="11" fill="#1a0a2e" opacity="0.6" />

          {/* Основная мантия */}
          <rect x="8" y="24" width="12" height="19" fill={cloakColor} />
          <rect x="10" y="25" width="2" height="18" fill="#000000" opacity="0.25" />
          <rect x="16" y="25" width="2" height="18" fill="#000000" opacity="0.25" />
          <rect x="9" y="26" width="1" height="16" fill="#ffffff" opacity="0.08" />
          <rect x="15" y="26" width="1" height="16" fill="#ffffff" opacity="0.08" />
          <rect x="12" y="24" width="4" height="3" fill="#1a0a2e" />
          <rect x="13" y="27" width="2" height="2" fill="#1a0a2e" />

          {/* Рукава */}
          <rect x="5" y="24" width="3" height="14" fill={cloakColor} />
          <rect x="6" y="25" width="1" height="12" fill="#000000" opacity="0.3" />
          <rect x="20" y="24" width="3" height="14" fill={cloakColor} />
          <rect x="21" y="25" width="1" height="12" fill="#000000" opacity="0.3" />

          {feetV && <FeetGear visualId={feetV} />}
          {bodyV && <BodyGear visualId={bodyV} />}

          {/* Шея и голова */}
          <rect x="12" y="22" width="4" height="2" fill={finalSkinColor} />
          <rect x="12" y="22" width="4" height="1" fill="#000000" opacity="0.15" />
          <rect x="9" y="14" width="10" height="8" fill={finalSkinColor} />
          <rect x="10" y="22" width="8" height="1" fill={finalSkinColor} />
          <rect x="11" y="23" width="6" height="1" fill={finalSkinColor} />
          <rect x="9" y="14" width="10" height="1" fill="#000000" opacity="0.25" />
          <rect x="9" y="15" width="1" height="6" fill="#000000" opacity="0.15" />
          <rect x="18" y="15" width="1" height="6" fill="#000000" opacity="0.15" />
          <rect x="11" y="23" width="6" height="1" fill="#000000" opacity="0.2" />

          <RaceFeatures race={race} skinColor={finalSkinColor} />

          {/* Глаза */}
          <rect x="11" y="17" width="2" height="2" fill="#000000" opacity="0.3" />
          <rect x="12" y="17" width="1" height="1" fill={isUndead ? '#e05555' : '#1a1a2e'} />
          {!isUndead && <rect x="11" y="17" width="1" height="1" fill="#ffffff" opacity="0.7" />}
          <rect x="15" y="17" width="2" height="2" fill="#000000" opacity="0.3" />
          <rect x="15" y="17" width="1" height="1" fill={isUndead ? '#e05555' : '#1a1a2e'} />
          {!isUndead && <rect x="16" y="17" width="1" height="1" fill="#ffffff" opacity="0.7" />}

          {/* Рот */}
          <rect x="13" y="20" width="2" height="1" fill="#000000" opacity="0.35" />
          {isOrc && <>
            <rect x="12" y="20" width="1" height="1" fill="#e8e0d0" />
            <rect x="15" y="20" width="1" height="1" fill="#e8e0d0" />
          </>}

          {HAIR_STYLES[hairStyle]?.(hairColor)}
          {handsV && <HandsGear visualId={handsV} />}
          {headV && <HeadGear visualId={headV} />}
          {weaponV && <WeaponGear visualId={weaponV} />}
        </g>
      </svg>
    </div>
  )
}
