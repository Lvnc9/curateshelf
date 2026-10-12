# Backend overview

Django 5 + Django REST Framework, PostgreSQL, Redis, Celery. Code lives in `backend/`.

## Layout

```
backend/
├── config/
│   ├── settings.py      # all settings, read from env (python-dotenv loads backend/.env)
│   ├── urls.py          # mounts every app under /api/, plus /admin/, /api/docs/
│   ├── celery.py        # Celery app + beat schedule
│   ├── wsgi.py / asgi.py
├── apps/
│   ├── core/            # /api/health/
│   ├── users/           # User, Profile, register, /me, public profiles, JWT view
│   ├── catalog/         # Product & friends, feed, search, staff API, seed_demo
│   ├── engagement/      # Attitudes, comments, likes, bookmarks, moderation
│   ├── editorial/       # Shelves (collections)
│   └── notifications/   # Notifications, reply email, weekly digest
├── seed_media/          # curated demo photos + CREDITS.md
├── requirements.txt
└── Dockerfile
```

Every app follows the same shape: `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`
(Unfold `ModelAdmin`), `tasks.py` (Celery), and `signals.py` where needed (wired in `apps.py → ready()`).

## URL map

| Prefix | Source | Notes |
|--------|--------|-------|
| `/admin/` | Django admin (Unfold theme) | Staff only |
| `/api/health/` | `apps.core.urls` | DB + Redis probe |
| `/api/schema/`, `/api/docs/` | drf-spectacular | OpenAPI 3 + Swagger UI |
| `/api/auth/token/`, `/api/auth/token/refresh/` | `config/urls.py` | JWT obtain (email + password) / refresh |
| `/api/` | users, catalog, engagement, editorial, notifications | See each app's doc |
| `/media/` | `static()` helper | Served by Django **only when `DEBUG=True`** |

## Settings and environment variables

`backend/.env` is loaded by `python-dotenv`. Copy `backend/.env.example` to start.

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEBUG` | `True` | Also flips the default of `CELERY_TASK_ALWAYS_EAGER` |
| `SECRET_KEY` | `dev-insecure-key` | **Must** be set in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated |
| `DATABASE_URL` | `postgres://samlv@localhost:5432/curateshelf` | Parsed with `urlparse`. Postgres only (search uses `django.contrib.postgres`) |
| `REDIS_URL` | `redis://localhost:6379/0` | Django cache + Celery result backend |
| `CELERY_BROKER_URL` | `REDIS_URL` | Celery broker |
| `CELERY_TASK_ALWAYS_EAGER` | `True` if `DEBUG` | Run tasks inline (no worker needed) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Frontend origin(s), comma-separated |
| `EMAIL_BACKEND` | console backend | Emails print to the runserver terminal in dev |
| `DEFAULT_FROM_EMAIL` | `CurateShelf <noreply@curateshelf.local>` | |
| `FRONTEND_URL` | `http://localhost:3000` | Used for links inside emails |
| `MEDIA_ROOT` | `media` (relative to `backend/`) | Uploaded and generated images |

## API conventions

- **Auth:** `Authorization: Bearer <access token>` (SimpleJWT). See [authentication.md](authentication.md).
- **Default permission:** `IsAuthenticatedOrReadOnly`. Reads are public, writes need a user. Views
  override this where needed (`AllowAny` for the feed and catalogue, `IsAdminUser` for `staff/*`).
- **Pagination:** `PageNumberPagination`, 20 per page, returning `{count, next, previous, results}`.
  Some list endpoints switch it off (`pagination_class = None`): the feed, categories, tags and shelves.
  The frontend's `api.ts` accepts both shapes.
- **Filtering / search / ordering:** `django-filter`, DRF `SearchFilter` and `OrderingFilter` are global
  backends. Product search uses Postgres full-text search via `?q=`.
- **Lookups:** public resources are addressed by **slug** (`/products/<slug>/`, `/shelves/<slug>/`,
  `/users/<username>/`).
- **Errors:** standard DRF JSON (`{"detail": "..."}` or `{"field": ["message"]}`).

## Admin

`django-unfold` gives the admin a modern skin (`UNFOLD` settings in `settings.py`). Each app registers its
models. Notable admin features:

- **Products:** fieldsets for content, taxonomy, pricing and schedule, inline media and attributes, and
  the actions *Publish now* and *Regenerate image variants*.
- **Comments:** list filters for hidden/flagged, plus *hide* / *unhide* actions.
- **Collections:** inline ordered items.

## Health check

`GET /api/health/` (`apps/core/urls.py`) opens a DB connection and round-trips a Redis cache key.

```json
{ "status": "ok", "db": true, "redis": true }
```

It returns **200** when both are up and **503** (`"degraded"`) otherwise, which makes it suitable for
load-balancer or Docker health probes.
