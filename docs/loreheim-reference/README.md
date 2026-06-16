# LoreHeim — справочник (CSV)

Файлы в формате **CSV (UTF-8 BOM)** — открываются в Excel, Google Sheets, Numbers.

## Файлы

| Файл | Содержимое |
|------|------------|
| `enemies.csv` | Все враги: статы, слабости, поведение, чемпионы |
| `enemy-mechanics.csv` | Механики боя, отряды, намерения чемпионов |
| `loot-pools.csv` | Шансы и веса дропа по данжам |
| `equipment.csv` | 15 предметов снаряжения |
| `technique-scrolls.csv` | 26 свитков техники (Гримуар) |
| `consumables-and-spells.csv` | Расходники + боевые заклинания |
| `battle-rewards.csv` | Золото, XP, слава за бой |

## Как открыть

**Excel (Mac/Win):** двойной клик по `.csv` — кириллица должна отображаться корректно (BOM).

**Google Sheets:** Файл → Импорт → Загрузить → разделитель «Запятая».

**Скачать архивом:** в терминале из корня репозитория:
```bash
zip -j loreheim-reference.zip docs/loreheim-reference/*.csv
```

Источник данных: код в `lib/battle-config.ts`, `lib/monster-mechanics.ts`, `lib/battle-squad.ts`, `lib/dungeon-loot.ts`, `lib/equipment.ts`.
