"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { api, type Product } from "@/lib/api";
import { rise, stagger } from "@/lib/motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { Eyebrow } from "@/components/ui/primitives";
import { CloseIcon, SearchIcon } from "@/components/ui/Icons";

type Category = { id: number; name: string; slug: string };

function Explore() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";

  const [draft, setDraft] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    setLoading(true);
    api
      .products({ q: q || undefined, category: category || undefined })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q, category]);

  /** Filters live in the URL so results are shareable and survive back/forward. */
  function update(next: { q?: string; category?: string }) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    const s = sp.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    update({ q: draft.trim() });
  }

  const activeName = categories.find((c) => c.slug === category)?.name;

  return (
    <div className="mx-auto max-w-[90rem] px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <header className="grid gap-10 border-b border-hairline pb-10 md:grid-cols-[1fr_minmax(0,28rem)] md:items-end">
        <div>
          <Eyebrow>The catalogue</Eyebrow>
          <h1 className="mt-4 text-display">
            Explore <span className="font-display-italic">everything</span>
          </h1>
          <p className="mt-5 max-w-md text-lede text-muted">
            Every piece we have written about, searchable by material, maker or mood.
          </p>
        </div>

        <form onSubmit={onSearch} role="search" className="group relative">
          <label htmlFor="explore-search" className="sr-only">
            Search the catalogue
          </label>
          <SearchIcon className="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            id="explore-search"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Linen, brass, morning…"
            className="w-full border-0 border-b border-ink/25 bg-transparent py-3.5 pl-8 pr-10 font-display text-2xl font-light outline-none transition-colors placeholder:text-muted/60 focus:border-ink [&::-webkit-search-cancel-button]:hidden"
          />
          {draft && (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                update({ q: "" });
              }}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted hover:text-ink"
            >
              <CloseIcon className="size-4" />
            </button>
          )}
        </form>
      </header>

      <nav aria-label="Filter by category" className="scrollbar-none -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        {[{ id: 0, name: "All", slug: "" }, ...categories].map((c) => {
          const active = c.slug === category;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => update({ category: c.slug })}
              className={`shrink-0 rounded-full border px-4 py-2 text-[0.72rem] uppercase tracking-[0.18em] transition-colors duration-300 ${
                active ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink-soft hover:border-ink/60"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </nav>

      <p className="mt-8 text-eyebrow uppercase text-muted" aria-live="polite">
        {loading
          ? "Searching…"
          : `${products.length} ${products.length === 1 ? "piece" : "pieces"}${activeName ? ` in ${activeName}` : ""}${q ? ` matching “${q}”` : ""}`}
      </p>

      <div className="mt-8">
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : products.length ? (
          <motion.div
            key={`${q}|${category}`}
            variants={stagger(0.06)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4"
          >
            {products.map((p, i) => (
              <motion.div key={p.id} variants={rise}>
                <ProductCard product={p} priority={i < 4} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display-italic text-3xl text-ink-soft">Nothing on this shelf yet.</p>
            <p className="mt-3 text-muted">Try a different word, or clear the filters.</p>
            <button
              type="button"
              onClick={() => {
                setDraft("");
                update({ q: "", category: "" });
              }}
              className="mt-8 border-b border-ink/40 pb-1 text-[0.72rem] uppercase tracking-[0.22em] hover:border-ink"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[90rem] px-5 pt-36 md:px-10">
          <CardGridSkeleton count={6} />
        </div>
      }
    >
      <Explore />
    </Suspense>
  );
}
