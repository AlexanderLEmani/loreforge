import React from 'react'

type Props = {
  race: string
  skinColor: string
  hairStyle: string
  hairColor: string
  cloakColor: string
  size?: number
}

const HAIR_STYLES: Record<string, (color: string) => React.ReactNode> = {
  a1: (c) => <> {/* Короткие */}
    <rect x="6" y="3" width="12" height="3" fill={c}/>
    <rect x="5" y="4" width="2" height="2" fill={c}/>
    <rect x="17" y="4" width="2" height="2" fill={c}/>
  </>,
  a2: (c) => <> {/* Длинные */}
    <rect x="6" y="2" width="12" height="4" fill={c}/>
    <rect x="4" y="4" width="3" height="8" fill={c}/>
    <rect x="17" y="4" width="3" height="8" fill={c}/>
  </>,
  a3: (c) => <> {/* Хвост */}
    <rect x="6" y="2" width="12" height="4" fill={c}/>
    <rect x="17" y="5" width="2" height="14" fill={c}/>
    <rect x="18" y="7" width="2" height="10" fill={c}/>
  </>,
  a4: (c) => <> {/* Лысый/бритый */}
    <rect x="7" y="3" width="10" height="2" fill={c}/>
  </>,
  a5: (c) => <> {/* Всклокоченные */}
    <rect x="5" y="1" width="3" height="4" fill={c}/>
    <rect x="9" y="0" width="3" height="4" fill={c}/>
    <rect x="13" y="1" width="3" height="3" fill={c}/>
    <rect x="16" y="2" width="3" height="4" fill={c}/>
    <rect x="4" y="4" width="2" height="3" fill={c}/>
    <rect x="18" y="4" width="2" height="3" fill={c}/>
  </>,
}

// Уши по расе
function RaceFeatures({ race, skinColor }: { race: string, skinColor: string }) {
  if (race === 'elf') return <>
    <rect x="4" y="8" width="2" height="5" fill={skinColor}/>
    <rect x="3" y="9" width="2" height="3" fill={skinColor}/>
    <rect x="18" y="8" width="2" height="5" fill={skinColor}/>
    <rect x="19" y="9" width="2" height="3" fill={skinColor}/>
  </>
  if (race === 'orc') return <>
    <rect x="3" y="9" width="3" height="4" fill={skinColor}/>
    <rect x="18" y="9" width="3" height="4" fill={skinColor}/>
    {/* Клыки */}
    <rect x="9" y="16" width="2" height="3" fill="#e8e0d0"/>
    <rect x="13" y="16" width="2" height="3" fill="#e8e0d0"/>
  </>
  if (race === 'undead') return <>
    <rect x="4" y="9" width="2" height="3" fill="#8a9a7a"/>
    <rect x="18" y="9" width="2" height="3" fill="#8a9a7a"/>
    {/* Трещины на лице */}
    <rect x="11" y="10" width="1" height="4" fill="#2a3a2a" opacity="0.6"/>
    <rect x="14" y="9" width="1" height="3" fill="#2a3a2a" opacity="0.6"/>
  </>
  if (race === 'dwarf') return <>
    <rect x="2" y="9" width="3" height="4" fill={skinColor}/>
    <rect x="19" y="9" width="3" height="4" fill={skinColor}/>
    {/* Борода — прямо под подбородком */}
    <rect x="7" y="14" width="10" height="4" fill="#8B6914"/>
    <rect x="6" y="15" width="12" height="4" fill="#8B6914"/>
    <rect x="5" y="16" width="14" height="2" fill="#6B4A10"/>
  </>
  // human — обычные уши
  return <>
    <rect x="4" y="10" width="2" height="3" fill={skinColor}/>
    <rect x="18" y="10" width="2" height="3" fill={skinColor}/>
  </>
}

