# Testing

## Backend

```bash
cd backend
python manage.py test            # all apps
python manage.py test apps.catalog
```

Tests need a running PostgreSQL, because Django creates a throwaway `test_curateshelf` database. They
use `CELERY_TASK_ALWAYS_EAGER=True`.

| Suite | Covers |
|-------|--------|
| `apps/catalog/tests.py` | Seed gives every product a cover + 3 alt-texted gallery images. The seed is idempotent. The feed exposes `gallery_preview` with absolute URLs. The feed runs in a constant 3 queries |

> Note: the seed tests write processed images into the real `MEDIA_ROOT` at the same deterministic
> paths the dev seed uses, so they don't create clutter, but they do touch `backend/media/`.

**Gaps worth filling next:** attitude counter transitions (love → curious → clear), comment
permissions and moderation, register/token flows, and the public attitudes endpoint never leaking
skips.

## Frontend

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

There is no unit/e2e test runner yet. Playwright would fit well, and the feed's `#no-N` deep links make
individual slides easy to target.

## Manual QA checklist

Run through this at **desktop (≥1280px)** and **mobile (375px)**:

- [ ] Feed: cover fades in, *Begin* and "In this issue" jump correctly, J/K and arrows page, the rail
      counter and dots update, layouts alternate bleed/spread (desktop), and the URL hash follows.
- [ ] `/#no-4` opens on story 4.
- [ ] Product page: gallery buttons, thumbnails and ←/→ work, the stock line shows, "More from" renders.
- [ ] Signed out: tapping Love goes to `/login?next=…`. After *Use demo reader* → Sign in, you land back
      on the product.
- [ ] Signed in: Love toggles instantly and survives a reload. Tapping again clears it.
- [ ] Comments: post a note and a reply, like, switch newest/top.
- [ ] Explore: search, category chips, clear filters, URL updates.
- [ ] Shelves index → shelf detail, all photos load.
- [ ] Profile tabs. Skipped is visible only on your own profile.
- [ ] Settings save and show "Saved.".
- [ ] OS "reduce motion" on: no Ken Burns, reveals or count rolls.
- [ ] No console errors, and no failed `/media/` or `/_next/image` requests.
