# Engagement service

Owner: `backend/apps/engagement/`. How readers react to products: **attitudes** (Love / Curious / Skip),
**comments** with replies and likes, staff **moderation**, and a dormant **bookmark** model.

## Attitudes

One attitude per `(user, product)` (unique together), with `kind` ∈ `love`, `curious`, `skip`.

| Method | Path | Auth | Behaviour |
|--------|------|------|-----------|
| `PUT` | `/products/<slug>/attitude/` | user | Body `{kind}`. Creates or switches the attitude. Returns `{kind, love_count, curious_count, skip_count}` |
| `DELETE` | `/products/<slug>/attitude/` | user | Clears it. Same response shape, with `kind: null` |
| `GET` | `/me/attitudes/?kind=` | user | Your attitudes (incl. skips), each with a nested `ProductListSerializer` |
| `GET` | `/users/<username>/attitudes/?kind=` | public | Someone else's shelf. Skips are never exposed (lives in `apps.users`) |

### Consistency

`apply_attitude()` and `remove_attitude()` (`serializers.py`) run inside `transaction.atomic()` and lock
the existing row with `select_for_update()`. Switching from `curious` to `love` decrements one counter
and increments the other on both `Product` and the user's `Profile`, using `F()` expressions so
concurrent taps can't lose updates. Setting the same kind twice is a no-op.

Counters are also rebuilt from source rows nightly by `recompute_attitude_stats`, which additionally
recomputes `editorial_score = 3·love + 1.5·curious − 0.5·skip`. This means the feed order drifts
toward what readers respond to.

### Frontend

`components/AttitudeBar.tsx` is optimistic. It applies the change locally (`applyLocal`), calls the API,
reconciles with the returned counts, and rolls back on failure. Signed-out taps redirect to
`/login?next=/p/<slug>`.

## Comments

| Field | Notes |
|-------|-------|
| `product`, `author`, `body` | |
| `parent` | Self-FK for replies |
| `is_hidden` | Hidden comments are excluded from every public list |
| `is_flagged` | Set by the spam heuristic. Staff review in admin |
| `likes_count` | Denormalised |
| `edited_at` | Reserved; no edit endpoint yet |

| Method | Path | Auth | Behaviour |
|--------|------|------|-----------|
| `GET` | `/products/<slug>/comments/?sort=newest\|top` | public | Top-level, non-hidden comments, each with nested non-hidden `replies` and `liked_by_me`. Paginated |
| `POST` | `/products/<slug>/comments/` | user | Body `{body, parent?}`. Triggers `flag_spam_comment`, and for replies, `send_comment_reply_notification` |
| `POST` / `DELETE` | `/comments/<id>/like/` | user | Like / unlike (idempotent via `CommentLike` unique pair). Returns `{likes_count, liked}` |
| `POST` | `/staff/comments/<id>/moderate/` | staff | Body `{action: "hide"\|"unhide"}`. Unhide also clears the flag |

**Spam heuristic** (`tasks.flag_spam_comment`): the comment is flagged if the body contains a link,
"buy now", "crypto" or "viagra", or is longer than 2000 characters. Flagged comments stay visible until
staff hide them, so this is a review queue rather than auto-removal.

**Frontend:** `components/CommentThread.tsx` renders the thread (monogram avatars, newest/top tabs,
heart likes, reply composer). The UI caps reply nesting at depth 2. The API itself accepts deeper
nesting, but the serializer only expands one level of `replies`.

## Bookmarks

The `Bookmark(user, product)` model and its admin exist, but **no API endpoints or UI use it yet**.
It's reserved for a future "save for later" feature.

## Admin

- Attitudes: list by user/product/kind.
- Comments: filter hidden/flagged, *hide* / *unhide* bulk actions.
- Comment likes and bookmarks: read-mostly listings.

## Known gaps

- `liked_by_me` runs one query per comment (N+1 on large threads). Annotating with `Exists()` would
  fix it.
- `CommentLikeView` updates `likes_count` from the in-memory value (`likes_count + 1`) instead of
  `F("likes_count") + 1`, so two simultaneous likes can undercount. The nightly job doesn't rebuild
  comment likes.
