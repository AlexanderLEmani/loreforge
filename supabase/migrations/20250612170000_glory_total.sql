-- Суммарная репутация для рангов (не уменьшается при покупке данжей)
ALTER TABLE users ADD COLUMN IF NOT EXISTS glory_total INTEGER NOT NULL DEFAULT 0;

UPDATE users SET glory_total = GREATEST(glory_total, glory) WHERE glory_total < glory;
