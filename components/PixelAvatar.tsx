'use client'

import PixelCharacter from '@/components/PixelCharacter'
import PixelPet from '@/components/PixelPet'
import type { CharacterAvatarProps } from '@/lib/character-appearance'
import type { EquipSlot } from '@/lib/equipment'

function charGear(equipment: Partial<Record<EquipSlot, string>> = {}) {
  const { pet: _pet, ...gear } = equipment
  return gear
}

export default function PixelAvatar({
  race,
  skinColor,
  hairStyle,
  hairColor,
  cloakColor,
  equipment = {},
  size = 48,
}: CharacterAvatarProps) {
  const activePetId = equipment.pet
  const gear = charGear(equipment)

  const character = (
    <PixelCharacter
      race={race}
      skinColor={skinColor}
      hairStyle={hairStyle}
      hairColor={hairColor}
      cloakColor={cloakColor}
      equipment={gear}
      size={size}
    />
  )

  if (!activePetId) {
    return (
      <div className="lf-avatar-solo" style={{ width: size, height: size }}>
        {character}
      </div>
    )
  }

  const charSize = size * 0.55
  const petSize = size * 0.35

  return (
    <div
      className="lf-avatar-diorama"
      style={{
        position: 'relative',
        width: size * 1.4,
        height: size,
        background: 'radial-gradient(circle, #1c1f2a 0%, #0c0d14 100%)',
        border: '1px solid rgba(201, 168, 76, 0.25)',
        borderRadius: 12,
        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 8px 6px 8px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end' }}>
        <PixelCharacter
          race={race}
          skinColor={skinColor}
          hairStyle={hairStyle}
          hairColor={hairColor}
          cloakColor={cloakColor}
          equipment={gear}
          size={charSize}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 6,
          right: 10,
          zIndex: 3,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        }}
      >
        <PixelPet visualId={activePetId} size={petSize} />
      </div>
    </div>
  )
}
