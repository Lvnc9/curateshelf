# Design system: "Quiet Editorial"

The visual language of CurateShelf, inspired by independent print magazines: warm paper, hairline rules,
light serif display type, generous whitespace and photography doing the talking. It comes in a **light**
and a **dark** theme.

## Tokens (`frontend/src/app/globals.css`)

Tokens are defined in two layers:

1. **Raw palette** as CSS variables on `:root` (light) and `.dark` (dark). next-themes toggles the
   `.dark` class on `<html>`.
2. **`@theme inline`** maps those variables to Tailwind utilities (`bg-paper`, `text-ink`, …) and to
   shadcn/ui's semantic names (`bg-popover`, `text-muted-foreground`, `ring-ring`, …).

Components only ever use utilities, so they flip themes with no `dark:` classes needed.

### Colour

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `paper` | `#f5f1ea` | `#141310` | Page background |
| `paper-deep` | `#ece6db` | `#1f1d1a` | Skeletons, monograms, hover rows |
| `ink` | `#1b1a17` | `#ece5d8` | Body text, solid buttons |
| `ink-soft` | `#4a463f` | `#c8bfb0` | Long-form copy, subtitles |
| `muted` | `#6b655b` | `#a39b8e` | Eyebrows, metadata |
| `hairline` | ink @ 12% | linen @ 14% | Rules, dividers, **default border colour** |
| `clay` | `#b4846c` | `#c4937a` | Accent **fill only** (badges, active heart) |
| `clay-deep` | `#8e6450` | `#d6a68b` | Accent text, drop caps, low stock |
| `danger` | `#a5402d` | `#e8826b` | Form errors, destructive |
| `sage` | `#8fa89a` | `#9fb8aa` | Secondary accent |
| **`chalk`** | `#f5f1ea` | *(fixed)* | Text/fills **on photographs** |
| **`night`** | `#1b1a17` | *(fixed)* | Backdrops **behind photographs** |

Contrast (WCAG AA, measured). Light: muted 4.83, clay-deep 4.56, danger 5.53 on paper. Dark: muted
6.76, clay-deep 8.57, danger 6.93 on paper.

**The chalk/night rule:** anything layered on a photo (the cover, the shelf hero, captions on shelf
cards, the auth photo panel, the rail and AttitudeBar over images) must use `chalk`/`night`, not
`paper`/`ink`. Otherwise its colour inverts in dark mode while the photo stays the same.

**shadcn aliases:** `background`/`popover`/`card` → paper, `foreground` → ink, `primary` → ink (with
`primary-foreground` → paper), `secondary`/`accent` → paper-deep, `muted-foreground` → muted,
`destructive` → danger, `border` → hairline, `input` → ink @ 25%, `ring` → clay-deep.

A base rule sets every element's default `border-color` to the hairline. Tailwind v4 defaults it to
`currentColor`, which gave Radix surfaces a hard outline.

### Typography

| Token | Size | Use |
|-------|------|-----|
| `text-eyebrow` | 11px, tracking 0.26em | Uppercase labels ("TABLEWARE · 3 MIN READ") |
| `text-lede` | 17–21px fluid | Intro paragraphs |
| `text-title` | 32–56px fluid | Section titles |
| `text-display` | 44–92px fluid | Page and story titles |
| `text-hero` | 56–160px fluid | Cover wordmark, shelf hero |

- **Fraunces** (variable, `SOFT` + `opsz` axes, italic) for all `h1–h3`, at weight 300.
  `.font-display-italic` gives the soft italic accent.
- **Outfit** (300/400/500) for UI and body text, at base weight 300.
- The font CSS variables are set on **`<html>`** on purpose. `--font-display` is declared on `:root`
  and only resolves if `--font-fraunces` exists there too.

### Motion

| Where | Value |
|-------|-------|
| CSS | `ease-editorial` = `cubic-bezier(0.22, 1, 0.36, 1)`, `animate-kenburns`, `animate-fade-in`, `shimmer`. `tw-animate-css` provides the shadcn open/close animations |
| JS (`lib/motion.ts`) | `EASE`, `DURATION.{quick,base,slow}`, `rise`, `stagger(step, delay)` |

Reduced motion is handled twice: a global CSS rule, plus `MotionConfig reducedMotion="user"` in
`Providers.tsx`.

### Utilities

