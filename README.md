# LoreHeim

Математический RPG в браузере: тренировки, данжи, экзамены и гильдия. Next.js + Supabase.

## Требования

- Node.js 20+
- Аккаунт [Supabase](https://supabase.com) (бесплатный тариф достаточен)

## Локальный запуск

1. Клонируй репозиторий и установи зависимости:

```bash
npm install
```

2. Скопируй переменные окружения:

```bash
cp .env.example .env.local
```

3. В [Supabase Dashboard](https://supabase.com/dashboard) создай проект и заполни `.env.local`:

| Переменная | Где найти |
|------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (опционально, для гостевого входа без Google) |
| `DATABASE_URL` | Settings → Database → Connection string (URI) — для `db:apply` |

4. Примени схему БД (миграции из `supabase/migrations/`):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push
```

`db:push` отправляет локальные миграции в связанный Supabase-проект. Если проект уже настроен коллегой, достаточно обновить код и снова выполнить `npm run db:push` после pull.

Дополнительно (если нужно вручную):

```bash
npm run db:apply   # skill tree SQL
npm run db:rls     # RLS для skill tree
npm run questions:seed  # банк вопросов (нужен DATABASE_URL)
```

5. Запусти dev-сервер:

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Деплой (Vercel)

1. Импортируй репозиторий в [Vercel](https://vercel.com).
2. В **Environment Variables** добавь те же `NEXT_PUBLIC_SUPABASE_*` (и при необходимости `SUPABASE_SERVICE_ROLE_KEY`).
3. Deploy. После изменений в `supabase/migrations/` выполни `npm run db:push` локально — Vercel не применяет миграции автоматически.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Миграции Supabase → облако |
| `npm run questions:generate` | Генерация банка вопросов |
| `npm run questions:seed` | Загрузка вопросов в БД |

## CI

На push и PR в `main` GitHub Actions запускает `npm run lint` и `npm run build` (см. `.github/workflows/ci.yml`).
