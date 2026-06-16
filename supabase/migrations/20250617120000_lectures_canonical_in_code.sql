-- Канон лекций I–IV живёт только в lib/lectures/*.json (Next.js bundle).
-- Строки в public.lectures игнорируются приложением и только путают при ручном SQL.
DELETE FROM lectures WHERE level IN (1, 2, 3, 4);

COMMENT ON TABLE lectures IS 'Legacy/CMS. UI коллегии читает lib/lectures/*.json, не эту таблицу.';
