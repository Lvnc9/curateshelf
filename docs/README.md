# CurateShelf documentation

Technical docs for every part of CurateShelf. For a hands-on setup walkthrough, start with
[USAGE.md](USAGE.md). For the product pitch, see the [root README](../README.md).

## Map

| Area | Document | What it covers |
|------|----------|----------------|
| **Architecture** | [architecture.md](architecture.md) | Processes, request flow, data model, how the pieces talk |
| **Backend** | [backend/overview.md](backend/overview.md) | Django project layout, settings, env vars, API conventions, health check |
| | [backend/authentication.md](backend/authentication.md) | Users, profiles, JWT sign-in/refresh, permissions, frontend session |
| | [backend/catalog.md](backend/catalog.md) | Products, categories, tags, media, search, feed, staff API |
| | [backend/engagement.md](backend/engagement.md) | Attitudes (Love / Curious / Skip), comments, likes, moderation |
| | [backend/editorial.md](backend/editorial.md) | Shelves (collections) |
| | [backend/notifications.md](backend/notifications.md) | In-app notifications, reply emails, weekly digest |
| | [backend/background-jobs.md](backend/background-jobs.md) | Celery worker and beat, every task and schedule |
| | [backend/media-and-seed.md](backend/media-and-seed.md) | Image pipeline, `seed_demo`, the curated photo set |
| **Frontend** | [frontend/overview.md](frontend/overview.md) | Next.js app structure, routes, data layer, state |
| | [frontend/design-system.md](frontend/design-system.md) | Tokens, typography, motion, shared UI components |
| | [frontend/feed.md](frontend/feed.md) | The magazine feed: cover, story slides, issue rail, deep links |
| | [frontend/pages.md](frontend/pages.md) | Product, Explore, Shelves, Profile, Sign in / Register, Settings |
| **Operations** | [operations/running.md](operations/running.md) | Running locally and with Docker, ports, troubleshooting |
| | [operations/testing.md](operations/testing.md) | Backend tests, frontend checks, manual QA checklist |
| **Decisions** | [adr/](adr/) | Architecture Decision Records |

## Conventions used in these docs

- Paths are relative to the repository root (`backend/apps/catalog/models.py`).
- API paths are relative to the API base, `http://127.0.0.1:8000/api` in development.
- The live, always-current API reference is Swagger at **`/api/docs/`**. These docs explain the *why* and
  the *how things fit together*. Swagger is the source of truth for request/response shapes.
- When behaviour changes, update the matching doc in the same commit.
