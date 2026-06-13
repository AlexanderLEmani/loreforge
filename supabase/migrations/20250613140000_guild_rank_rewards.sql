-- Отслеживание наград рангов гильдии (индекс последнего полученного ранга)
ALTER TABLE users ADD COLUMN IF NOT EXISTS guild_rank_rewards integer NOT NULL DEFAULT 0;
