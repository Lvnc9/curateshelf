"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, coverTone, type Product } from "@/lib/api";
import Link from "next/link";

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  function load(query?: string) {
    setLoading(true);
    api
      .products(query)
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    load(q.trim() || undefined);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-28">
      <h1 className="font-[family-name:var(--font-display)] text-5xl">Explore</h1>
      <p className="mt-2 text-[var(--muted)]">Search the editorial catalog.</p>
      <form onSubmit={onSearch} className="mt-8 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="flex-1 border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        />
        <button type="submit" className="bg-[var(--ink)] px-5 text-[var(--paper)]">
          Search
        </button>
      </form>

      {loading ? (
        <p className="mt-12 animate-pulse text-[var(--muted)]">Searching…</p>
      ) : (
        <ul className="mt-12 space-y-0">
          {products.map((p) => {
            const tone = coverTone(p.slug);
            return (
              <li key={p.id}>
                <Link
                  href={`/p/${p.slug}`}
                  className="flex items-stretch gap-5 border-t border-[var(--ink)]/10 py-6 transition hover:bg-black/[0.02]"
                >
                  <div
                    className="h-24 w-20 shrink-0"
                    style={{ background: `linear-gradient(160deg, ${tone.from}, ${tone.to})` }}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                      {p.category?.name}
                    </p>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl">{p.title}</h2>
                    <p className="text-[var(--muted)]">{p.subtitle}</p>
                  </div>
                </Link>
              </li>
            );
          })}
          {!products.length && <p className="text-[var(--muted)]">No products found.</p>}
        </ul>
      )}
    </div>
  );
}