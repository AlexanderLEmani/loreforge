-- LoreForge: полные ветки дерева (вычитание, умножение, деление, дроби, проценты)

-- SUB
INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'sub', 'Корень вычитания', 'passive',
  'Базовый узел ветки вычитание. Открывает атаки и защиты.',
  '{"kind":"xp_bonus","value":5,"topic":"sub","detail":"+5% XP за задачи на вычитание"}'::jsonb,
  0, NULL, 400, 300, '-'
WHERE NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'sub' AND name = 'Корень вычитания');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'sub', 'Удар вычитанием', 'attack',
  'Правильный ответ на простой пример вычитание наносит дополнительный урон.',
  '{"kind":"damage_bonus","value":15,"topic":"sub","detail":"+15% урона в теме «вычитание»"}'::jsonb,
  1, p.id, 260, 220, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'sub' AND p.name = 'Корень вычитания'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'sub' AND name = 'Удар вычитанием');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'sub', 'Двузначная разность', 'attack',
  'Усилённая атака для средних примеров вычитание.',
  '{"kind":"damage_bonus","value":25,"topic":"sub","detail":"+25% урона на средних примерах"}'::jsonb,
  2, p.id, 160, 140, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'sub' AND p.name = 'Удар вычитанием'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'sub' AND name = 'Двузначная разность');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'sub', 'Тройной вычет', 'attack',
  'Мощный удар на сложных примерах вычитание.',
  '{"kind":"damage_bonus","value":35,"topic":"sub","detail":"+35% урона на сложных примерах"}'::jsonb,
  2, p.id, 80, 60, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'sub' AND p.name = 'Двузначная разность'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'sub' AND name = 'Тройной вычет');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'sub', 'Щит разности', 'defense',
  'Верный ответ на вычитание даёт щит от следующего удара монстра.',
  '{"kind":"shield","value":1,"topic":"sub","detail":"Щит после верного ответа"}'::jsonb,
  1, p.id, 540, 220, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'sub' AND p.name = 'Корень вычитания'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'sub' AND name = 'Щит разности');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'sub', 'Стойкость вычета', 'defense',
  'Снижает входящий урон после верного ответа на вычитание.',
  '{"kind":"damage_reduction","value":20,"topic":"sub","detail":"-20% входящего урона"}'::jsonb,
  2, p.id, 640, 140, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'sub' AND p.name = 'Щит разности'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'sub' AND name = 'Стойкость вычета');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'sub', 'Мастер вычитания', 'passive',
  'Постоянный бонус ветки вычитание.',
  '{"kind":"xp_bonus","value":8,"topic":"sub","detail":"+8% XP в теме «вычитание»"}'::jsonb,
  2, p.id, 400, 180, '*'
FROM skill_tree_nodes p WHERE p.branch = 'sub' AND p.name = 'Корень вычитания'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'sub' AND name = 'Мастер вычитания');

-- MUL
INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'mul', 'Корень умножения', 'passive',
  'Базовый узел ветки умножение. Открывает атаки и защиты.',
  '{"kind":"xp_bonus","value":5,"topic":"mul","detail":"+5% XP за задачи на умножение"}'::jsonb,
  0, NULL, 400, 300, 'x'
WHERE NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'mul' AND name = 'Корень умножения');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'mul', 'Удар умножением', 'attack',
  'Правильный ответ на простой пример умножение наносит дополнительный урон.',
  '{"kind":"damage_bonus","value":15,"topic":"mul","detail":"+15% урона в теме «умножение»"}'::jsonb,
  1, p.id, 260, 220, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'mul' AND p.name = 'Корень умножения'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'mul' AND name = 'Удар умножением');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'mul', 'Таблица мастер', 'attack',
  'Усилённая атака для средних примеров умножение.',
  '{"kind":"damage_bonus","value":25,"topic":"mul","detail":"+25% урона на средних примерах"}'::jsonb,
  2, p.id, 160, 140, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'mul' AND p.name = 'Удар умножением'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'mul' AND name = 'Таблица мастер');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'mul', 'Комбо умножения', 'attack',
  'Мощный удар на сложных примерах умножение.',
  '{"kind":"damage_bonus","value":35,"topic":"mul","detail":"+35% урона на сложных примерах"}'::jsonb,
  2, p.id, 80, 60, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'mul' AND p.name = 'Таблица мастер'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'mul' AND name = 'Комбо умножения');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'mul', 'Щит произведения', 'defense',
  'Верный ответ на умножение даёт щит от следующего удара монстра.',
  '{"kind":"shield","value":1,"topic":"mul","detail":"Щит после верного ответа"}'::jsonb,
  1, p.id, 540, 220, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'mul' AND p.name = 'Корень умножения'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'mul' AND name = 'Щит произведения');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'mul', 'Стойкость таблицы', 'defense',
  'Снижает входящий урон после верного ответа на умножение.',
  '{"kind":"damage_reduction","value":20,"topic":"mul","detail":"-20% входящего урона"}'::jsonb,
  2, p.id, 640, 140, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'mul' AND p.name = 'Щит произведения'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'mul' AND name = 'Стойкость таблицы');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'mul', 'Мастер умножения', 'passive',
  'Постоянный бонус ветки умножение.',
  '{"kind":"xp_bonus","value":8,"topic":"mul","detail":"+8% XP в теме «умножение»"}'::jsonb,
  2, p.id, 400, 180, '*'
