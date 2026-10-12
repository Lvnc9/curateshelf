# Catalog service

Owner: `backend/apps/catalog/`. The core domain: everything the magazine writes about. Other apps
(engagement, editorial, notifications) point at `Product`; catalog depends on none of them.

## Models

### `Product`

| Group | Fields |
|-------|--------|
| Content | `title`, `slug` (unique), `subtitle` (the "deck"), `description` (long-form story), `cover_image` |
| Taxonomy | `category` (FK, nullable), `tags` (M2M), `brand`, `maker_name` |
| Commerce | `price`, `currency` (default `USD`), `compare_at_price`, `sku`, `inventory_count` |
| Editorial | `status`, `editorial_score` (feed ranking), `reading_time_estimate` (minutes) |
| Schedule | `published_at`, `scheduled_for` |
| Engagement | `love_count`, `curious_count`, `skip_count` (denormalised, see [engagement.md](engagement.md)) |
| Search | `search_vector` (`SearchVectorField`, GIN-indexed) |
| Meta | `created_by`, `created_at`, `updated_at` |

**Status lifecycle:** `draft` → `scheduled` → `published` → `archived`. `Product.publish()` sets
`published`, stamps `published_at` and clears `scheduled_for`. The beat task
`publish_scheduled_products` calls it every minute for due products.

Only **published** products are visible through public endpoints.

Indexes: GIN on `search_vector`, `(status, -published_at)`, `(-editorial_score, -published_at)`.

### Supporting models

| Model | Purpose |
|-------|---------|
| `Category` | `name`, unique `slug`, optional `parent` (tree), `sort_order` |
| `Tag` | `name`, `slug` (auto-slugified on save) |
| `ProductMedia` | Gallery entries: `file`, `media_type` (`image`/`video`), `alt_text`, `sort_order`, `variants` (JSON of generated sizes) |
| `ProductAttribute` | Ordered key/value specs ("Material: Stoneware") shown on the product page |

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/products/feed/` | public | Magazine order: `-editorial_score, -published_at`. Max 50, **unpaginated** |
| `GET` | `/products/` | public | Paginated catalogue. Filters: `?category=<slug>`, `?tag=<slug>`, `?brand=`, `?q=` (full-text), `?ordering=price\|-love_count\|…` |
| `GET` | `/products/<slug>/` | public* | Detail incl. `description`, `media`, `attributes`, `sku`. *Staff can also read unpublished |
| `GET` | `/categories/` | public | Unpaginated, ordered by `sort_order` |
| `GET` | `/tags/` | public | Unpaginated |
| `GET/POST/PUT/PATCH/DELETE` | `/staff/products/` and `/staff/products/<slug>/` | staff | Full CRUD (router viewset) |
| `POST` | `/staff/products/<slug>/publish/` | staff | Publish now |
| `POST` | `/staff/products/<slug>/regenerate_media/` | staff | Re-queue image variants + search vector |

### Serializers

- **`ProductListSerializer`** is used by the feed, list, shelves and attitude lists. It includes the
  category, tags, counts, `my_attitude` (the caller's attitude, read from a prefetch when available),
  and **`gallery_preview`**.
- **`gallery_preview`** holds up to two `{url, alt}` items from `ProductMedia`, skipping `sort_order 0`
  (which duplicates the cover). It prefers the `card` WebP variant and returns absolute URLs. Every
  queryset that serialises lists must `prefetch_related("media")`, and all current ones do. The test
  `test_feed_query_count_is_flat` locks the feed at 3 queries.
- **`ProductDetailSerializer`** adds `description`, `sku`, `scheduled_for`, `media` (with variants)
  and `attributes`.
- **`ProductWriteSerializer`** is the writable field set for the staff API.

## Search

`rebuild_search_vectors` (run on every product save, via a signal) writes a weighted vector:

| Weight | Fields |
|--------|--------|
| A | `title` |
| B | `subtitle`, `brand`, `maker_name` |
| C | `description` |

`?q=` builds a `SearchQuery` and orders matches by `SearchRank`, then `-editorial_score`.
`?search=` is accepted as an alias.

## Signals & tasks

`apps/catalog/signals.py`:

- `Product` saved → `rebuild_search_vectors.delay(pk)`, plus `process_cover_image.delay(pk)` if the
  product has a cover.
- `ProductMedia` created (or saved without `update_fields`) → `process_product_media.delay(pk)`.

The tasks are described in [background-jobs.md](background-jobs.md), and the image specifics in
[media-and-seed.md](media-and-seed.md).

## Admin

`ProductAdmin` has grouped fieldsets, inline media and attributes, search over
title/subtitle/sku/brand/maker, filters by status/category/currency, and the actions **Publish now** and
**Regenerate image variants**. Saving a product as `published` without a date stamps `published_at`.

## Tests

`apps/catalog/tests.py` seeds the demo and checks that every product has a cover plus 3 alt-texted
gallery images, that the seed is idempotent, that the feed exposes `gallery_preview` with absolute URLs,
and that the feed query count stays constant.
