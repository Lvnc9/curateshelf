# The magazine feed (`/`)

The home page reads like one issue of a magazine: **cover → stories → featured shelves**. It's a
full-viewport vertical scroll-snap container.

```
MagazineFeed
├── CoverSlide            data-slide=0
├── (Skeleton | Error)    while loading / on failure
├── StorySlide × N        data-slide=1..N, id="no-1".."no-N", layout bleed/spread alternating
├── ClosingSlide          data-slide=N+1 (if featured shelves exist)
├── IssueRail             fixed, desktop
└── IssueCounter          fixed, mobile
```

## `MagazineFeed.tsx`: orchestration

- **Data:** `api.feed()` + `api.shelves(true)` in parallel. Status: `loading | ready | error`. The
  cover renders immediately (it needs no data), so the first paint is never blank.
- **Active slide:** an `IntersectionObserver` (root = the scroller, threshold 0.55) reads
  `data-slide` into `current`.
- **Keyboard:** `↓ / J / PageDown` and `↑ / K / PageUp` call `jumpTo(current ± 1)`. Keys are ignored
  inside inputs, textareas, selects and contenteditable elements, or with ⌘/Ctrl/Alt.
- **Deep links:** once stories are loaded, a URL hash `#no-3` jumps instantly to story 3. While
  reading, the hash follows the active story through `history.replaceState`, which adds no history
  entries and causes no scroll jump. The cover clears it.
- **Attitudes:** `updateProduct` keeps the feed's product list in sync when a slide's `AttitudeBar`
  changes counts.
- **Rail surface:** `railSurface` is `"paper"` when a spread (odd-index story) or the closing slide is
  active and `"photo"` otherwise, so the rail can switch between ink and paper text.

## `feed/CoverSlide.tsx`

The magazine cover: the masthead photo (`/editorial/masthead.jpg`, scale-in), an
`Issue 01 · <Season Year>` rule (`issueLabel()` derives the season from the date), the oversized
**Curate*Shelf*** wordmark, a lede, an **"In this issue"** list of the first five stories (desktop,
each jumps to its slide) and a **Begin ↓** button.

## `StorySlide.tsx`: one product story

Props: `product`, `number`, `total`, `layout: "bleed" | "spread"`, `onProductChange`.

| Layout | Desktop | Mobile |
|--------|---------|--------|
| `bleed` (even index) | Cover photo full-screen with Ken Burns + grain, gradient scrim (darker at the top so the nav stays legible), copy bottom-left | same |
| `spread` (odd index) | 58/42 grid: photo left, paper page right with the copy and an inset of `gallery_preview[0]` | Falls back to bleed (**same markup**, breakpoint classes only) |

Copy stack: `No. 0n — Category · n min read` → title (link) → italic subtitle → byline (`byline()`) →
inset (spread) → `AttitudeBar` (`surface="photo"` over images, `"paper"` on spreads) →
**Read the story · $price**. The copy reveals with `stagger`/`rise` when 55% of the slide is visible.
The first two slides load their photos with `priority`.

## `feed/IssueRail.tsx`

- **IssueRail** (md+, fixed right): `No. 03 / 08` (vertical), a hairline progress bar
  (`current / total`), clickable story dots (`aria-current="step"`) and the current section (category)
  animating in. Hidden on the cover. It takes `surface` to pick paper or ink text. *Blend modes were
  tried first and disappeared over mid-grey photos.*
- **IssueCounter** (mobile): `02 / 08` bottom-right.

## `feed/ClosingSlide.tsx`

"End of issue · Featured shelves". The featured shelves appear as cover-photo cards linking to
`/shelves/<slug>`, followed by a **Browse everything** link and a keyboard tip. It has extra right
padding on desktop to clear the rail.

## Navigation over the feed

`SiteNav` is transparent with `mix-blend-difference` on `/`, so the wordmark and links invert against
whatever is behind them. On every other route it's a frosted paper bar.

## Extending

- **Change the ordering:** backend `ProductFeedView` (`-editorial_score, -published_at`).
- **Add a slide type** (e.g. an editor's letter): render it in `MagazineFeed` with the next `data-slide`
  index and update `lastIndex` / `railSurface`.
- **Change the layout rhythm:** the `layout={i % 2 === 1 ? "spread" : "bleed"}` line in
  `MagazineFeed`, plus `railSurface`, which mirrors it.