`.grain`, `.drop-cap`, `.font-display-italic`, `.scrollbar-none`.

## Two component layers

| Folder | What | Who edits it |
|--------|------|--------------|
| `components/ui/` | **Our** design-system components (editorial look, product-specific) | Us |
| `components/shadcn/` | shadcn/ui primitives on **Radix** (dialog, sheet, popover, dropdown-menu, command, switch, form, label, sonner, button) for accessibility mechanics | Generated, then restyled by us |

The shadcn files were restyled once at the source: 2px corners, one soft editorial shadow, a warm
blurred `night` overlay, Fraunces titles, and eyebrow group labels.

**Adding a primitive:** `cd frontend && npx shadcn@latest add <name>`. Then check the file's `cn`
import, because the CLI has emitted `from "cn"`; it must be `from "@/lib/utils"`. Restyle it to
match: corners, shadow, overlay.

### `components/ui/`

| Component | Notes |
|-----------|-------|
| `EditorialImage` | The **only** way to show a photo. Fills a `relative` parent, shows a `coverTone()` placeholder (dimmed in dark mode) and fades in |
| `ProductCard` | 4:5 card. Crossfades to the second photo on hover |
| `Gallery` | Scroll-snap carousel with arrows, counter, progress bar and thumbnails |
| `Eyebrow`, `Hairline`, `Button`/`ButtonLink`, `Field`/`TextArea` | Primitives (`Field`/`TextArea` are for simple non-RHF inputs) |
| `FormFields`: `TextFormField`, `SwitchFormField`, `applyServerErrors` | react-hook-form bindings in the editorial style (see *Forms* below) |
| `Skeleton`, `CardGridSkeleton` | Shimmer placeholders |
| `Icons` | Thin-stroke icons incl. `SunIcon`, `MoonIcon`, `BellIcon`, `CommandIcon` |

### App-level components (`components/`)

| Component | Built on | Notes |
|-----------|----------|-------|
| `SiteNav` | shadcn Sheet | Desktop bar plus a mobile sheet (focus trap, Esc, scroll lock) with links and a theme switch |
| `UserMenu` | shadcn DropdownMenu | Shelf, settings, Light / Dark / Match-system radio group, sign out |
| `ThemeToggle` | next-themes | One-tap light/dark in the desktop bar |
| `NotificationBell` | shadcn Popover | See [pages.md](pages.md#notifications) |
| `CommandPalette` + `SearchButton` | shadcn CommandDialog (cmdk) | ⌘K palette, see [pages.md](pages.md#command-palette-k) |
| `AttitudeBar`, `CommentThread`, `AuthShell` | – | See [pages.md](pages.md) |

## Feedback: toasts

One `<Toaster>` (sonner, themed to paper/ink) is mounted in `Providers`. Call it from anywhere:

```ts
import { toast } from "sonner";
toast.success("Settings saved");
toast.error("Your note didn't post", { description: "Your text is still in the box. Try again." });
```

Use toasts for **outcomes of actions** (saved, posted, failed, signed in/out). Keep validation errors
inline next to the field.

## Forms

Pattern: `react-hook-form` + `zod` (schemas in `lib/schemas.ts`) + shadcn `<Form>`, rendered with
`TextFormField` / `SwitchFormField`.

```tsx
const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
    <TextFormField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
  </form>
</Form>
```

- Labels, `aria-invalid`, `aria-describedby` and the inline message are wired by shadcn's
  `FormItem`/`FormControl`.
- Server errors: `applyServerErrors(err, form.setError, fieldNames)` puts DRF field errors on their
  fields and returns the rest for `<FormError>`.

## Rules of thumb

1. Photos go through `EditorialImage` (or `next/image` for static assets) with a meaningful `sizes`.
2. Colours come from tokens, never raw hex. On photos, use `chalk`/`night`.
3. Check contrast in **both** themes for anything smaller than 18px.
4. `<button>` doesn't inherit `text-transform`, so put `uppercase` on the button itself.
5. Every async view has a skeleton, an empty state and an error state, and every user action has a
   success or failure signal (toast or inline).
6. Interactive toggles expose state (`aria-pressed`, `aria-selected`, `aria-checked`, `aria-current`).
   Prefer the Radix primitive whenever a component needs focus management.
7. New motion uses `lib/motion.ts` variants.
