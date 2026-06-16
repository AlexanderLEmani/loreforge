-- Постоянные боевые заклинания + прогресс лекций для лавки
alter table public.users
  add column if not exists learned_spells jsonb not null default '[]'::jsonb;

alter table public.users
  add column if not exists completed_lectures jsonb not null default '[]'::jsonb;

-- Миграция: любой старый запас spell_scrolls → выученное заклинание
update public.users u
set learned_spells = coalesce(
  (
    select jsonb_agg(key order by key)
    from jsonb_each_text(u.spell_scrolls) as e(key, val)
    where val::int > 0
      and key in (
        'scroll_twin_strike',
        'scroll_fireball',
        'scroll_storm_lance',
        'scroll_arcane_burst',
        'scroll_dark_sigil'
      )
  ),
  '[]'::jsonb
)
where learned_spells = '[]'::jsonb
  and spell_scrolls is not null
  and spell_scrolls != '{}'::jsonb;
