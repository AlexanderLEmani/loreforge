import type { EquipSlot } from '@/lib/equipment'

export const CHARACTER_APPEARANCE_SELECT =
  'name, race, skin_color, hair_style, hair_color, cloak_color'

export type CharacterAppearanceRow = {
  name?: string
  race?: string
  skin_color?: string
  hair_style?: string
  hair_color?: string
  cloak_color?: string
}

export type CharacterAppearance = {
  name: string
  race: string
  skinColor: string
  hairStyle: string
  hairColor: string
  cloakColor: string
}

export function characterAppearance(row?: CharacterAppearanceRow | null): CharacterAppearance {
  return {
    name: row?.name?.trim() || 'Аркан',
    race: row?.race || 'human',
    skinColor: row?.skin_color || '#c8a882',
    hairStyle: row?.hair_style || 'a1',
    hairColor: row?.hair_color || '#3d2b1f',
    cloakColor: row?.cloak_color || '#4a1f6e',
  }
}

export type CharacterAvatarProps = Omit<CharacterAppearance, 'name'> & {
  equipment?: Partial<Record<EquipSlot, string>>
  size?: number
}
