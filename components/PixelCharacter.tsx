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
}

const HAIR_STYLES: Record<string, (color: string) => React.ReactNode> = {
  a1: (c) => <>
    <rect x="6" y="3" width="12" height="3" fill={c}/>
    <rect x="5" y="4" width="2" height="2" fill={c}/>
    <rect x="17" y="4" width="2" height="2" fill={c}/>
  </>,
  a2: (c) => <>
    <rect x="6" y="2" width="12" height="4" fill={c}/>
    <rect x="4" y="4" width="3" height="8" fill={c}/>
    <rect x="17" y="4" width="3" height="8" fill={c}/>
  </>,
  a3: (c) => <>
    <rect x="6" y="2" width="12" height="4" fill={c}/>
    <rect x="17" y="5" width="2" height="14" fill={c}/>
    <rect x="18" y="7" width="2" height="10" fill={c}/>
  </>,
  a4: (c) => <rect x="7" y="3" width="10" height="2" fill={c}/>,
  a5: (c) => <>
    <rect x="5" y="1" width="3" height="4" fill={c}/>
    <rect x="9" y="0" width="3" height="4" fill={c}/>
    <rect x="13" y="1" width="3" height="3" fill={c}/>
    <rect x="16" y="2" width="3" height="4" fill={c}/>
    <rect x="4" y="4" width="2" height="3" fill={c}/>
    <rect x="18" y="4" width="2" height="3" fill={c}/>
  </>,
}

function RaceFeatures({ race, skinColor }: { race: string; skinColor: string }) {
  if (race === 'elf') return <>
    <rect x="4" y="8" width="2" height="5" fill={skinColor}/>
    <rect x="3" y="9" width="2" height="3" fill={skinColor}/>
    <rect x="18" y="8" width="2" height="5" fill={skinColor}/>
    <rect x="19" y="9" width="2" height="3" fill={skinColor}/>
  </>
  if (race === 'orc') return <>
    <rect x="3" y="9" width="3" height="4" fill={skinColor}/>
    <rect x="18" y="9" width="3" height="4" fill={skinColor}/>
    <rect x="11" y="16" width="2" height="3" fill="#e8e0d0"/>
    <rect x="15" y="16" width="2" height="3" fill="#e8e0d0"/>
  </>
  if (race === 'undead') return <>
    <rect x="4" y="9" width="2" height="3" fill="#8a9a7a"/>
    <rect x="18" y="9" width="2" height="3" fill="#8a9a7a"/>
    <rect x="11" y="10" width="1" height="4" fill="#2a3a2a" opacity="0.6"/>
    <rect x="14" y="9" width="1" height="3" fill="#2a3a2a" opacity="0.6"/>
  </>
  if (race === 'dwarf') return <>
    <rect x="2" y="9" width="3" height="4" fill={skinColor}/>
    <rect x="19" y="9" width="3" height="4" fill={skinColor}/>
    <rect x="9" y="14" width="10" height="4" fill="#8B6914"/>
    <rect x="8" y="15" width="12" height="4" fill="#8B6914"/>
    <rect x="7" y="16" width="14" height="2" fill="#6B4A10"/>
  </>
  return <>
    <rect x="4" y="10" width="2" height="3" fill={skinColor}/>
    <rect x="18" y="10" width="2" height="3" fill={skinColor}/>
  </>
}

function HeadGear({ visualId }: { visualId: string }) {
  if (visualId === 'head_cowl') return <>
    <rect x="5" y="2" width="14" height="5" fill="#3d2a1a"/>
    <rect x="4" y="4" width="3" height="6" fill="#3d2a1a"/>
    <rect x="19" y="4" width="3" height="6" fill="#3d2a1a"/>
    <rect x="6" y="1" width="12" height="2" fill="#4a3520"/>
  </>
  if (visualId === 'head_cap') return <>
    <rect x="5" y="3" width="14" height="3" fill="#2a3a5a"/>
    <rect x="4" y="5" width="16" height="2" fill="#1f2d48"/>
    <rect x="8" y="2" width="8" height="2" fill="#3a5080"/>
  </>
  if (visualId === 'head_crown') return <>
    <rect x="7" y="1" width="2" height="3" fill="#e0bc6a"/>
    <rect x="11" y="0" width="2" height="4" fill="#e0bc6a"/>
    <rect x="15" y="1" width="2" height="3" fill="#e0bc6a"/>
    <rect x="6" y="3" width="12" height="2" fill="#c9a84c"/>
    <rect x="5" y="4" width="14" height="2" fill="#8B6914"/>
  </>
  return null
}

