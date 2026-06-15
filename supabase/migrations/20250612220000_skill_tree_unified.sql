-- LoreHeim: единое древо — позиции и связи между темами (PoE-style spine)

-- ADD (x=100)
UPDATE skill_tree_nodes SET position_x = 100, position_y = 300, requires = NULL
WHERE branch = 'add' AND name = 'Корень сложения';
UPDATE skill_tree_nodes SET position_x = 30, position_y = 220
WHERE branch = 'add' AND name = 'Удар сложением';
UPDATE skill_tree_nodes SET position_x = -10, position_y = 130
WHERE branch = 'add' AND name = 'Двузначный разряд';
UPDATE skill_tree_nodes SET position_x = -50, position_y = 50
WHERE branch = 'add' AND name = 'Тройной удар';
UPDATE skill_tree_nodes SET position_x = 170, position_y = 220
WHERE branch = 'add' AND name = 'Щит суммы';
UPDATE skill_tree_nodes SET position_x = 210, position_y = 130
WHERE branch = 'add' AND name = 'Стойкость счёта';
UPDATE skill_tree_nodes SET position_x = 100, position_y = 180
WHERE branch = 'add' AND name = 'Мастер прибавления';

-- SUB (x=320) — корень требует «Мастер прибавления»
UPDATE skill_tree_nodes AS child SET requires = parent.id, position_x = 320, position_y = 300
FROM skill_tree_nodes AS parent
WHERE child.branch = 'sub' AND child.name = 'Корень вычитания'
AND parent.branch = 'add' AND parent.name = 'Мастер прибавления';
UPDATE skill_tree_nodes SET position_x = 250, position_y = 220
WHERE branch = 'sub' AND name = 'Удар вычитанием';
UPDATE skill_tree_nodes SET position_x = 210, position_y = 130
WHERE branch = 'sub' AND name = 'Двузначная разность';
UPDATE skill_tree_nodes SET position_x = 170, position_y = 50
WHERE branch = 'sub' AND name = 'Тройной вычет';
UPDATE skill_tree_nodes SET position_x = 390, position_y = 220
WHERE branch = 'sub' AND name = 'Щит разности';
UPDATE skill_tree_nodes SET position_x = 430, position_y = 130
WHERE branch = 'sub' AND name = 'Стойкость вычета';
UPDATE skill_tree_nodes SET position_x = 320, position_y = 180
WHERE branch = 'sub' AND name = 'Мастер вычитания';

-- MUL (x=560)
UPDATE skill_tree_nodes AS child SET requires = parent.id, position_x = 560, position_y = 300
FROM skill_tree_nodes AS parent
WHERE child.branch = 'mul' AND child.name = 'Корень умножения'
AND parent.branch = 'sub' AND parent.name = 'Мастер вычитания';
UPDATE skill_tree_nodes SET position_x = 490, position_y = 220
WHERE branch = 'mul' AND name = 'Удар умножением';
UPDATE skill_tree_nodes SET position_x = 450, position_y = 130
WHERE branch = 'mul' AND name = 'Таблица мастер';
UPDATE skill_tree_nodes SET position_x = 410, position_y = 50
WHERE branch = 'mul' AND name = 'Комбо умножения';
UPDATE skill_tree_nodes SET position_x = 630, position_y = 220
WHERE branch = 'mul' AND name = 'Щит произведения';
UPDATE skill_tree_nodes SET position_x = 670, position_y = 130
WHERE branch = 'mul' AND name = 'Стойкость таблицы';
UPDATE skill_tree_nodes SET position_x = 560, position_y = 180
WHERE branch = 'mul' AND name = 'Мастер умножения';

