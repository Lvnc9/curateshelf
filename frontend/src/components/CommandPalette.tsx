"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { api, formatPrice, productImages, type Collection, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/shadcn/command";
import { EditorialImage } from "./ui/EditorialImage";
import { ArrowRight, MoonIcon, SearchIcon, SunIcon } from "./ui/Icons";

const OPEN_EVENT = "curateshelf:open-palette";

/** Open the palette from anywhere (e.g. a nav button) without prop-drilling. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type Category = { id: number; name: string; slug: string };

/**
 * ⌘K / Ctrl+K (or "/") command palette: jump to stories, shelves, categories and pages,
 * run a full-text catalogue search, switch theme, sign out. Mounted once in the root layout.
 * Data loads lazily on first open; cmdk filters client-side over titles + keywords.
 */
export function CommandPalette() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<{ products: Product[]; shelves: Collection[]; categories: Category[] } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open || data) return;
    Promise.all([api.products(), api.shelves(), api.categories()])
      .then(([products, shelves, categories]) => setData({ products, shelves, categories }))
      .catch(() => setData({ products: [], shelves: [], categories: [] }));
  }, [open, data]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const q = query.trim();

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search CurateShelf"
      description="Jump to a story, shelf or page"
      className="top-[18%] translate-y-0 sm:max-w-xl"
      showCloseButton={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search stories, shelves, pages…"
        className="font-display text-lg font-light"
      />
      <CommandList className="max-h-[min(28rem,60vh)]">
        <CommandEmpty>
          <span className="font-display-italic text-lg text-muted">Nothing on this shelf.</span>
        </CommandEmpty>

        {q.length >= 2 && (
          <CommandGroup heading="Search">
            <CommandItem value={`search-catalogue ${q}`} onSelect={() => go(`/explore?q=${encodeURIComponent(q)}`)}>
              <SearchIcon />
              Search the catalogue for &ldquo;{q}&rdquo;
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        {!data && (
          <p className="px-4 py-6 text-eyebrow uppercase text-muted" role="status">
            Opening the catalogue…
          </p>
        )}

        {data && data.products.length > 0 && (
          <CommandGroup heading="Stories">
            {data.products.map((p) => {
              const [cover] = productImages(p);
              return (
                <CommandItem
                  key={p.id}
                  value={p.title}
                  keywords={[p.subtitle, p.brand, p.maker_name, p.category?.name ?? "", ...p.tags.map((t) => t.name)]}
                  onSelect={() => go(`/p/${p.slug}`)}
                >
                  <span className="relative size-9 shrink-0 overflow-hidden">
                    <EditorialImage src={cover?.src} alt="" tone={p.slug} sizes="36px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1.05rem]">{p.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {p.category?.name} · {formatPrice(p)}
                    </span>
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {data && data.shelves.length > 0 && (
          <CommandGroup heading="Shelves">
            {data.shelves.map((s) => (
              <CommandItem key={s.id} value={`shelf ${s.title}`} keywords={[s.description]} onSelect={() => go(`/shelves/${s.slug}`)}>
                <ArrowRight />
                {s.title}
                <CommandShortcut>{s.product_count} pieces</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {data && data.categories.length > 0 && (
          <CommandGroup heading="Categories">
            {data.categories.map((c) => (
              <CommandItem key={c.id} value={`category ${c.name}`} onSelect={() => go(`/explore?category=${c.slug}`)}>
                <ArrowRight />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="Go to">
          <CommandItem value="page issue home feed" onSelect={() => go("/")}>
            <ArrowRight />
            The current issue
          </CommandItem>
          <CommandItem value="page explore catalogue" onSelect={() => go("/explore")}>
            <ArrowRight />
            Explore
          </CommandItem>
          <CommandItem value="page shelves collections" onSelect={() => go("/shelves")}>
            <ArrowRight />
            All shelves
          </CommandItem>
          {user ? (
            <>
              <CommandItem value="account your shelf profile" onSelect={() => go(`/u/${user.username}`)}>
                <ArrowRight />
                Your shelf
              </CommandItem>
              <CommandItem value="account settings profile" onSelect={() => go("/settings")}>
                <ArrowRight />
                Settings
              </CommandItem>
            </>
          ) : (
            <CommandItem value="account sign in login" onSelect={() => go("/login")}>
              <ArrowRight />
              Sign in
            </CommandItem>
          )}
        </CommandGroup>

        <CommandGroup heading="Preferences">
          <CommandItem value="theme light mode" onSelect={() => (setTheme("light"), setOpen(false))}>
            <SunIcon />
            Light theme
          </CommandItem>
          <CommandItem value="theme dark mode night" onSelect={() => (setTheme("dark"), setOpen(false))}>
            <MoonIcon />
            Dark theme
          </CommandItem>
          {user && (
            <CommandItem
              value="account sign out logout"
              onSelect={() => {
                logout();
                setOpen(false);
                toast("Signed out", { description: "See you in the next issue." });
              }}
            >
              <ArrowRight />
              Sign out
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5 text-eyebrow uppercase text-muted">
        <span>↑↓ to move · ↵ to open</span>
        <span>esc to close</span>
      </div>
    </CommandDialog>
  );
}

/** Nav trigger: a quiet "Search ⌘K" pill on desktop, an icon on mobile. */
export function SearchButton({ compact = false }: { compact?: boolean }) {
  const [mac, setMac] = useState(true);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);

  if (compact) {
    return (
      <button type="button" onClick={openCommandPalette} aria-label="Search" className="grid size-9 place-items-center rounded-full">
        <SearchIcon className="size-[1.15rem]" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Search (Command K)"
      className="mr-1 flex h-9 items-center gap-2 rounded-full border border-current/25 pl-3 pr-2 text-[0.72rem] uppercase tracking-[0.22em] opacity-75 transition hover:border-current/60 hover:opacity-100"
    >
      <SearchIcon className="size-3.5" />
      Search
      <kbd className="rounded-[3px] border border-current/25 px-1.5 py-0.5 font-sans text-[0.62rem] tracking-normal normal-case">
        {mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
