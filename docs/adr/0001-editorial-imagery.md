# ADR-0001: Source and serving of editorial imagery

**Status:** Accepted
**Date:** 2026-10-12
**Deciders:** Sam

## Context

CurateShelf presents products as a scrolling magazine, but the demo seed
(`backend/apps/catalog/management/commands/seed_demo.py`) never attached any
imagery. `Product.cover_image`, `ProductMedia` and `Collection.cover` were all
empty, so every slide, card and hero fell back to `coverTone()` gradients in
`frontend/src/lib/api.ts`. A photo-led editorial product can't be judged
without photos.

Figma was not reachable from the developer's region (HTTP 451), so imagery
comes from real photography. Unsplash, Pexels, Pixabay and Flickr all timed
out from the same network. **Wikimedia Commons** was reachable, so the set is
drawn from Commons, limited to CC0, public domain, CC BY and CC BY-SA. If
you replace a photo later, any source with a compatible license is fine.
Record it in `CREDITS.md`.

## Decision

Commit a small, curated, pre-optimized photo set to the repo under
`backend/seed_media/`, and have `seed_demo` copy those files into `MEDIA_ROOT`
through the normal `ImageField`/`FileField` APIs. That path triggers the
existing signals and Celery tasks (`process_cover_image`,
`process_product_media`), which generate the `thumb`/`card`/`hero` variants.

Each image is at most 1800px on the long edge, progressive JPEG quality ~78, typically 100–500 KB.
Attribution lives in `backend/seed_media/CREDITS.md`.

## Options considered

| Option | Offline demo | Repo weight | Uses ImageField + Celery pipeline | Fragility |
|---|---|---|---|---|
| **A. Commit curated photos; seed copies into MEDIA** (chosen) | Yes | +6–8 MB | Yes | Low |
| B. Download from Unsplash at seed time | No | 0 | Yes | Breaks offline or if a photo is removed |
| C. Hotlink CDN URLs | No | 0 | No (goes around ImageField) | High |

## Consequences

- The demo is deterministic and works offline. The admin, variant
  pipeline and frontend all get real input.
- The repo grows by a few MB. Keep `seed_media/` curated, and don't drop in
  originals straight from a camera.
- `CREDITS.md` must stay in sync whenever a photo is swapped.
- Frontend renders through `next/image` (`images.remotePatterns` in
  `frontend/next.config.ts`). `coverTone()` survives only as a loading
  placeholder colour.
