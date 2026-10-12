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
| Actions | **Inquire / Reserve** (demo CTA, no payments in v1) and `AttitudeBar` |
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
- `Field` inputs with correct `autocomplete`, busy states, and `FormError` (which condenses DRF JSON
  errors into one line, `role=alert`).
- Login honours `?next=` (same-site relative paths only) and offers **Use demo reader**.
- Register has an optional username (pattern hint) and requires an 8+ character password.

## Settings

`app/settings/page.tsx`: a two-column page (intro + *View your shelf* link, form). It edits display
name, bio, location and website through `PATCH /me/`, showing *Saving…* / *Saved.* (`aria-live`) and
errors. Signed-out visitors are sent to `/login?next=/settings`.

## Shared behaviour

| Concern | Where |
|---------|-------|
| Navigation, active link, mobile sheet, sign out | `components/SiteNav.tsx` |
| Love / Curious / Skip (optimistic) | `components/AttitudeBar.tsx`, see [../backend/engagement.md](../backend/engagement.md#attitudes) |
| Comments | `components/CommentThread.tsx` |
| Skip-to-content link, fonts, title template | `app/layout.tsx` |
