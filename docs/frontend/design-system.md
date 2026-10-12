# Design system: "Quiet Editorial"

The visual language of CurateShelf, inspired by independent print magazines: warm paper, hairline rules,
light serif display type, generous whitespace and photography doing the talking.

## Tokens (`frontend/src/app/globals.css`)

Declared in Tailwind v4's `@theme inline`, so each token is both a CSS variable and a utility class.

### Colour

| Token | Value | Utility examples | Use |
|-------|-------|------------------|-----|
| `paper` | `#f5f1ea` | `bg-paper`, `text-paper` | Page background |
| `paper-deep` | `#ece6db` | `bg-paper-deep` | Skeletons, monograms |
| `ink` | `#1b1a17` | `text-ink`, `bg-ink` | Body text, solid buttons |
| `ink-soft` | `#4a463f` | `text-ink-soft` | Long-form copy, subtitles |
| `muted` | `#6b655b` | `text-muted` | Eyebrows, metadata (**4.83:1** on paper, AA) |
| `hairline` | `rgb(27 26 23 / .12)` | `border-hairline` | Rules and dividers |
| `clay` | `#b4846c` | `bg-clay`, `text-clay` | Accent **fill only** (ink on clay is 5.35:1) |
| `clay-deep` | `#8e6450` | `text-clay-deep` | Accent text, drop caps, low-stock (4.56:1) |
| `sage` | `#8fa89a` | – | Secondary accent / placeholder tones |

### Typography

| Token | Size | Use |
|-------|------|-----|
| `text-eyebrow` | 11px, tracking 0.26em | Uppercase labels ("TABLEWARE · 3 MIN READ") |
| `text-lede` | 17–21px fluid | Intro paragraphs |
| `text-title` | 32–56px fluid | Section titles |
| `text-display` | 44–92px fluid | Page and story titles |
| `text-hero` | 56–160px fluid | Cover wordmark, shelf hero |

- **Fraunces** (variable, `SOFT` + `opsz` axes, italic) for all `h1–h3`, at weight 300.
  `.font-display-italic` gives the soft italic used for subtitles and accents ("Explore *everything*").
- **Outfit** (300/400/500) for UI and body text, at a base weight of 300.
- The fonts are loaded with `next/font` in `app/layout.tsx`. Their CSS variables are set on **`<html>`**
  on purpose. `--font-display` is declared on `:root` as `var(--font-fraunces)`, which only resolves
  if that variable exists on `:root` too.

### Motion

| Where | Value |
|-------|-------|
| CSS | `ease-editorial` = `cubic-bezier(0.22, 1, 0.36, 1)`, `animate-kenburns` (18s settle), `animate-fade-in`, `shimmer` |
| JS (`lib/motion.ts`) | `EASE`, `DURATION.{quick,base,slow}`, `rise` (fade + 24px rise), `stagger(step, delay)` |

Motion is slow and decelerating, never bouncy. **Reduced motion** is handled twice: a global CSS rule
switches off animations and transitions, and `MotionConfig reducedMotion="user"` (in `Providers.tsx`)
does the same for Framer Motion.

### Utilities

`.grain` (film-grain overlay for photos), `.drop-cap`, `.font-display-italic`, `.scrollbar-none`.

## Components (`frontend/src/components/ui/`)

| Component | Props (key) | Notes |
|-----------|-------------|-------|
| `EditorialImage` | `src, alt, tone, sizes, priority, kenBurns, position` | The **only** way to show a photo. Fills a `relative` parent, shows a `coverTone(tone)` placeholder, fades in on load |
| `ProductCard` | `product, sizes, caption, priority` | 4:5 card: eyebrow, price, serif title with animated underline. Crossfades to the 2nd photo on hover (hover-capable devices only) |
| `Gallery` | `images, tone, sizes` | Scroll-snap carousel (native swipe), ←/→ when focused, prev/next, `01 / 03`, progress hairline, thumbnails. ARIA carousel semantics |
| `Eyebrow` | `children` | Tracked uppercase label |
| `Hairline` | – | 1px rule |
| `Button` / `ButtonLink` | `variant: solid \| ghost \| link` | Uppercase tracked labels. `link` has a drawing underline |
| `Field` / `TextArea` | `label` + native props | Underlined inputs with eyebrow labels |
| `Skeleton`, `CardGridSkeleton` | `className` / `count` | Shimmer placeholders. Use them instead of "Loading…" text |
| `Icons` | `HeartIcon`, `CuriousIcon`, `SkipIcon`, arrows, `SearchIcon`, `MenuIcon`, `CloseIcon` | 1.25px stroke, `currentColor`. Heart/Curious accept `filled` |

Other shared pieces outside `ui/`: `AttitudeBar` (`surface="photo"|"paper"`), `CommentThread`,
`AuthShell` + `FormError`, and `SiteNav`.

## Rules of thumb

1. Photos go through `EditorialImage` (or `next/image` for static assets) with a meaningful `sizes`.
2. Text colours come from tokens, never raw hex. Check contrast for anything smaller than 18px.
3. `<button>` doesn't inherit `text-transform`, so put `uppercase` on the button itself.
4. Every async view has a skeleton, an empty state and an error state.
5. Interactive toggles expose state (`aria-pressed`, `aria-selected`, `aria-current`).
6. New motion uses `lib/motion.ts` variants so timing stays consistent.
