-- Победы против чемпионов данжа (квест гильдии + история)
ALTER TABLE dungeon_runs
  ADD COLUMN IF NOT EXISTS was_champion boolean NOT NULL DEFAULT false;