FROM skill_tree_nodes p WHERE p.branch = 'mul' AND p.name = 'Корень умножения'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'mul' AND name = 'Мастер умножения');

-- DIV
INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'div', 'Корень деления', 'passive',
  'Базовый узел ветки деление. Открывает атаки и защиты.',
  '{"kind":"xp_bonus","value":5,"topic":"div","detail":"+5% XP за задачи на деление"}'::jsonb,
  0, NULL, 400, 300, '/'
WHERE NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'div' AND name = 'Корень деления');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'div', 'Удар делением', 'attack',
  'Правильный ответ на простой пример деление наносит дополнительный урон.',
  '{"kind":"damage_bonus","value":15,"topic":"div","detail":"+15% урона в теме «деление»"}'::jsonb,
  1, p.id, 260, 220, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'div' AND p.name = 'Корень деления'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'div' AND name = 'Удар делением');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'div', 'Крупный делитель', 'attack',
  'Усилённая атака для средних примеров деление.',
  '{"kind":"damage_bonus","value":25,"topic":"div","detail":"+25% урона на средних примерах"}'::jsonb,
  2, p.id, 160, 140, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'div' AND p.name = 'Удар делением'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'div' AND name = 'Крупный делитель');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'div', 'Тройное деление', 'attack',
  'Мощный удар на сложных примерах деление.',
  '{"kind":"damage_bonus","value":35,"topic":"div","detail":"+35% урона на сложных примерах"}'::jsonb,
  2, p.id, 80, 60, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'div' AND p.name = 'Крупный делитель'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'div' AND name = 'Тройное деление');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'div', 'Щит частного', 'defense',
  'Верный ответ на деление даёт щит от следующего удара монстра.',
  '{"kind":"shield","value":1,"topic":"div","detail":"Щит после верного ответа"}'::jsonb,
  1, p.id, 540, 220, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'div' AND p.name = 'Корень деления'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'div' AND name = 'Щит частного');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'div', 'Стойкость частного', 'defense',
  'Снижает входящий урон после верного ответа на деление.',
  '{"kind":"damage_reduction","value":20,"topic":"div","detail":"-20% входящего урона"}'::jsonb,
  2, p.id, 640, 140, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'div' AND p.name = 'Щит частного'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'div' AND name = 'Стойкость частного');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'div', 'Мастер деления', 'passive',
  'Постоянный бонус ветки деление.',
  '{"kind":"xp_bonus","value":8,"topic":"div","detail":"+8% XP в теме «деление»"}'::jsonb,
  2, p.id, 400, 180, '*'
FROM skill_tree_nodes p WHERE p.branch = 'div' AND p.name = 'Корень деления'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'div' AND name = 'Мастер деления');

-- FRAC
INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'frac', 'Корень дробей', 'passive',
  'Базовый узел ветки дроби. Открывает атаки и защиты.',
  '{"kind":"xp_bonus","value":5,"topic":"frac","detail":"+5% XP за задачи на дроби"}'::jsonb,
  0, NULL, 400, 300, '1/2'
