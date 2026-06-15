import { DUNGEON_REGISTRY } from '@/lib/dungeons'

/** Тема математики для каждого данжа — без зависимости от battle-config (избегаем циклических импортов). */
export const DUNGEON_TO_TOPIC: Record<string, string> = Object.fromEntries(
  DUNGEON_REGISTRY.map(d => [d.dbName, d.topic]),
)
