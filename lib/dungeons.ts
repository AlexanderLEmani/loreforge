/** Стабильные id данжей (URL, логика). dbName — ключ в questions / dungeon_runs. */
export type DungeonId = 'add' | 'sub' | 'mul' | 'div' | 'frac' | 'market'

export type DungeonRegistryEntry = {
  id: DungeonId
  dbName: string
  topic: string
}

export const DUNGEON_REGISTRY: DungeonRegistryEntry[] = [
  { id: 'add', dbName: 'Пещера сложения', topic: 'add' },
  { id: 'sub', dbName: 'Пещера вычитания', topic: 'sub' },
  { id: 'mul', dbName: 'Башня умножения', topic: 'mul' },
  { id: 'div', dbName: 'Пещера деления', topic: 'div' },
  { id: 'frac', dbName: 'Храм дробей', topic: 'frac' },
  { id: 'market', dbName: 'Рынок процентов', topic: 'pct' },
]

const DB_NAME_TO_ID = Object.fromEntries(DUNGEON_REGISTRY.map(d => [d.dbName, d.id])) as Record<string, DungeonId>

export function dungeonRegistryById(id: string): DungeonRegistryEntry | undefined {
  return DUNGEON_REGISTRY.find(d => d.id === id)
}

/** URL `?dungeon=add` или legacy русское имя → запись реестра. */
export function resolveDungeonParam(param: string | null | undefined): DungeonRegistryEntry {
  if (!param) return dungeonRegistryById('add')!
  const byId = dungeonRegistryById(param)
  if (byId) return byId
  const legacyId = DB_NAME_TO_ID[param]
  if (legacyId) return dungeonRegistryById(legacyId)!
  return dungeonRegistryById('add')!
}

export function dungeonIdFromRef(ref: string | null | undefined): DungeonId {
  return resolveDungeonParam(ref).id
}

export function dungeonDbNameFromRef(ref: string | null | undefined): string {
  return resolveDungeonParam(ref).dbName
}

export function allDungeonDbNames(): string[] {
  return DUNGEON_REGISTRY.map(d => d.dbName)
}

export function topicFromDbName(dbName: string | null | undefined): string | null {
  if (!dbName) return null
  const entry = DUNGEON_REGISTRY.find(d => d.dbName === dbName)
  if (entry) return entry.topic
  const id = DB_NAME_TO_ID[dbName]
  return id ? dungeonRegistryById(id)!.topic : null
}
