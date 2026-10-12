# Running CurateShelf

A step-by-step beginner walkthrough lives in [../USAGE.md](../USAGE.md). This page is the condensed
reference.

## Local (recommended for development)

Prerequisites: Python 3.12+, Node 20+, PostgreSQL 16, Redis 7.

```bash
# services (macOS / Homebrew)
brew services start postgresql@16
brew services start redis
createdb curateshelf

# backend: http://127.0.0.1:8000
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # adjust DATABASE_URL user if needed
python manage.py migrate
python manage.py seed_demo    # demo users, products, photos, shelves
python manage.py runserver 127.0.0.1:8000

# frontend: http://localhost:3000 (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

The Celery worker and beat are optional in dev, because tasks run eagerly (see
[../backend/background-jobs.md](../backend/background-jobs.md)).

### Claude Code / desktop preview

`.claude/launch.json` defines `api` (Django :8000), `web` (Next dev :3000) and `web-prod` (`next start`
:3000, run `npm run build` first).

## Docker

```bash
cp backend/.env.example backend/.env
docker compose up --build                     # db, redis, web (gunicorn :8000), worker, beat
docker compose exec web python manage.py migrate
docker compose exec web python manage.py seed_demo
```

Then run the frontend on the host (`cd frontend && npm run dev`). Compose sets `DATABASE_URL`,
`REDIS_URL` and `CELERY_BROKER_URL` to the internal service hosts. Media lives on the shared
`media_data` volume.

## URLs & accounts

| What | URL |
|------|-----|
| Magazine | http://localhost:3000 |
| API root | http://127.0.0.1:8000/api/ |
| Swagger | http://127.0.0.1:8000/api/docs/ |
| Health | http://127.0.0.1:8000/api/health/ |
| Admin | http://127.0.0.1:8000/admin/ |

| Account | Email / password | Notes |
|---------|------------------|-------|
| Admin | `admin@curateshelf.local` / `admin12345` | Superuser |
| Editor | `editor@curateshelf.local` / `editor12345` | Role "editor" |
| Reader | `reader@curateshelf.local` / `reader12345` | Has a love, a curious and a comment |

These are demo credentials. Change them, along with `SECRET_KEY`, before any deployment.

## Production checklist

- `DEBUG=False`, a real `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.
- `CELERY_TASK_ALWAYS_EAGER=False`, and run a worker + beat with access to `MEDIA_ROOT`.
- Serve `/media/` from a web server or object storage (Django only serves it in DEBUG), and add that
  host to `frontend/next.config.ts` `remotePatterns`.
- `python manage.py collectstatic` for the admin.
- `npm run build && npm run start` (or deploy the Next app to a Node host). Set `NEXT_PUBLIC_API_URL`
  and `NEXT_PUBLIC_MEDIA_URL` at **build time**.
- Monitor `GET /api/health/` (returns 503 when DB or Redis is down).

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Feed shows "We couldn't load this issue" | API not running, wrong `NEXT_PUBLIC_API_URL`, or CORS origin missing |
| Images are grey placeholders | Run `seed_demo`. Check the `/media/` URL opens, and that the media host is in `remotePatterns` |
| Swapped a seed photo but the old one shows | Delete `backend/media/` (or that file) and re-run `seed_demo` |
| `pg_ctl` fails with "postmaster became multithreaded during startup" | Start Postgres with a locale: `LC_ALL=en_US.UTF-8 pg_ctl -D /opt/homebrew/var/postgresql@16 start` |
| `/api/health/` returns 503 `redis: false` | Start Redis (`brew services start redis`) |
| Port 8000/3000 in use | `lsof -i :8000` and stop the old process |
| Headings render in a system font | The next/font variables must be on `<html>` (see design-system.md) |
