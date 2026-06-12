-- Отслеживание полученных наград квестов (дейлики хаба + квесты гильдии)
ALTER TABLE users ADD COLUMN IF NOT EXISTS quest_claims JSONB NOT NULL DEFAULT '{}';
