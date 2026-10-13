# Media pipeline & demo seed

How photos get into CurateShelf, how they're processed, and how the demo data is built.
The reasoning behind committing photos to the repo is in
[ADR-0001](../adr/0001-editorial-imagery.md).

## Where images live

| Kind | Stored at (under `MEDIA_ROOT`) | Field |
|------|-------------------------------|-------|
| Product cover | `products/covers/<file>` | `Product.cover_image` |
| Product gallery | `products/gallery/<file>` + `<name>_{thumb,card,hero}.webp` | `ProductMedia.file` + `variants` |
| Shelf cover | `shelves/<file>` | `Collection.cover` |
| Avatar | `avatars/<file>` | `Profile.avatar` |
| Masthead (static) | `frontend/public/editorial/masthead.jpg` | served by Next, not Django |

In development, Django serves `/media/` itself (`DEBUG` only). In production, put a web server or object
store in front of `MEDIA_ROOT`.

## Processing

1. A file is saved through the model field (admin upload, staff API, or `seed_demo`).
2. Signals queue `process_cover_image` / `process_product_media` (see
   [background-jobs.md](background-jobs.md)).
3. Gallery items get three WebP variants. The API exposes them in `media[].variants`, and
   `gallery_preview` prefers `card`.
4. The frontend renders through `next/image` (`components/ui/EditorialImage.tsx`), which resizes and
   serves AVIF/WebP per device. Hosts are allowed in `frontend/next.config.ts`.

## `seed_demo`

```bash
cd backend && python manage.py seed_demo
```

Creates or updates, idempotently:

| What | Details |
|------|---------|
| Users | `admin@curateshelf.local / admin12345` (superuser), `editor@… / editor12345` (role editor), `reader@… / reader12345` |
| Categories | Tableware, Textiles, Lighting, Ritual, Furniture |
| Products | 8 published products with tags, attributes, SKU `CS-1000…`, staggered `published_at` |
| Photos | For each product: `seed_media/products/<slug>/cover.jpg` → `cover_image`, and `cover.jpg, 1.jpg, 2.jpg` → `ProductMedia` (sort 0–2) with alt text from `PRODUCTS[i]["image_alts"]` |
| Shelves | `quiet-mornings`, `material-stories` (featured) with covers from `seed_media/shelves/` |
| Engagement | The reader loves product 1, is curious about product 3, and a comment + editor reply on product 1 |
| Notifications | For the reader: one `comment_reply` (the editor's reply) and one weekly `digest` (top 3 picks) |

### Idempotency

`attach_file()` writes each image to a **deterministic path** (`products/covers/<slug>.jpg`,
`products/gallery/<slug>-<n>.jpg`, `shelves/<slug>.jpg`) and skips it if the field already points there
and the file exists. A stray file at the target path is deleted first, so Django never appends a random
suffix. Re-running the seed keeps the media file count stable (covered by a test).

### The photo set (`backend/seed_media/`)

```
seed_media/
├── CREDITS.md                      # source, author, license for every file. Keep it in sync!
├── products/<product-slug>/{cover,1,2}.jpg
└── shelves/<shelf-slug>.jpg
```

- 26 photos from **Wikimedia Commons**: CC0, public domain, CC BY or CC BY-SA. CC BY and CC BY-SA
  **require attribution**, which `CREDITS.md` provides.
- Each is downscaled to a 1800 px long edge, re-encoded as progressive JPEG (~q78) and stripped of
  metadata, about 7.5 MB in total.
- Folder names must match the product slug that `seed_demo` derives with `slugify(title)`.

### Replacing or adding a photo

1. Drop the new JPEG at the matching path (keep the long edge ≤ 1800 px).
2. Update its row in `seed_media/CREDITS.md`, and the alt text in `PRODUCTS[...]["image_alts"]`.
3. Delete the old processed file from `backend/media/` (or the whole `media/` folder) and re-run
   `seed_demo`. Otherwise the idempotency check sees the existing target and keeps the old image.