export default function PixelCharacter({ race, skinColor, hairStyle, hairColor, cloakColor, size = 200 }: Props) {
  const isOrc = race === 'orc'
  const isUndead = race === 'undead'
  const actualSkin = isOrc ? '#5a8a3a' : isUndead ? '#8aaa7a' : skinColor

  // Тёмный контур мантии
  const cloakDark = '#1a1a2e'

  return (
    <svg
      viewBox="0 0 28 48"
      width={size * 0.7}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ТЕНЬ */}
      <ellipse cx="14" cy="46" rx="7" ry="2" fill="rgba(0,0,0,0.3)"/>

      {/* МАНТИЯ — НИЖНЯЯ ЧАСТЬ */}
      <rect x="5" y="28" width="18" height="16" fill={cloakColor}/>
      <rect x="4" y="30" width="2" height="12" fill={cloakColor}/>
      <rect x="22" y="30" width="2" height="12" fill={cloakColor}/>
      {/* Складки мантии */}
      <rect x="8" y="30" width="1" height="14" fill={cloakDark} opacity="0.3"/>
      <rect x="13" y="29" width="1" height="15" fill={cloakDark} opacity="0.2"/>
      <rect x="18" y="30" width="1" height="14" fill={cloakDark} opacity="0.3"/>
      {/* Низ мантии — зубчатый */}
      <rect x="4" y="42" width="3" height="2" fill={cloakColor}/>
      <rect x="9" y="43" width="3" height="2" fill={cloakColor}/>
      <rect x="14" y="42" width="3" height="2" fill={cloakColor}/>
      <rect x="19" y="43" width="3" height="2" fill={cloakColor}/>
      <rect x="23" y="42" width="2" height="2" fill={cloakColor}/>

      {/* РУКИ */}
      <rect x="2" y="24" width="4" height="10" fill={cloakColor}/>
      <rect x="22" y="24" width="4" height="10" fill={cloakColor}/>
      {/* Кисти */}
      <rect x="2" y="33" width="4" height="3" fill={actualSkin}/>
      <rect x="22" y="33" width="4" height="3" fill={actualSkin}/>

      {/* Пропорции по расе */}
      {race === 'dwarf' && <>
        {/* Дварф — широкие плечи */}
        <rect x="3" y="20" width="22" height="10" fill={cloakColor}/>
        <rect x="2" y="22" width="3" height="8" fill={cloakColor}/>
        <rect x="23" y="22" width="3" height="8" fill={cloakColor}/>
      </>}
      {/* ТЕЛО — МАНТИЯ ВЕРХ */}
      {race !== 'dwarf' && <rect x="6" y="20" width="16" height="10" fill={cloakColor}/>}
      {race === 'dwarf' && <rect x="4" y="20" width="20" height="10" fill={cloakColor}/>}
      {/* Воротник */}
      <rect x="9" y="20" width="10" height="2" fill="#1a0a2e"/>
      <rect x="11" y="19" width="6" height="2" fill="#1a0a2e"/>

      {/* ШЕЯ */}
      <rect x="11" y="17" width="6" height="4" fill={actualSkin}/>

      {/* ГОЛОВА */}
      <rect x="6" y={race === 'elf' ? 4 : race === 'dwarf' ? 8 : 6} width={race === 'dwarf' ? 18 : 16} height={race === 'dwarf' ? 11 : 13} fill={actualSkin}/>
      {/* Форма головы */}
      <rect x={race === 'dwarf' ? 4 : 5} y={race === 'elf' ? 6 : race === 'dwarf' ? 10 : 8} width="2" height="9" fill={actualSkin}/>
      <rect x={race === 'dwarf' ? 20 : 21} y={race === 'elf' ? 6 : race === 'dwarf' ? 10 : 8} width="2" height="9" fill={actualSkin}/>

      {/* УШИ И ОСОБЕННОСТИ РАСЫ */}
      <RaceFeatures race={race} skinColor={actualSkin}/>

      {/* ГЛАЗА */}
      <rect x="9" y="11" width="3" height="2" fill="#1a1a2e"/>
      <rect x="16" y="11" width="3" height="2" fill="#1a1a2e"/>
      {/* Блик в глазах */}
      <rect x="10" y="11" width="1" height="1" fill="#e0e8ff" opacity="0.8"/>
      <rect x="17" y="11" width="1" height="1" fill="#e0e8ff" opacity="0.8"/>

      {/* РОТ */}
      {!isOrc && <rect x="11" y="15" width="6" height="1" fill="#1a1a2e" opacity="0.5"/>}

      {/* ПРИЧЁСКА */}
      {HAIR_STYLES[hairStyle]?.(hairColor)}

      {/* ПОСОХ */}
      <rect x="24" y="10" width="2" height="28" fill="#4a3520"/>
      <rect x="23" y="8" width="4" height="4" fill="#8B6914"/>
      <rect x="24" y="6" width="2" height="4" fill="#c9a84c"/>
      {/* Кристалл посоха */}
      <rect x="23" y="5" width="4" height="4" fill="#7b6cff" opacity="0.9"/>
      <rect x="24" y="4" width="2" height="2" fill="#a99fff"/>

      {/* БЛИК на мантии */}
      <rect x="7" y="21" width="2" height="6" fill="rgba(255,255,255,0.06)"/>
    </svg>
  )
}
