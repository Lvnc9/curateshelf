# Pages

Every route except the feed (see [feed.md](feed.md)). All pages share `SiteNav` (from the root layout)
and the components in [design-system.md](design-system.md).

## Product story (`/p/[slug]`)

`app/p/[slug]/page.tsx`

| Area | Details |
|------|---------|
| Left page | Sticky `Gallery` of `productImages(product)` (cover + hero variants). Edge-to-edge on mobile |
| Breadcrumb | `← Issue / <Category>`. The category links to `/explore?category=<slug>` |
| Heading | Display title, italic subtitle, "Made by …" (`byline(p, " for ")`) |
| Buy row | `formatPrice`, struck compare-at price, stock status ("Only n left" in clay-deep at ≤ 10, "Currently sold out" at 0) |
| Actions | **Inquire / Reserve** (demo CTA: a toast explains checkout isn't in v1) and `AttitudeBar` |
| Story | "The story" with a drop cap at a readable measure (`whitespace-pre-line` keeps paragraphs) |
| Details | Attributes + SKU on hairline rows, then tag chips |
| Conversation | `CommentThread` |
| More from | 3 `ProductCard`s: same category first, topped up from the rest of the catalogue |

States: a two-column skeleton while loading, and a "Not on the shelf" page on error. `document.title`
is set to the product title.

## Explore (`/explore`)

`app/explore/page.tsx` (+ `layout.tsx` for metadata)

- **URL is the state:** `?q=` (full-text) and `?category=<slug>`. Changes use `router.replace`, so the
  view is shareable, back/forward-friendly and deep-linkable from the product breadcrumb.
- Header: "Explore *everything*", plus an underlined serif search field with a clear button.
- Category chips: "All" + `/categories/`. These are `aria-pressed` toggles that scroll sideways on
  mobile.
- Result line (`aria-live`): "2 pieces in Textiles matching “linen”".
- Grid: `ProductCard`, 2 / 3 / 4 columns, with a staggered reveal. It shows a `CardGridSkeleton` while
  loading and an empty state with **Clear filters**.

## Shelves

### `/shelves`

`app/shelves/page.tsx`: "Shelves, *curated*". Each shelf is a large cover photo beside its copy
(`Shelf 01 · 4 pieces · Featured`, title, description, *Open the shelf →*). Sides alternate and each
row is revealed once on scroll.

### `/shelves/[slug]`

`app/shelves/[slug]/page.tsx`

1. **Hero:** 78vh cover with Ken Burns, a strong bottom scrim, hero-size title and piece count.
2. **Intro:** the shelf description set as an italic pull quote, credited to "The editors".
3. **Items:** alternating left and right, each with a large 4:5 photo, an oversized clay numeral,
   category · price, title, and the item **blurb** (falling back to the subtitle).

Not-found and skeleton states are included.

## Profile (`/u/[username]`)

`app/u/[username]/page.tsx`

- Header: clay monogram, `role · @username · location`, display name, bio, website, and big
  **Loved / Curious** counters. The owner also sees *Edit profile*.
- Tabs (`role=tablist`): Loved, Curious and, **for the owner only**, Skipped. Each shows a `ProductCard`
  grid from `/users/<u>/attitudes/?kind=`.
- Per-tab empty states, a skeleton, and a "Reader not found" state.

## Sign in & register

`app/login/page.tsx`, `app/register/page.tsx`, both inside `components/AuthShell.tsx`:

- A split screen: the masthead photo with an editors' quote (desktop) and a paper form column.
- **Validated with react-hook-form + zod** (`lib/schemas.ts`, `components/ui/FormFields.tsx`):
  - Login requires a valid email and a password.
  - Register checks the email, the username charset (letters, numbers, `-`, `_`, max 50) and the
    password (≥ 8 characters, not all digits).
  - Errors show inline under each field, with `aria-invalid` and red underlines. Server errors are
    mapped back onto fields (e.g. "user with this email already exists") or shown in `FormError`.
- Login honours `?next=` (same-site relative paths only) and offers **Use demo reader**.
- Success toasts: "Welcome back", "Welcome to CurateShelf".

## Settings

`app/settings/page.tsx`: a two-column page (intro + *View your shelf* link, form). Signed-out visitors
are sent to `/login?next=/settings`.

- **Public profile:** display name, bio, location and website (must be a full `https://` URL, or
  empty).
- **Email:** Radix switches for *Replies to my notes* (`notify_replies`) and *Weekly editorial
  digest* (`notify_digest`).
- *Save changes* is disabled until something changes, with an "Unsaved changes" hint. On save it
  `PATCH`es `/me/`, refreshes the session, resets the form and toasts "Settings saved" (or an error
  toast).

## Notifications

`components/NotificationBell.tsx`, in the nav for signed-in readers (desktop and mobile):

- Radix Popover. The badge shows the unread count (`9+` cap) and the accessible name says
  "Notifications, 2 unread".
- `comment_reply`: "@editor replied on *Product*", a quoted preview and a relative time. It links to
  `/p/<slug>#comments-heading`.
- `digest`: the week's picks as links.
- Opening an item marks it read (optimistically, rolling back on error). **Mark all read** clears the
  rest.
- Polls `/notifications/` every 60 s while the tab is visible, and refetches on open.
- `seed_demo` gives the demo reader one of each, so the bell isn't empty in the demo.

## Command palette (⌘K)

`components/CommandPalette.tsx`, mounted once in `app/layout.tsx`:

| Open with | ⌘K / Ctrl+K (toggles), `/` when not typing, or the nav **Search** pill / mobile search icon (`openCommandPalette()`) |
|---|---|
| Stories | Every product with a thumbnail and category · price. Matches title, subtitle, brand, maker, category and tags |
| Search | With 2+ characters, "Search the catalogue for “…”" opens `/explore?q=` (server full-text search) |
| Shelves, Categories | Jump to a shelf, or to Explore filtered by category |
| Go to | Issue, Explore, Shelves, Your shelf / Settings (or Sign in) |
| Preferences | Light / dark theme, sign out |

Data (products, shelves, categories) loads lazily the first time it opens. cmdk filters on the client.
↑↓ moves the selection, ↵ opens it, Esc closes.

## Theme

Light, dark or "match system", via next-themes (stored in `localStorage` under `theme`). It can be
switched from the nav toggle (desktop), the account menu, the mobile sheet, or the palette. See
[design-system.md](design-system.md#tokens-frontendsrcappglobalscss).

## Shared behaviour

| Concern | Where |
|---------|-------|
| Navigation, active link, mobile sheet (Radix), search pill, bell slot | `components/SiteNav.tsx` |
| Account menu (shelf, settings, theme, sign out) | `components/UserMenu.tsx` |
| Love / Curious / Skip (optimistic, error toast on rollback) | `components/AttitudeBar.tsx`, see [../backend/engagement.md](../backend/engagement.md#attitudes) |
| Comments (toasts on post / reply / failure) | `components/CommentThread.tsx` |
| Toaster, theme, reduced motion, auth context | `components/Providers.tsx` |
| Skip-to-content link, fonts, title template, palette mount | `app/layout.tsx` |
