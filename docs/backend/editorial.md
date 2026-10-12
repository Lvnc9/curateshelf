# Editorial service (shelves)

Owner: `backend/apps/editorial/`. **Shelves** are editor-curated, ordered collections of products
built around a mood or material ("Quiet Mornings", "Material Stories").

## Models

### `Collection` (a shelf)

| Field | Notes |
|-------|-------|
| `title`, `slug` (unique), `description` | The description is shown as a pull quote on the shelf page |
| `cover` | `ImageField` (`shelves/`). Hero image on the shelf page and card image elsewhere |
| `is_featured` | Featured shelves close the home feed |
| `sort_order` | Ordering (then newest first) |
| `products` | M2M **through** `CollectionItem` |

### `CollectionItem`

| Field | Notes |
|-------|-------|
| `collection`, `product` | Unique together |
| `position` | Order within the shelf |
| `blurb` | Optional editor's caption. The UI falls back to the product subtitle |

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/shelves/` | public | Unpaginated. `?featured=1` for featured only. Includes `product_count` |
| `GET` | `/shelves/<slug>/` | public | Adds `items: [{position, blurb, product}]`, where `product` uses `ProductListSerializer` (with `gallery_preview`) |

The detail queryset prefetches `items__product__category`, `__tags` and `__media`, so a shelf loads in a
fixed number of queries.

Items are **not** filtered by product status. If an editor places an unpublished product on a shelf, it
shows up there, and its link leads to a 404 for non-staff readers. Keep shelves to published products,
or add a status filter to the prefetch.

## Frontend

| Where | Component | What it shows |
|-------|-----------|---------------|
| End of the home feed | `components/feed/ClosingSlide.tsx` | Featured shelves as photo cards |
| `/shelves` | `app/shelves/page.tsx` | Every shelf as a large photo plus copy, alternating sides |
| `/shelves/<slug>` | `app/shelves/[slug]/page.tsx` | Hero cover, quote, numbered items alternating left and right with the blurb as caption |

See [../frontend/pages.md](../frontend/pages.md#shelves).

## Admin

`CollectionAdmin` lists title, slug, featured and sort order, with an inline for ordering items. Upload
the cover here.

## Seed data

`seed_demo` creates two featured shelves and attaches covers from `backend/seed_media/shelves/`:

| Slug | Items |
|------|-------|
| `quiet-mornings` | First 4 seeded products (blurb = subtitle) |
| `material-stories` | Products 4–7 |
