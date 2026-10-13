# Notifications service

Owner: `backend/apps/notifications/`. In-app notifications plus the matching emails.

## Model

`Notification(user, type, payload JSON, is_read, created_at)`, newest first.

| `type` | Created by | `payload` |
|--------|------------|-----------|
| `comment_reply` | `send_comment_reply_notification` | `comment_id`, `product_slug`, `product_title`, `from_username`, `body_preview` (120 chars) |
| `digest` | `weekly_editorial_digest` | `products: [{slug, title}]` (top 5 by editorial score) |
| `product_published` | *(reserved, nothing emits it yet)* | – |

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/notifications/` | user | Your notifications (paginated) |
| `POST` | `/notifications/read/` | user | Body `{ids?: number[]}`. Marks those, or all unread, as read. Returns `{updated}` |

## Flows

### Reply notification

1. A reader posts a reply (`POST /products/<slug>/comments/` with `parent`).
2. `CommentCreateSerializer.create()` queues `send_comment_reply_notification(comment_id)`.
3. The task skips self-replies, creates a `comment_reply` notification for the parent's author and, if
   their profile has `notify_replies`, sends an email linking to `FRONTEND_URL/p/<slug>`.

### Weekly digest

Celery beat runs `weekly_editorial_digest` **Mondays at 09:00** (Celery timezone = `TIME_ZONE`, UTC).
For every profile with `notify_digest=True` it creates a `digest` notification and emails the top five
published products.

## Email

The backend comes from `EMAIL_BACKEND`. In development it's the console backend, so emails print in the
runserver/worker terminal. All sends use `fail_silently=True`, so a mail outage never breaks a request.

## Frontend

`frontend/src/components/NotificationBell.tsx` shows a bell with an unread badge in the nav for
signed-in readers. It opens a popover listing replies and digests, marks items read on open, has
*Mark all read*, and polls every 60 s while the tab is visible. Readers manage `notify_replies` /
`notify_digest` with switches under **Settings → Email**. See
[../frontend/pages.md](../frontend/pages.md#notifications).

`seed_demo` creates one `comment_reply` and one `digest` notification for the demo reader. The seeded
reply is written straight to the database, which skips the task.
