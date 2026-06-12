-- MVP: отслеживание убийств заклинаниями
ALTER TABLE users ADD COLUMN IF NOT EXISTS spell_kills INTEGER NOT NULL DEFAULT 0;
