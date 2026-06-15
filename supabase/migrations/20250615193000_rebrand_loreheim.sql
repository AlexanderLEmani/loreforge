-- LoreHeim: обновить текст лекций, где осталось старое название
UPDATE lectures
SET
  title = replace(title, 'LoreForge', 'LoreHeim'),
  sections = replace(sections::text, 'LoreForge', 'LoreHeim')::jsonb
WHERE title LIKE '%LoreForge%'
   OR sections::text LIKE '%LoreForge%';
