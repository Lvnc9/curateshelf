# Frontend overview

Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS v4, Framer Motion 12, TypeScript,
shadcn/ui on Radix (overlays, menus, forms), cmdk, sonner, next-themes, react-hook-form + zod.
Code lives in `frontend/`.

## Structure

```
frontend/
├── components.json              # shadcn/ui config (ui alias → @/components/shadcn)
└── src/
    ├── app/                         # routes (App Router)
    │   ├── layout.tsx               # fonts, <html>, skip link, Providers, SiteNav(+bell), CommandPalette
    │   ├── globals.css              # light/dark tokens (@theme) + base styles
    │   ├── page.tsx                 # "/" → <MagazineFeed/>
    │   ├── p/[slug]/page.tsx        # product story
    │   ├── explore/                 # search + filters (layout.tsx = metadata)
    │   ├── shelves/page.tsx, shelves/[slug]/page.tsx
    │   ├── u/[username]/page.tsx    # public profile
    │   ├── login/, register/, settings/   # RHF + zod forms
    ├── components/
    │   ├── Providers.tsx            # ThemeProvider + MotionConfig + AuthProvider + Toaster
    │   ├── SiteNav.tsx              # masthead nav + mobile Sheet
    │   ├── UserMenu.tsx             # account dropdown (shelf, settings, theme, sign out)
    │   ├── ThemeToggle.tsx          # light ⇄ dark
    │   ├── NotificationBell.tsx     # popover of reply / digest notifications
    │   ├── CommandPalette.tsx       # ⌘K palette + SearchButton
    │   ├── MagazineFeed.tsx, StorySlide.tsx, feed/*   # the home issue (see feed.md)
    │   ├── AttitudeBar.tsx, CommentThread.tsx, AuthShell.tsx
    │   ├── ui/                      # our design-system components (see design-system.md)
    │   └── shadcn/                  # generated Radix primitives, restyled (do not mix with ui/)
    └── lib/
        ├── api.ts                   # typed API client + helpers (images, price, byline, timeAgo)
        ├── auth.tsx                 # AuthProvider / useAuth
        ├── schemas.ts               # zod schemas for login / register / settings
        ├── motion.ts                # shared easing, durations, variants
        └── utils.ts                 # cn() = clsx + tailwind-merge
```

## Routes

| Route | File | Data | Doc |
|-------|------|------|-----|
| `/` | `app/page.tsx` → `MagazineFeed` | `/products/feed/`, `/shelves/?featured=1` | [feed.md](feed.md) |
| `/p/[slug]` | `app/p/[slug]/page.tsx` | `/products/<slug>/`, `/products/` (related), comments | [pages.md](pages.md#product-story-pslug) |
| `/explore?q=&category=` | `app/explore/page.tsx` | `/products/?q=&category=`, `/categories/` | [pages.md](pages.md#explore-explore) |
| `/shelves` | `app/shelves/page.tsx` | `/shelves/` | [pages.md](pages.md#shelves) |
| `/shelves/[slug]` | `app/shelves/[slug]/page.tsx` | `/shelves/<slug>/` | [pages.md](pages.md#shelves) |
| `/u/[username]` | `app/u/[username]/page.tsx` | `/users/<u>/`, `/users/<u>/attitudes/` | [pages.md](pages.md#profile-uusername) |
| `/login?next=` | `app/login/page.tsx` | `/auth/token/`, `/me/` | [pages.md](pages.md#sign-in--register) |
| `/register` | `app/register/page.tsx` | `/auth/register/` | [pages.md](pages.md#sign-in--register) |
| `/settings` | `app/settings/page.tsx` | `/me/` (PATCH) | [pages.md](pages.md#settings) |

### Rendering model

Pages are **client components** that fetch in `useEffect` through `lib/api.ts`. Auth tokens live in
`localStorage`, so the server can't make authenticated requests. Consequences:

- Static routes prerender a shell (skeleton) and then hydrate.
- Titles: static routes get them from small server `layout.tsx` files (`metadata`), while dynamic pages
  set `document.title` after their data loads. The root layout supplies the `%s · CurateShelf`
  template.
- Pages using `useSearchParams` (Explore, Login) are wrapped in `<Suspense>`, as Next requires.

Moving public pages (feed, product, shelves) to server components with `fetch` would improve SEO and
first paint. It's a reasonable next step, because those endpoints don't need auth except for
`my_attitude`.

## Data layer: `lib/api.ts`

- `API_URL` / `MEDIA_URL` come from `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_MEDIA_URL`
  (`frontend/.env.local`, see `.env.local.example`).
- `request<T>()` adds `Content-Type: application/json` and `Authorization: Bearer <cs_access>`, disables
  caching, throws `Error(responseText)` on non-2xx, and returns `undefined` for 204.
- `api.*` is one typed method per endpoint. List methods accept paginated or plain arrays.
- Types: `Product` (incl. `gallery_preview`, `media`), `Profile`, `Comment`, `Collection`,
  `AttitudeKind`.
- Helpers:

| Helper | Purpose |
|--------|---------|
| `mediaUrl(path)` | Makes a `/media/...` path absolute |
| `productImages(p)` | Ordered, de-duplicated `{src, alt}[]`: detail `media` hero variants, or cover + `gallery_preview`. **All photo rendering goes through this** |
| `formatPrice(p)` | `Intl` currency formatting (`$68`, `$320`) |
| `byline(p, joiner)` | "Maker · Brand", dropping the brand when the maker name already contains it |
| `coverTone(seed)` | Deterministic warm placeholder colours shown while an image loads |
| `timeAgo(iso)` | "3 hours ago" via `Intl.RelativeTimeFormat` (notifications) |

## State

There's no global store. State is local to pages, apart from:

- **Auth:** `AuthProvider` context (`useAuth()`), see [../backend/authentication.md](../backend/authentication.md#frontend-session-frontendsrclibauthtsx).
- **Theme:** next-themes (`useTheme()`), persisted in `localStorage['theme']`.
- **Forms:** react-hook-form per form.
- **URL state:** Explore filters (`?q`, `?category`), the login redirect (`?next`) and the feed
  position (`#no-N`).
- **Global UI singletons:** one `<Toaster>` (in Providers) and one `<CommandPalette>` (in layout),
  reached through `toast()` and `openCommandPalette()`.

## Configuration

| File | What |
|------|------|
| `next.config.ts` | `images.remotePatterns` for `/media/**` on the `NEXT_PUBLIC_MEDIA_URL` host plus `localhost`/`127.0.0.1:8000`. AVIF/WebP output |
| `.env.local` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MEDIA_URL` |
| `eslint.config.mjs` | `next/core-web-vitals` + TypeScript |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| `components.json` | shadcn/ui CLI config (`npx shadcn@latest add <name>` writes to `src/components/shadcn/`) |

If you serve media from another host (S3, CDN), add it to `remotePatterns`, or `next/image` will refuse
to load it.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on :3000 (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
