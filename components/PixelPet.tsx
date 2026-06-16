import React from 'react'

type Props = {
  visualId: string
  size?: number
}

function PetSprite({ visualId }: { visualId: string }) {
  if (visualId === 'pet_owl') {
    return (
      <>
        <ellipse cx="10" cy="17" rx="7" ry="2" fill="rgba(0,0,0,0.25)" />
        <rect x="4" y="8" width="12" height="8" fill="#5a4030" />
        <rect x="3" y="10" width="3" height="5" fill="#6a5040" />
        <rect x="14" y="10" width="3" height="5" fill="#6a5040" />
        <rect x="6" y="6" width="8" height="6" fill="#8a6848" />
        <rect x="7" y="4" width="6" height="4" fill="#9a7858" />
        <rect x="7" y="7" width="2" height="2" fill="#1a1a2e" />
        <rect x="11" y="7" width="2" height="2" fill="#1a1a2e" />
        <rect x="8" y="9" width="4" height="1" fill="#e0bc6a" />
        <rect x="5" y="5" width="2" height="2" fill="#e0bc6a" opacity="0.8" />
        <rect x="13" y="5" width="2" height="2" fill="#e0bc6a" opacity="0.8" />
        <rect x="8" y="14" width="4" height="3" fill="#4a3520" />
      </>
    )
  }
  if (visualId === 'pet_wyrm') {
    return (
      <>
        <ellipse cx="10" cy="17" rx="8" ry="2" fill="rgba(0,0,0,0.25)" />
        <rect x="3" y="11" width="14" height="4" fill="#3a6a4a" />
        <rect x="5" y="9" width="10" height="3" fill="#4a8a5a" />
        <rect x="7" y="7" width="6" height="3" fill="#5aaa6a" />
        <rect x="2" y="12" width="3" height="2" fill="#2a4a3a" />
        <rect x="15" y="12" width="3" height="2" fill="#2a4a3a" />
        <rect x="8" y="5" width="4" height="4" fill="#6aba7a" />
        <rect x="9" y="6" width="1" height="1" fill="#e05555" />
        <rect x="11" y="6" width="1" height="1" fill="#e05555" />
        <rect x="10" y="8" width="2" height="1" fill="#1a1a2e" />
        <rect x="4" y="10" width="2" height="2" fill="#7b6cff" opacity="0.7" />
        <rect x="14" y="10" width="2" height="2" fill="#7b6cff" opacity="0.7" />
        <rect x="6" y="14" width="2" height="2" fill="#3a5a4a" />
        <rect x="12" y="14" width="2" height="2" fill="#3a5a4a" />
      </>
    )
  }
  if (visualId === 'pet_floppa') {
    const dark = '#1a1a2e'
    const ginger = '#c87a32'
    const gingerDark = '#96501e'
    const white = '#e8eaf0'
    const nose = '#0c0d12'
    return (
      <>
        <ellipse cx="10" cy="18" rx="7" ry="1.5" fill="rgba(0,0,0,0.3)" />
        <rect x="3" y="12" width="2" height="4" fill={dark} />
        <rect x="5" y="11" width="5" height="5" fill={dark} />
        <rect x="6" y="10" width="3" height="1" fill={dark} />
        <rect x="4" y="15" width="2" height="3" fill={gingerDark} />
        <rect x="6" y="13" width="4" height="5" fill={ginger} />
        <rect x="10" y="13" width="2" height="5" fill={ginger} />
        <rect x="12" y="14" width="2" height="4" fill={gingerDark} />
        <rect x="10" y="17" width="2" height="1" fill={white} />
        <rect x="12" y="17" width="2" height="1" fill={white} />
        <rect x="10" y="11" width="3" height="3" fill={white} />
        <rect x="11" y="14" width="1" height="2" fill={white} />
        <rect x="8" y="11" width="3" height="1" fill="#7a8a9a" />
        <rect x="9" y="12" width="1" height="3" fill="#5a6a7a" />
        <rect x="8" y="8" width="4" height="3" fill={ginger} />
        <rect x="9" y="4" width="5" height="5" fill={ginger} />
        <rect x="10" y="3" width="3" height="1" fill={ginger} />
        <rect x="7" y="5" width="2" height="4" fill={gingerDark} />
        <rect x="8" y="9" width="1" height="1" fill={dark} />
        <rect x="13" y="6" width="3" height="2" fill={ginger} />
        <rect x="12" y="8" width="3" height="1" fill={white} />
        <rect x="15" y="5" width="2" height="2" fill={nose} />
        <rect x="12" y="5" width="1" height="1" fill={dark} />
        <rect x="13" y="5" width="1" height="1" fill="#a99fff" opacity="0.9" />
      </>
    )
  }
  if (visualId === 'pet_mote') {
    return (
    <>
      <ellipse cx="10" cy="16" rx="6" ry="2" fill="rgba(0,0,0,0.2)" />
      <rect x="5" y="8" width="10" height="8" fill="#7b6cff" opacity="0.85" />
      <rect x="6" y="7" width="8" height="2" fill="#a99fff" />
      <rect x="7" y="9" width="6" height="4" fill="#b8aeff" opacity="0.6" />
      <rect x="7" y="10" width="2" height="2" fill="#1a1a2e" />
      <rect x="11" y="10" width="2" height="2" fill="#1a1a2e" />
      <rect x="8" y="12" width="4" height="1" fill="#e0e8ff" opacity="0.5" />
      <rect x="4" y="11" width="2" height="2" fill="#a99fff" opacity="0.5" />
      <rect x="14" y="11" width="2" height="2" fill="#a99fff" opacity="0.5" />
    </>
    )
  }
  return null
}

export default function PixelPet({ visualId, size = 88 }: Props) {
  return (
    <div className="lf-pixel-pet-wrap" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 20 20"
        width={size}
        height={size}
        className="lf-pixel-pet-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <PetSprite visualId={visualId} />
      </svg>
    </div>
  )
}
