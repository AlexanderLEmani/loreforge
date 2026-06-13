-- Дневная практика: секунды в тренировке / бою / экзамене (стрик только после цели)
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_study_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_study_date TEXT;
