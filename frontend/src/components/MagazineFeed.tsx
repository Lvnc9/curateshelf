"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Collection, type Product } from "@/lib/api";
import { StorySlide } from "./StorySlide";
import Link from "next/link";

export function MagazineFeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shelves, setShelves] = useState<Collection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.feed(), api.shelves(true)])
      .then(([feed, featured]) => {
        setProducts(feed);
        setShelves(featured);
      })
      .catch((e) => setError(e.message));
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ top: dir * window.innerHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ink)] px-6 text-[var(--paper)]">
        <p>Could not load feed. Is the API running? {error}</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ink)] text-[var(--paper)]">
        <p className="animate-pulse tracking-widest">Opening the shelf…</p>
      </div>
    );
  }

  return (
    <div className="relative bg-[var(--ink)]">
      <div
        ref={scroller}
        className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll scroll-smooth"
      >
        {products.map((p, i) => (
          <StorySlide
            key={p.id}
            product={p}
            index={i}
            onProductChange={(updated) =>
              setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            }
          />
        ))}

        <section className="flex min-h-[100dvh] snap-start flex-col justify-center bg-[var(--paper)] px-6 py-24 text-[var(--ink)] md:px-12">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Featured shelves</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl md:text-5xl">
            Continue by collection
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {shelves.map((s) => (
              <Link
                key={s.id}
                href={`/shelves/${s.slug}`}
                className="group border-t border-[var(--ink)]/15 pt-6 transition hover:border-[var(--accent)]"
              >
                <h3 className="font-[family-name:var(--font-display)] text-3xl group-hover:text-[var(--accent-deep)]">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-md text-[var(--muted)]">{s.description}</p>
              </Link>
            ))}
          </div>
          <p className="mt-16 text-sm text-[var(--muted)]">Use ↑↓ or J/K to move between stories</p>
        </section>
      </div>
    </div>
  );
}