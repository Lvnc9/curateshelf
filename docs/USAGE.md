# CurateShelf — Usage Guide

Friendly companion to the main [README](../README.md). Follow this if you want a **step-by-step walkthrough** from zero to a working magazine.

---

## Before you start

You need four things running on your machine:

1. **Python 3.12+**
2. **Node.js 20+**
3. **PostgreSQL**
4. **Redis**

Check them:

```bash
python3 --version
node --version
pg_isready
redis-cli ping
```

If Postgres or Redis isn’t up (macOS / Homebrew):

```bash
brew services start postgresql@16
brew services start redis
createdb curateshelf
```

---

## Step A — Backend (API + admin)

Open a terminal:

```bash
cd curateshelf/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` to match your machine, for example:

```env
DATABASE_URL=postgres://YOUR_MAC_USERNAME@localhost:5432/curateshelf
```

Then:

```bash
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

You should see something like:

```text
Starting development server at http://127.0.0.1:8000/
```

Verify:

- Health: http://127.0.0.1:8000/api/health/ → `"status": "ok"`
- Docs: http://127.0.0.1:8000/api/docs/
- Admin: http://127.0.0.1:8000/admin/

**Admin login:** `admin@curateshelf.local` / `admin12345`

---

## Step B — Frontend (magazine UI)

Open a **second** terminal (keep the API running):

```bash
cd curateshelf/frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_MEDIA_URL=http://127.0.0.1:8000
```

Start the app:

```bash
npm run dev
```

Open: **http://localhost:3000**

You should see **CurateShelf** as a full-screen magazine story. Scroll to the next product.

---

## Step C — Try the main flows

### 1. Browse like a magazine

- Scroll or press **`J`** / **`K`**
- Read titles and short decks on each story

### 2. Sign in as a reader

- Go to **Sign in** (nav) or http://localhost:3000/login
- Use `reader@curateshelf.local` / `reader12345`

### 3. React to a product

- On any story, tap **Love**, **Curious**, or **Skip**
- Open your profile from the nav → see **Loved** / **Curious** lists

### 4. Comment

- Open **See details** on a product
- Scroll to **Comments**, post a note, try a reply

### 5. Search & shelves

- **Explore** — type `brass` or `linen`
- **Shelves** — open *Quiet Mornings* or *Material Stories*

### 6. Edit as an admin

- http://127.0.0.1:8000/admin/
- Products → change status, price, or schedule
- Collections → reorder shelf items

---

## Stopping & restarting

| Service | Stop | Start again |
|---------|------|-------------|
| API | `Ctrl+C` in backend terminal | `python manage.py runserver` |
| Frontend | `Ctrl+C` in frontend terminal | `npm run dev` |
| Postgres / Redis | leave running usually | `brew services start …` |

### “Port 8000 already in use”

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
kill <PID>
```

### “localhost:3000 not reachable”

The frontend isn’t running — only Django was started. Run Step B.

---

## Re-seeding demo data

Safe to run again; it updates sample products and resets demo passwords:

```bash
cd backend
source .venv/bin/activate
python manage.py seed_demo
```

---

## Docker alternative (API stack only)

From the repo root:

```bash
docker compose up --build
```

Then still run the frontend with `npm run dev` as in Step B.

---

## Where to go next

- Expand products in **Admin**
- Turn off eager Celery (`CELERY_TASK_ALWAYS_EAGER=False`) and run a worker
- Deploy API (Render/Railway/Fly) + frontend (Vercel) and update CORS / env URLs

Happy curating.
