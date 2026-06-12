-- Снаряжение персонажа
ALTER TABLE characters ADD COLUMN IF NOT EXISTS equipment JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS user_equipment (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS user_equipment_user_idx ON user_equipment(user_id);