-- DIV (x=800)
UPDATE skill_tree_nodes AS child SET requires = parent.id, position_x = 800, position_y = 300
FROM skill_tree_nodes AS parent
WHERE child.branch = 'div' AND child.name = 'Корень деления'
AND parent.branch = 'mul' AND parent.name = 'Мастер умножения';
UPDATE skill_tree_nodes SET position_x = 730, position_y = 220
WHERE branch = 'div' AND name = 'Удар делением';
UPDATE skill_tree_nodes SET position_x = 690, position_y = 130
WHERE branch = 'div' AND name = 'Крупный делитель';
UPDATE skill_tree_nodes SET position_x = 650, position_y = 50
WHERE branch = 'div' AND name = 'Тройное деление';
UPDATE skill_tree_nodes SET position_x = 870, position_y = 220
WHERE branch = 'div' AND name = 'Щит частного';
UPDATE skill_tree_nodes SET position_x = 910, position_y = 130
WHERE branch = 'div' AND name = 'Стойкость частного';
UPDATE skill_tree_nodes SET position_x = 800, position_y = 180
WHERE branch = 'div' AND name = 'Мастер деления';

-- FRAC (x=1040)
UPDATE skill_tree_nodes AS child SET requires = parent.id, position_x = 1040, position_y = 300
FROM skill_tree_nodes AS parent
WHERE child.branch = 'frac' AND child.name = 'Корень дробей'
AND parent.branch = 'div' AND parent.name = 'Мастер деления';
UPDATE skill_tree_nodes SET position_x = 970, position_y = 220
WHERE branch = 'frac' AND name = 'Удар дробями';
UPDATE skill_tree_nodes SET position_x = 930, position_y = 130
WHERE branch = 'frac' AND name = 'Общий знаменатель';
UPDATE skill_tree_nodes SET position_x = 890, position_y = 50
WHERE branch = 'frac' AND name = 'Смешанные числа';
UPDATE skill_tree_nodes SET position_x = 1090, position_y = 220
WHERE branch = 'frac' AND name = 'Щит дроби';
UPDATE skill_tree_nodes SET position_x = 1130, position_y = 130
WHERE branch = 'frac' AND name = 'Стойкость частей';
UPDATE skill_tree_nodes SET position_x = 1040, position_y = 180
WHERE branch = 'frac' AND name = 'Мастер дробей';

-- PCT (x=1280)
UPDATE skill_tree_nodes AS child SET requires = parent.id, position_x = 1280, position_y = 300
FROM skill_tree_nodes AS parent
WHERE child.branch = 'pct' AND child.name = 'Корень процентов'
AND parent.branch = 'frac' AND parent.name = 'Мастер дробей';
UPDATE skill_tree_nodes SET position_x = 1210, position_y = 220
WHERE branch = 'pct' AND name = 'Удар процентов';
UPDATE skill_tree_nodes SET position_x = 1170, position_y = 130
WHERE branch = 'pct' AND name = 'Скидка и наценка';
UPDATE skill_tree_nodes SET position_x = 1130, position_y = 50
WHERE branch = 'pct' AND name = 'Пропорции';
UPDATE skill_tree_nodes SET position_x = 1350, position_y = 220
WHERE branch = 'pct' AND name = 'Щит процента';
UPDATE skill_tree_nodes SET position_x = 1390, position_y = 130
WHERE branch = 'pct' AND name = 'Стойкость пропорции';
UPDATE skill_tree_nodes SET position_x = 1280, position_y = 180
WHERE branch = 'pct' AND name = 'Мастер процентов';

-- Внутренние requires внутри веток (по именам, если слетели)
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'add' AND child.name = 'Удар сложением' AND parent.branch = 'add' AND parent.name = 'Корень сложения';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'add' AND child.name = 'Двузначный разряд' AND parent.branch = 'add' AND parent.name = 'Удар сложением';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'add' AND child.name = 'Тройной удар' AND parent.branch = 'add' AND parent.name = 'Двузначный разряд';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'add' AND child.name = 'Щит суммы' AND parent.branch = 'add' AND parent.name = 'Корень сложения';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'add' AND child.name = 'Стойкость счёта' AND parent.branch = 'add' AND parent.name = 'Щит суммы';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'add' AND child.name = 'Мастер прибавления' AND parent.branch = 'add' AND parent.name = 'Корень сложения';

UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'sub' AND child.name = 'Удар вычитанием' AND parent.branch = 'sub' AND parent.name = 'Корень вычитания';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'sub' AND child.name = 'Двузначная разность' AND parent.branch = 'sub' AND parent.name = 'Удар вычитанием';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'sub' AND child.name = 'Тройной вычет' AND parent.branch = 'sub' AND parent.name = 'Двузначная разность';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'sub' AND child.name = 'Щит разности' AND parent.branch = 'sub' AND parent.name = 'Корень вычитания';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'sub' AND child.name = 'Стойкость вычета' AND parent.branch = 'sub' AND parent.name = 'Щит разности';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'sub' AND child.name = 'Мастер вычитания' AND parent.branch = 'sub' AND parent.name = 'Корень вычитания';

UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'mul' AND child.name = 'Удар умножением' AND parent.branch = 'mul' AND parent.name = 'Корень умножения';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'mul' AND child.name = 'Таблица мастер' AND parent.branch = 'mul' AND parent.name = 'Удар умножением';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'mul' AND child.name = 'Комбо умножения' AND parent.branch = 'mul' AND parent.name = 'Таблица мастер';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'mul' AND child.name = 'Щит произведения' AND parent.branch = 'mul' AND parent.name = 'Корень умножения';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'mul' AND child.name = 'Стойкость таблицы' AND parent.branch = 'mul' AND parent.name = 'Щит произведения';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'mul' AND child.name = 'Мастер умножения' AND parent.branch = 'mul' AND parent.name = 'Корень умножения';

UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'div' AND child.name = 'Удар делением' AND parent.branch = 'div' AND parent.name = 'Корень деления';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'div' AND child.name = 'Крупный делитель' AND parent.branch = 'div' AND parent.name = 'Удар делением';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'div' AND child.name = 'Тройное деление' AND parent.branch = 'div' AND parent.name = 'Крупный делитель';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'div' AND child.name = 'Щит частного' AND parent.branch = 'div' AND parent.name = 'Корень деления';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'div' AND child.name = 'Стойкость частного' AND parent.branch = 'div' AND parent.name = 'Щит частного';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'div' AND child.name = 'Мастер деления' AND parent.branch = 'div' AND parent.name = 'Корень деления';

UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'frac' AND child.name = 'Удар дробями' AND parent.branch = 'frac' AND parent.name = 'Корень дробей';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'frac' AND child.name = 'Общий знаменатель' AND parent.branch = 'frac' AND parent.name = 'Удар дробями';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'frac' AND child.name = 'Смешанные числа' AND parent.branch = 'frac' AND parent.name = 'Общий знаменатель';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'frac' AND child.name = 'Щит дроби' AND parent.branch = 'frac' AND parent.name = 'Корень дробей';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'frac' AND child.name = 'Стойкость частей' AND parent.branch = 'frac' AND parent.name = 'Щит дроби';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'frac' AND child.name = 'Мастер дробей' AND parent.branch = 'frac' AND parent.name = 'Корень дробей';

UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'pct' AND child.name = 'Удар процентов' AND parent.branch = 'pct' AND parent.name = 'Корень процентов';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'pct' AND child.name = 'Скидка и наценка' AND parent.branch = 'pct' AND parent.name = 'Удар процентов';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'pct' AND child.name = 'Пропорции' AND parent.branch = 'pct' AND parent.name = 'Скидка и наценка';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'pct' AND child.name = 'Щит процента' AND parent.branch = 'pct' AND parent.name = 'Корень процентов';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'pct' AND child.name = 'Стойкость пропорции' AND parent.branch = 'pct' AND parent.name = 'Щит процента';
UPDATE skill_tree_nodes AS child SET requires = parent.id
FROM skill_tree_nodes AS parent
WHERE child.branch = 'pct' AND child.name = 'Мастер процентов' AND parent.branch = 'pct' AND parent.name = 'Корень процентов';