WHERE NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'frac' AND name = 'Корень дробей');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'frac', 'Удар дробями', 'attack',
  'Правильный ответ на простой пример дроби наносит дополнительный урон.',
  '{"kind":"damage_bonus","value":15,"topic":"frac","detail":"+15% урона в теме «дроби»"}'::jsonb,
  1, p.id, 260, 220, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'frac' AND p.name = 'Корень дробей'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'frac' AND name = 'Удар дробями');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'frac', 'Общий знаменатель', 'attack',
  'Усилённая атака для средних примеров дроби.',
  '{"kind":"damage_bonus","value":25,"topic":"frac","detail":"+25% урона на средних примерах"}'::jsonb,
  2, p.id, 160, 140, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'frac' AND p.name = 'Удар дробями'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'frac' AND name = 'Общий знаменатель');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'frac', 'Смешанные числа', 'attack',
  'Мощный удар на сложных примерах дроби.',
  '{"kind":"damage_bonus","value":35,"topic":"frac","detail":"+35% урона на сложных примерах"}'::jsonb,
  2, p.id, 80, 60, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'frac' AND p.name = 'Общий знаменатель'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'frac' AND name = 'Смешанные числа');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'frac', 'Щит дроби', 'defense',
  'Верный ответ на дроби даёт щит от следующего удара монстра.',
  '{"kind":"shield","value":1,"topic":"frac","detail":"Щит после верного ответа"}'::jsonb,
  1, p.id, 540, 220, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'frac' AND p.name = 'Корень дробей'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'frac' AND name = 'Щит дроби');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'frac', 'Стойкость частей', 'defense',
  'Снижает входящий урон после верного ответа на дроби.',
  '{"kind":"damage_reduction","value":20,"topic":"frac","detail":"-20% входящего урона"}'::jsonb,
  2, p.id, 640, 140, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'frac' AND p.name = 'Щит дроби'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'frac' AND name = 'Стойкость частей');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'frac', 'Мастер дробей', 'passive',
  'Постоянный бонус ветки дроби.',
  '{"kind":"xp_bonus","value":8,"topic":"frac","detail":"+8% XP в теме «дроби»"}'::jsonb,
  2, p.id, 400, 180, '*'
FROM skill_tree_nodes p WHERE p.branch = 'frac' AND p.name = 'Корень дробей'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'frac' AND name = 'Мастер дробей');

-- PCT
INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'pct', 'Корень процентов', 'passive',
  'Базовый узел ветки проценты. Открывает атаки и защиты.',
  '{"kind":"xp_bonus","value":5,"topic":"pct","detail":"+5% XP за задачи на проценты"}'::jsonb,
  0, NULL, 400, 300, '%'
WHERE NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'pct' AND name = 'Корень процентов');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'pct', 'Удар процентов', 'attack',
  'Правильный ответ на простой пример проценты наносит дополнительный урон.',
  '{"kind":"damage_bonus","value":15,"topic":"pct","detail":"+15% урона в теме «проценты»"}'::jsonb,
  1, p.id, 260, 220, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'pct' AND p.name = 'Корень процентов'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'pct' AND name = 'Удар процентов');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'pct', 'Скидка и наценка', 'attack',
  'Усилённая атака для средних примеров проценты.',
  '{"kind":"damage_bonus","value":25,"topic":"pct","detail":"+25% урона на средних примерах"}'::jsonb,
  2, p.id, 160, 140, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'pct' AND p.name = 'Удар процентов'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'pct' AND name = 'Скидка и наценка');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'pct', 'Пропорции', 'attack',
  'Мощный удар на сложных примерах проценты.',
  '{"kind":"damage_bonus","value":35,"topic":"pct","detail":"+35% урона на сложных примерах"}'::jsonb,
  2, p.id, 80, 60, 'A'
FROM skill_tree_nodes p WHERE p.branch = 'pct' AND p.name = 'Скидка и наценка'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'pct' AND name = 'Пропорции');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'pct', 'Щит процента', 'defense',
  'Верный ответ на проценты даёт щит от следующего удара монстра.',
  '{"kind":"shield","value":1,"topic":"pct","detail":"Щит после верного ответа"}'::jsonb,
  1, p.id, 540, 220, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'pct' AND p.name = 'Корень процентов'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'pct' AND name = 'Щит процента');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'pct', 'Стойкость пропорции', 'defense',
  'Снижает входящий урон после верного ответа на проценты.',
  '{"kind":"damage_reduction","value":20,"topic":"pct","detail":"-20% входящего урона"}'::jsonb,
  2, p.id, 640, 140, 'D'
FROM skill_tree_nodes p WHERE p.branch = 'pct' AND p.name = 'Щит процента'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'pct' AND name = 'Стойкость пропорции');

INSERT INTO skill_tree_nodes (branch, name, type, description, effect, cost, requires, position_x, position_y, icon)
SELECT 'pct', 'Мастер процентов', 'passive',
  'Постоянный бонус ветки проценты.',
  '{"kind":"xp_bonus","value":8,"topic":"pct","detail":"+8% XP в теме «проценты»"}'::jsonb,
  2, p.id, 400, 180, '*'
FROM skill_tree_nodes p WHERE p.branch = 'pct' AND p.name = 'Корень процентов'
AND NOT EXISTS (SELECT 1 FROM skill_tree_nodes WHERE branch = 'pct' AND name = 'Мастер процентов');
