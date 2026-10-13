# CurateShelf

**An editorial product magazine** — not a typical grid shop.

Scroll full-bleed product stories like a digital magazine. React with **Love / Curious / Skip**, open details and comments, and manage inventory from a polished Django admin. Built as a portfolio-ready full-stack app with real backend jobs (Celery), PostgreSQL search, and a photo-led Next.js frontend in a quiet editorial style.

> New here? Start with the friendly walkthrough: **[docs/USAGE.md](docs/USAGE.md)**  
> Technical docs for every service and screen: **[docs/README.md](docs/README.md)**

---

## Table of contents

1. [What you get](#what-you-get)
2. [Demo tour (2 minutes)](#demo-tour-2-minutes)
3. [Design](#design)
4. [Requirements](#requirements)
5. [Setup — local (recommended)](#setup--local-recommended)
6. [Setup — Docker](#setup--docker)
7. [Useful URLs](#useful-urls)
8. [Demo accounts](#demo-accounts)
9. [How to use the product](#how-to-use-the-product)
10. [API overview](#api-overview)
11. [Project structure](#project-structure)
12. [Celery tasks](#celery-tasks)
13. [Common problems](#common-problems)
14. [Tech stack](#tech-stack)
15. [License](#license)

---

## What you get

| Area | Highlights |
|------|------------|
| **Magazine feed** | A cover, then photographed stories alternating full-bleed / two-page spreads, an issue rail, keyboard `J` / `K`, deep links (`/#no-3`) |
| **Attitudes** | Love · Curious · Skip (one per product), optimistic UI, live counts |
| **Catalog** | Products, categories, tags, attributes, inventory, cover + photo gallery |
| **Imagery** | 26 curated, freely licensed product and shelf photos loaded by `seed_demo`, plus a masthead ([credits](backend/seed_media/CREDITS.md)) |
| **Comments** | Threaded replies, likes, spam flagging, admin moderation |
| **Shelves** | Editorial collections (featured on the home feed) |
| **Profiles** | Public profiles + Loved / Curious shelves |
| **Search** | ⌘K command palette (stories, shelves, categories, pages, theme) + full-text Explore |
| **Notifications** | Nav bell for replies and the weekly digest; email preferences in Settings |
| **Themes** | Light and dark editorial themes (follows the OS by default) |
| **Admin** | Unfold-styled Django admin for product operations |
| **Jobs** | Celery: image processing, scheduled publish, digests, stats |

Payments are **out of scope** for v1 — product pages show an **Inquire / Reserve** CTA for demo purposes.

---

## Demo tour (2 minutes)

1. Start backend + frontend (see [Setup](#setup--local-recommended)).
2. Open **http://localhost:3000** — scroll the magazine feed.
3. Click **Read the story** on a product → swipe the photo gallery, read the details, leave a note (after login).
4. Sign in as `reader@curateshelf.local` / `reader12345` (or press **Use demo reader** on the sign-in page).
5. Tap **Love** or **Curious** on a story → check your profile under **Loved / Curious**.
6. Open **http://127.0.0.1:8000/admin/** with the admin account → edit a product or shelf.

---

## Design

The frontend follows a **"Quiet Editorial"** direction, in the spirit of independent print magazines: warm paper,
hairline rules, a light Fraunces serif for display type, Outfit for UI text, and generous whitespace.

| Piece | Where |
|-------|-------|
| Design tokens (palette, fluid type scale, easing) | `frontend/src/app/globals.css` (`@theme`) |
| Shared motion language | `frontend/src/lib/motion.ts` |
| Primitives: `EditorialImage`, `ProductCard`, `Gallery`, `Button`, `Field`, `Skeleton`, icons | `frontend/src/components/ui/` |
| Feed pieces: cover, issue rail, closing shelves | `frontend/src/components/feed/` |
| Why the photos are committed (and where they come from) | [ADR-0001](docs/adr/0001-editorial-imagery.md) |

It ships in **light and dark** themes. Muted text and accent colours pass WCAG AA in both. Accessible
overlays (menus, sheet, popovers, ⌘K palette, forms) are built on shadcn/ui + Radix in
`frontend/src/components/shadcn/`, restyled to the editorial look. Every animation respects
`prefers-reduced-motion`.

---

## Requirements

| Tool | Version (approx.) | Why |
|------|-------------------|-----|
| Python | 3.12+ | Django backend |
| Node.js | 20+ | Next.js frontend |
| PostgreSQL | 16 | Primary database + full-text search |
| Redis | 7+ | Celery broker + Django cache |
| Docker | optional | One-command infra + API |

macOS tip (Homebrew):

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
```

---

## Setup — local (recommended)

### 1. Clone the repo

```bash
git clone https://github.com/Lvnc9/curateshelf.git
cd curateshelf
```

### 2. Create the database

```bash
# if needed: create a local superuser role for your macOS user
createdb curateshelf
```

### 3. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit DATABASE_URL if your Postgres user/password differ.
# Default example: postgres://YOUR_USER@localhost:5432/curateshelf

python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Leave this terminal open. API listens on **http://127.0.0.1:8000**.

> **Port already in use?** Something else is on 8000. Either stop it (`lsof -i :8000` then `kill <PID>`) or run `python manage.py runserver 8001` and update the frontend env accordingly.

### 4. Frontend (new terminal)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # if present; otherwise create .env.local (see below)
npm run dev
```

Create `frontend/.env.local` if needed:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_MEDIA_URL=http://127.0.0.1:8000
```

Open **http://localhost:3000**.

### 5. Optional — Celery worker & beat

By default, `CELERY_TASK_ALWAYS_EAGER=True` in debug mode runs tasks inside the web process (fine for local demos).

For a more realistic setup, set `CELERY_TASK_ALWAYS_EAGER=False` in `backend/.env`, then:

```bash
cd backend
source .venv/bin/activate
celery -A config worker -l info
# another terminal:
celery -A config beat -l info
```

---

## Setup — Docker

Runs **Postgres, Redis, web, worker, and beat**:

```bash
docker compose up --build
```

API: **http://localhost:8000**

Still run the frontend locally (or add a frontend service later):

```bash
cd frontend
npm install
npm run dev
```

Ensure `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api`.

---

## Useful URLs

| What | URL |
|------|-----|
| Magazine app | http://localhost:3000 |
| Explore / search | http://localhost:3000/explore |
| Shelves | http://localhost:3000/shelves |
| Interactive API docs (Swagger) | http://127.0.0.1:8000/api/docs/ |
| OpenAPI schema | http://127.0.0.1:8000/api/schema/ |
| Django admin | http://127.0.0.1:8000/admin/ |
| Health check | http://127.0.0.1:8000/api/health/ |

---

## Demo accounts

Created by `python manage.py seed_demo`:

| Role | Email | Password |
|------|-------|----------|
| **Admin** (staff) | `admin@curateshelf.local` | `admin12345` |
| **Editor** | `editor@curateshelf.local` | `editor12345` |
| **Reader** | `reader@curateshelf.local` | `reader12345` |

Login page: http://localhost:3000/login (pre-filled with the reader account for convenience).

---

## How to use the product

### Magazine feed (home)

- Opens on a **magazine cover**. "In this issue" jumps straight to a story.
- Scroll vertically: each viewport is one story. Stories alternate between a **full-bleed photo** and a
  **two-page spread** (photo left, paper page right) on desktop.
- **`J` / `↓`** next story · **`K` / `↑`** previous. The rail on the right shows `No. 03 / 08`.
- The URL follows you (`/#no-3`), so you can share a link to a specific story.
- **Love / Curious / Skip**: sign in first; tap again to clear. Counts update instantly.
- **Read the story** opens the product page.

### Product page (`/p/[slug]`)

- A sticky **photo gallery** (swipe, arrow keys, thumbnails) beside the story, specs, price and stock.
- "More from <category>" at the bottom.
- **Inquire / Reserve** is a demo CTA (no Stripe in v1).
- Threaded **comments** with replies and likes.

### Shelves

- Editorial collections at `/shelves` and `/shelves/[slug]`.
- Featured shelves appear at the bottom of the home feed.

### Explore

- Full-text search plus category filters over published products (`/explore`). Filters live in the URL.

### Your profile

- After login, open your name in the nav → Loved / Curious / Skipped shelves.
- **Settings** to edit display name, bio, location, website.

### Admin panel

1. Go to `/admin/` with the admin account.
2. Manage **Products** (status, schedule, media, attributes).
3. Use actions: **Publish now**, **Regenerate image variants**.
4. Moderate **Comments** (hide / unhide).
5. Curate **Collections** (shelves) with ordered items.

---

## API overview

Base URL: `http://127.0.0.1:8000/api/`

Auth: register → receive JWT, or `POST /api/auth/token/` with `{ "email", "password" }`.  
Send header: `Authorization: Bearer <access>`.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/products/feed/` | Magazine ordered list |
| GET | `/products/` | List + `?q=` search, filters |
| GET | `/products/{slug}/` | Detail |
| PUT | `/products/{slug}/attitude/` | `{ "kind": "love" \| "curious" \| "skip" }` |
| GET/POST | `/products/{slug}/comments/` | List / create |
| GET | `/shelves/` | Collections (`?featured=1`) |
| GET/PATCH | `/me/` | Current profile |
| POST | `/auth/register/` | Create account |
| GET | `/health/` | DB + Redis check |

Full interactive reference: **/api/docs/**.

---

## Project structure

```
curateshelf/
├── backend/
│   ├── apps/
│   │   ├── users/           # Auth, profiles, avatars
│   │   ├── catalog/         # Products, media, search, seed_demo
│   │   ├── engagement/      # Attitudes, comments, bookmarks
│   │   ├── editorial/       # Shelves / collections
│   │   ├── notifications/   # In-app + email digests
│   │   └── core/            # Health check
│   ├── config/              # Settings, Celery, URLs
│   ├── seed_media/          # Curated demo photos + CREDITS.md (loaded by seed_demo)
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # Next.js App Router + Framer Motion (see ## Design)
├── docs/                    # USAGE.md, architecture, backend/, frontend/, operations/, adr/
├── docker-compose.yml
├── README.md                # ← you are here
└── LICENSE
```

---

## Celery tasks

| Task | When | Purpose |
|------|------|---------|
| `process_product_media` / `process_cover_image` | On media/cover save | Thumbnails / WebP / resize |
| `process_avatar` | On avatar upload | Resize profile image |
| `publish_scheduled_products` | Every minute (beat) | Flip `scheduled` → `published` |
| `recompute_attitude_stats` | Nightly | Sync counts + editorial score |
| `weekly_editorial_digest` | Weekly | Notifications + email |
| `rebuild_search_vectors` | On product save | PostgreSQL full-text |
| `send_comment_reply_notification` | On reply | Notify parent author |
| `flag_spam_comment` | On new comment | Soft spam heuristics |

---

## Common problems

### `Error: That port is already in use` (8000)

Another process (often a leftover `runserver`) holds the port.

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
kill <PID>
```

### Frontend at `:3000` not loading

The Next app is separate from Django. Start it:

```bash
cd frontend && npm run dev
```

### Login fails after seeding

Re-run seed (it resets demo passwords):

```bash
cd backend && source .venv/bin/activate
python manage.py seed_demo
```

### DB connection errors

- Confirm Postgres is running: `pg_isready`
- Confirm DB exists: `createdb curateshelf`
- Match `DATABASE_URL` in `backend/.env` to your OS username

### Redis / cache errors

```bash
brew services start redis
redis-cli ping   # should reply PONG
```

Health endpoint should show `"db": true, "redis": true`:  
http://127.0.0.1:8000/api/health/

---

## Tech stack

| Layer | Choices |
|-------|---------|
| Backend | Django 5, Django REST Framework, SimpleJWT, django-filter, Unfold admin |
| Async | Celery, Redis, django-celery-beat |
| Database | PostgreSQL (`SearchVector`, GIN indexes) |
| Frontend | Next.js 15, TypeScript, Tailwind CSS 4, Framer Motion |
| Fonts | Fraunces (display) + Outfit (UI) |

---

## License

MIT — feel free to fork for portfolio or learning. See [LICENSE](LICENSE).

---

### Built for GitHub portfolios

CurateShelf showcases **product domain modeling**, **background jobs**, **JWT APIs**, and a **distinct browsing UX** — not another generic CRUD todo list. If you ship a fork, swap the seed copy for your own brand story and add screenshots to this README.