function BodyGear({ visualId }: { visualId: string }) {
  if (visualId === 'body_runed') return <>
    <rect x="8" y="22" width="1" height="18" fill="#e0bc6a" opacity="0.55"/>
    <rect x="13" y="21" width="1" height="20" fill="#e0bc6a" opacity="0.45"/>
    <rect x="18" y="22" width="1" height="18" fill="#e0bc6a" opacity="0.55"/>
    <rect x="10" y="20" width="8" height="1" fill="#c9a84c" opacity="0.5"/>
  </>
  if (visualId === 'body_mantle') return <>
    <rect x="3" y="19" width="5" height="4" fill="#5a5a6a"/>
    <rect x="20" y="19" width="5" height="4" fill="#5a5a6a"/>
    <rect x="2" y="21" width="3" height="6" fill="#4a4a58"/>
    <rect x="23" y="21" width="3" height="6" fill="#4a4a58"/>
    <rect x="9" y="19" width="10" height="1" fill="#7a7a8a"/>
  </>
  return null
}

function WeaponGear({ visualId }: { visualId: string }) {
  if (visualId === 'weapon_birch') return <>
    <rect x="24" y="10" width="2" height="28" fill="#5a4030"/>
    <rect x="23" y="8" width="4" height="3" fill="#8B6914"/>
    <rect x="24" y="6" width="2" height="3" fill="#7b6cff"/>
  </>
  if (visualId === 'weapon_iron') return <>
    <rect x="24" y="8" width="3" height="30" fill="#3a3a48"/>
    <rect x="23" y="6" width="5" height="4" fill="#5a5a68"/>
    <rect x="24" y="4" width="3" height="3" fill="#8a8a98"/>
  </>
  if (visualId === 'weapon_crystal') return <>
    <rect x="24" y="11" width="2" height="27" fill="#2a2040"/>
    <rect x="22" y="4" width="6" height="6" fill="#7b6cff"/>
    <rect x="23" y="3" width="4" height="4" fill="#b8aeff"/>
    <rect x="24" y="2" width="2" height="2" fill="#e0e8ff"/>
  </>
  return <>
    <rect x="24" y="10" width="2" height="28" fill="#4a3520"/>
    <rect x="23" y="8" width="4" height="4" fill="#8B6914"/>
    <rect x="24" y="6" width="2" height="4" fill="#c9a84c"/>
    <rect x="23" y="5" width="4" height="4" fill="#7b6cff" opacity="0.9"/>
    <rect x="24" y="4" width="2" height="2" fill="#a99fff"/>
  </>
}

function HandsGear({ visualId }: { visualId: string }) {
  const color = visualId === 'hands_leather' ? '#6a4a28' : visualId === 'hands_runes' ? '#4a3a6a' : '#4a4038'
  const accent = visualId === 'hands_runes' ? '#e0bc6a' : '#3a3028'
  return <>
    <rect x="2" y="32" width="4" height="4" fill={color}/>
    <rect x="22" y="32" width="4" height="4" fill={color}/>
    {visualId !== 'hands_cloth' && <>
      <rect x="3" y="33" width="2" height="1" fill={accent}/>
      <rect x="23" y="33" width="2" height="1" fill={accent}/>
    </>}
  </>
}

function FeetGear({ visualId }: { visualId: string }) {
  const main = visualId === 'feet_iron' ? '#4a4a58' : visualId === 'feet_swift' ? '#2a4a5a' : '#3a3028'
  return <>
    <rect x="5" y="42" width="6" height="3" fill={main}/>
    <rect x="15" y="42" width="6" height="3" fill={main}/>
    <rect x="4" y="43" width="2" height="2" fill={main}/>
    <rect x="22" y="43" width="2" height="2" fill={main}/>
    {visualId === 'feet_swift' && <>
      <rect x="6" y="41" width="2" height="1" fill="#a99fff"/>
      <rect x="16" y="41" width="2" height="1" fill="#a99fff"/>
    </>}
  </>
}

