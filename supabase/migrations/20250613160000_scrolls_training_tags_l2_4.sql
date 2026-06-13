-- Теги тренировки для свитков уровней II–IV
UPDATE scrolls SET training_tag = 'mul_table_low' WHERE level = 2 AND title = 'Таблица 2–5';
UPDATE scrolls SET training_tag = 'mul_table_high' WHERE level = 2 AND title = 'Таблица 6–10';
UPDATE scrolls SET training_tag = 'mul_two_digit' WHERE level = 2 AND title = 'Двузначное умножение';
UPDATE scrolls SET training_tag = 'div_exact' WHERE level = 2 AND title = 'Деление без остатка';
UPDATE scrolls SET training_tag = 'div_tens' WHERE level = 2 AND title = 'Деление десятками';
UPDATE scrolls SET training_tag = 'mul_div_pair' WHERE level = 2 AND title = 'Связь × и ÷';
UPDATE scrolls SET training_tag = 'div_chain' WHERE level = 2 AND title = 'Цепочка с делением';

UPDATE scrolls SET training_tag = 'frac_lcd' WHERE level = 3 AND title = 'Общий знаменатель';
UPDATE scrolls SET training_tag = 'frac_add' WHERE level = 3 AND title = 'Сложение дробей';
UPDATE scrolls SET training_tag = 'frac_sub' WHERE level = 3 AND title = 'Вычитание дробей';
UPDATE scrolls SET training_tag = 'frac_mul' WHERE level = 3 AND title = 'Умножение дробей';
UPDATE scrolls SET training_tag = 'frac_div' WHERE level = 3 AND title = 'Деление дробей';
UPDATE scrolls SET training_tag = 'frac_mixed' WHERE level = 3 AND title = 'Смешанные числа';

UPDATE scrolls SET training_tag = 'pct_of' WHERE level = 4 AND title = 'Процент от числа';
UPDATE scrolls SET training_tag = 'pct_discount' WHERE level = 4 AND title = 'Скидка';
UPDATE scrolls SET training_tag = 'pct_markup' WHERE level = 4 AND title = 'Наценка';
UPDATE scrolls SET training_tag = 'pct_share' WHERE level = 4 AND title = 'Пропорции';
UPDATE scrolls SET training_tag = 'pct_find_whole' WHERE level = 4 AND title = 'Найти целое';
