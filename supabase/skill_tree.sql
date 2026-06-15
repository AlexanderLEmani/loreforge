-- LoreHeim: дерево способностей
-- Supabase → SQL Editor → вставь ВЕСЬ файл и Run

-- === СХЕМА ===

ALTER TABLE users ADD COLUMN IF NOT EXISTS skill_points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS visited_skills BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS skill_tree_nodes (
  id SERIAL PRIMARY KEY,
  branch TEXT NOT NULL CHECK (branch IN ('add', 'sub', 'mul', 'div', 'frac', 'pct')),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attack', 'defense', 'passive')),
  description TEXT NOT NULL,
  effect JSONB NOT NULL DEFAULT '{}',
  cost INTEGER NOT NULL DEFAULT 1 CHECK (cost >= 0),
  requires INTEGER REFERENCES skill_tree_nodes(id) ON DELETE SET NULL,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT '*'
);

CREATE INDEX IF NOT EXISTS skill_tree_nodes_branch_idx ON skill_tree_nodes(branch);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id INTEGER NOT NULL REFERENCES skill_tree_nodes(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, node_id)
);

CREATE INDEX IF NOT EXISTS user_skills_user_idx ON user_skills(user_id);

-- === СИД: ветка сложения (7 узлов) ===
-- Безопасно перезапускать: не дублирует, если узлы уже есть

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'add', 'Корень сложения', 'passive',
  'Базовый узел ветки. Открывает путь к атакам и защитам сложения.',
  '{"kind":"xp_bonus","value":5,"topic":"add","detail":"+5% XP за задачи на сложение"}'::jsonb,
  0, NULL, 400, 300, '+'
WHERE NOT EXISTS (
  SELECT 1 FROM skill_tree_nodes WHERE branch = 'add' AND name = 'Корень сложения'
);

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'add', 'Удар сложением', 'attack',
  'Правильный ответ на пример с двумя однозначными числами наносит дополнительный урон.',
  '{"kind":"damage_bonus","value":15,"topic":"add","detail":"+15% урона при сложении до 18"}'::jsonb,
  1, p.id, 260, 220, 'A'
FROM skill_tree_nodes p
WHERE p.branch = 'add' AND p.name = 'Корень сложения'
AND NOT EXISTS (
  SELECT 1 FROM skill_tree_nodes WHERE branch = 'add' AND name = 'Удар сложением'
);

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'add', 'Двузначный разряд', 'attack',
  'Усилённая атака для примеров с двузначными числами.',
  '{"kind":"damage_bonus","value":25,"topic":"add","detail":"+25% урона при сложении двузначных"}'::jsonb,
  2, p.id, 160, 140, 'A'
FROM skill_tree_nodes p
WHERE p.branch = 'add' AND p.name = 'Удар сложением'
AND NOT EXISTS (
  SELECT 1 FROM skill_tree_nodes WHERE branch = 'add' AND name = 'Двузначный разряд'
);

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'add', 'Тройной удар', 'attack',
  'Мощный удар при сложении трёх чисел в одном примере.',
  '{"kind":"damage_bonus","value":35,"topic":"add","detail":"+35% урона на тройные суммы"}'::jsonb,
  2, p.id, 80, 60, 'A'
FROM skill_tree_nodes p
WHERE p.branch = 'add' AND p.name = 'Двузначный разряд'
AND NOT EXISTS (
  SELECT 1 FROM skill_tree_nodes WHERE branch = 'add' AND name = 'Тройной удар'
);

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'add', 'Щит суммы', 'defense',
  'Правильный ответ на пример сложения даёт щит, поглощающий следующий удар.',
  '{"kind":"shield","value":1,"topic":"add","detail":"Щит после верного сложения"}'::jsonb,
  1, p.id, 540, 220, 'D'
FROM skill_tree_nodes p
WHERE p.branch = 'add' AND p.name = 'Корень сложения'
AND NOT EXISTS (
  SELECT 1 FROM skill_tree_nodes WHERE branch = 'add' AND name = 'Щит суммы'
);

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'add', 'Стойкость счёта', 'defense',
  'Снижает входящий урон, если последний верный ответ был на сложение.',
  '{"kind":"damage_reduction","value":20,"topic":"add","detail":"-20% урона после верного сложения"}'::jsonb,
  2, p.id, 640, 140, 'D'
FROM skill_tree_nodes p
WHERE p.branch = 'add' AND p.name = 'Щит суммы'
AND NOT EXISTS (
  SELECT 1 FROM skill_tree_nodes WHERE branch = 'add' AND name = 'Стойкость счёта'
);

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'add', 'Мастер прибавления', 'passive',
  'Бонус XP и скидка на свитки сложения в Лавке.',
  '{"kind":"shop_discount","value":10,"topic":"add","detail":"-10% на свитки сложения, +8% XP"}'::jsonb,
  2, p.id, 400, 180, '*'
FROM skill_tree_nodes p
WHERE p.branch = 'add' AND p.name = 'Корень сложения'
AND NOT EXISTS (
  SELECT 1 FROM skill_tree_nodes WHERE branch = 'add' AND name = 'Мастер прибавления'
);

-- Проверка: должно быть 7 строк
-- SELECT id, name, requires FROM skill_tree_nodes WHERE branch = 'add' ORDER BY id;

-- (Опционально) тестовые очки:
-- UPDATE users SET skill_points = 5 WHERE email = 'your@email.com';
