-- Старые строки lectures подменяли актуальный текст из кода.
-- Коллегия читает FALLBACK из lib/college-lectures.ts; таблица — только для CMS с meta.revision = 2.
DELETE FROM lectures WHERE level IN (1, 2, 3, 4);
