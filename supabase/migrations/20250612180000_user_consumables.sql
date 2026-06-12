-- Расходники для боя (отдельно от свитков в гримуаре)
alter table users
  add column if not exists consumables jsonb not null
  default '{"hint":0,"power":0,"shield":0}'::jsonb;