export default function PixelCharacter({
  race, skinColor, hairStyle, hairColor, cloakColor, equipment = {}, size = 200,
}: Props) {
  const isOrc = race === 'orc'
  const isUndead = race === 'undead'
  const actualSkin = isOrc ? '#5a8a3a' : isUndead ? '#8aaa7a' : skinColor
  const cloakDark = '#1a1a2e'

  const headV = equipment.head
  const bodyV = equipment.body
  const weaponV = equipment.weapon
  const handsV = equipment.hands
  const feetV = equipment.feet

  return (
    <svg
      viewBox="0 0 28 48"
      width={size * 0.7}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={race === 'elf' ? 'scale(1, 1.15) translate(0, -3)' : race === 'dwarf' ? 'scale(1.1, 0.88) translate(-1.5, 2)' : ''}>
        <ellipse cx="14" cy="46" rx="7" ry="2" fill="rgba(0,0,0,0.3)"/>

        <rect x="5" y="28" width="18" height="16" fill={cloakColor}/>
        <rect x="4" y="30" width="2" height="12" fill={cloakColor}/>
        <rect x="22" y="30" width="2" height="12" fill={cloakColor}/>
        <rect x="8" y="30" width="1" height="14" fill={cloakDark} opacity="0.3"/>
        <rect x="13" y="29" width="1" height="15" fill={cloakDark} opacity="0.2"/>
        <rect x="18" y="30" width="1" height="14" fill={cloakDark} opacity="0.3"/>
        <rect x="4" y="42" width="3" height="2" fill={cloakColor}/>
        <rect x="9" y="43" width="3" height="2" fill={cloakColor}/>
        <rect x="14" y="42" width="3" height="2" fill={cloakColor}/>
        <rect x="19" y="43" width="3" height="2" fill={cloakColor}/>
        <rect x="23" y="42" width="2" height="2" fill={cloakColor}/>

        {feetV && <FeetGear visualId={feetV}/>}

        <rect x="2" y="24" width="4" height="10" fill={cloakColor}/>
        <rect x="22" y="24" width="4" height="10" fill={cloakColor}/>
        <rect x="2" y="33" width="4" height="3" fill={actualSkin}/>
        <rect x="22" y="33" width="4" height="3" fill={actualSkin}/>
        {handsV && <HandsGear visualId={handsV}/>}

        {race === 'dwarf' && <>
          <rect x="3" y="20" width="22" height="10" fill={cloakColor}/>
          <rect x="2" y="22" width="3" height="8" fill={cloakColor}/>
          <rect x="23" y="22" width="3" height="8" fill={cloakColor}/>
        </>}
        {race !== 'dwarf' && <rect x="6" y="20" width="16" height="10" fill={cloakColor}/>}
        {race === 'dwarf' && <rect x="4" y="20" width="20" height="10" fill={cloakColor}/>}
        {bodyV && <BodyGear visualId={bodyV}/>}
        <rect x="9" y="20" width="10" height="2" fill="#1a0a2e"/>
        <rect x="11" y="19" width="6" height="2" fill="#1a0a2e"/>

        <rect x="11" y="17" width="6" height="4" fill={actualSkin}/>

        <rect x="6" y={race === 'elf' ? 4 : race === 'dwarf' ? 8 : 6} width={race === 'dwarf' ? 18 : 16} height={race === 'dwarf' ? 11 : 13} fill={actualSkin}/>
        <rect x={race === 'dwarf' ? 4 : 5} y={race === 'elf' ? 6 : race === 'dwarf' ? 10 : 8} width="2" height="9" fill={actualSkin}/>
        <rect x={race === 'dwarf' ? 20 : 21} y={race === 'elf' ? 6 : race === 'dwarf' ? 10 : 8} width="2" height="9" fill={actualSkin}/>

        <RaceFeatures race={race} skinColor={actualSkin}/>

        <rect x="9" y="11" width="3" height="2" fill="#1a1a2e"/>
        <rect x="16" y="11" width="3" height="2" fill="#1a1a2e"/>
        <rect x="10" y="11" width="1" height="1" fill="#e0e8ff" opacity="0.8"/>
        <rect x="17" y="11" width="1" height="1" fill="#e0e8ff" opacity="0.8"/>

        {!isOrc && <rect x="12" y="15" width="6" height="1" fill="#1a1a2e" opacity="0.5"/>}

        {HAIR_STYLES[hairStyle]?.(hairColor)}
        {headV && <HeadGear visualId={headV}/>}

        {weaponV && <WeaponGear visualId={weaponV}/>}

        <rect x="7" y="21" width="2" height="6" fill="rgba(255,255,255,0.06)"/>
      </g>
    </svg>
  )
}
