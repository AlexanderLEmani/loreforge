alter table public.users
  add column if not exists spell_scrolls jsonb not null
  default '{"scroll_twin_strike":0,"scroll_fireball":0,"scroll_storm_lance":0,"scroll_arcane_burst":0,"scroll_dark_sigil":0}'::jsonb;
