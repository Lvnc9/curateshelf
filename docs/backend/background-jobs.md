# Background jobs (Celery)

Celery app: `backend/config/celery.py` (`app = Celery("curateshelf")`, settings namespace `CELERY_`,
`autodiscover_tasks()` picks up every `apps/*/tasks.py`). Redis is both broker and result backend.

## Running

| Mode | What happens |
|------|--------------|
| `DEBUG=True` (default dev) | `CELERY_TASK_ALWAYS_EAGER=True`, so `.delay()` runs inline in the request. No worker needed. Exceptions propagate (`CELERY_TASK_EAGER_PROPAGATES`) |
| Real queue | Set `CELERY_TASK_ALWAYS_EAGER=False`, then run a worker and beat |

```bash
cd backend
celery -A config worker -l info
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

Docker Compose already defines `worker` and `beat` services.

Beat uses **django-celery-beat's DatabaseScheduler**. The schedule in `celery.py` is the default,
and periodic tasks can also be edited in the admin under *Periodic tasks*.

## Tasks

| Task | Module | Trigger | What it does |
|------|--------|---------|--------------|
| `process_cover_image` | `catalog.tasks` | `Product` saved with a cover | Converts to RGB, fits it within 1600×2000, re-saves **in place** as JPEG q88 |
| `process_product_media` | `catalog.tasks` | `ProductMedia` created/saved; admin "Regenerate"; `POST staff/products/<slug>/regenerate_media/` | Writes `thumb` (200²), `card` (800×1000) and `hero` (1600×2000) WebP variants next to the original and records their `/media/...` paths in `variants` |
| `rebuild_search_vectors` | `catalog.tasks` | Every `Product` save; regenerate action | Recomputes the weighted `search_vector` (one product, or all if no id) |
| `publish_scheduled_products` | `catalog.tasks` | **Beat, every 60 s** | Publishes `scheduled` products whose `scheduled_for ≤ now` |
| `recompute_attitude_stats` | `engagement.tasks` | **Beat, daily 03:00** | Rebuilds product and profile attitude counters from rows, and recomputes `editorial_score` |
| `flag_spam_comment` | `engagement.tasks` | New comment | Sets `is_flagged` on link/keyword/length heuristics |
| `send_comment_reply_notification` | `notifications.tasks` | New reply | Notification + optional email to the parent author |
| `weekly_editorial_digest` | `notifications.tasks` | **Beat, Mondays 09:00** | Digest notification + email to opted-in readers |
| `process_avatar` | `users.tasks` | `PATCH /me/` with an avatar | Fits it within 400×400 JPEG in place |

All times are in `CELERY_TIMEZONE` (= `TIME_ZONE`, UTC).

## Design notes

- Signal handlers wrap `.delay()` in `try/except`, so a broker outage never blocks saving a product.
  The trade-off is that the work is silently skipped. Re-run it with the admin action.
- Image tasks overwrite or derive files on local disk (`MEDIA_ROOT`), so the worker must share the media
  volume with the web process. Compose mounts `media_data` into both.
- Tasks take primary keys rather than model instances, so payloads stay JSON-serialisable and always read
  fresh rows.
