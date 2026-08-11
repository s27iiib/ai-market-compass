# Aurum backend

FastAPI service. Talks to Supabase Postgres.

## Setup

```bash
cp .env.example .env   # fill in DATABASE_URL from Supabase
uv sync
```

## Run

```bash
uv run uvicorn app.main:app --reload --port 8000
```

`/health` works immediately. `/assets` and `/assets/{slug}` need `DATABASE_URL`
set — on first successful connection the `assets` table is created and seeded
automatically from `app/db/seed.py`.

## Structure

```
app/
  main.py        FastAPI app, CORS, startup (create tables + seed)
  core/config.py Settings (pydantic-settings, reads .env)
  db/            Engine/session, declarative Base, seed data
  models/        SQLAlchemy ORM models
  schemas/       Pydantic response models (camelCase, mirrors frontend types)
  api/routes/    Route handlers
```
