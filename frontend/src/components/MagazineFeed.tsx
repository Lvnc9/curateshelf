"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Collection, type Product } from "@/lib/api";
import { StorySlide } from "./StorySlide";
import { CoverSlide } from "./feed/CoverSlide";
import { ClosingSlide } from "./feed/ClosingSlide";
import { IssueCounter, IssueRail } from "./feed/IssueRail";
import { Skeleton } from "./ui/Skeleton";

/**
 * The home "issue": cover → product stories (alternating bleed / spread) → featured shelves.
 * Vertical scroll-snap; ↑↓ / J K move one page; an IntersectionObserver drives the issue rail.
 */
export function MagazineFeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shelves, setShelves] = useState<Collection[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.feed(), api.shelves(true)])
      .then(([feed, featured]) => {
        setProducts(feed);
        setShelves(featured);
        setStatus("ready");
      })
      .catch((e: Error) => {
        setError(e.message);
        setStatus("error");
      });
  }, []);

  const total = products.length;
  const lastIndex = total + (shelves.length ? 1 : 0);

  const jumpTo = useCallback((index: number) => {
    const root = scroller.current;
    const target = root?.querySelector<HTMLElement>(`[data-slide="${index}"]`);
    if (root && target) root.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  }, []);

  // Deep links: /#no-3 opens the issue at story 3 (stories load async, so jump once they exist).
  useEffect(() => {
    if (status !== "ready") return;
    const match = /^#no-(\d+)$/.exec(window.location.hash);
    const root = scroller.current;
    const target = match && root?.querySelector<HTMLElement>(`[data-slide="${Number(match[1])}"]`);
    if (root && target) root.scrollTo({ top: target.offsetTop, behavior: "instant" });
  }, [status]);

  // Keep the address bar shareable as the reader moves (replaceState: no history spam, no jump).
  useEffect(() => {
    if (status !== "ready") return;
    const hash = current >= 1 && current <= total ? `#no-${current}` : "";
    if (window.location.hash !== hash) {
      history.replaceState(history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
  }, [current, status, total]);

  // Track which slide is on screen.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurrent(Number((e.target as HTMLElement).dataset.slide));
        }
      },
      { root, threshold: 0.55 }
    );
    root.querySelectorAll("[data-slide]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [status, total, shelves.length]);

  // Keyboard paging.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowDown" || e.key === "j" || e.key === "PageDown") {
        e.preventDefault();
        jumpTo(Math.min(current + 1, lastIndex));
      } else if (e.key === "ArrowUp" || e.key === "k" || e.key === "PageUp") {
        e.preventDefault();
        jumpTo(Math.max(current - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, lastIndex, jumpTo]);

  const updateProduct = useCallback(
    (updated: Product) => setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x))),
    []
  );

  // Odd-numbered stories past the first are spreads (paper on the right, where the rail sits).
  const railSurface = current > total || (current >= 1 && (current - 1) % 2 === 1) ? "paper" : "photo";

  const section =
    current === 0 ? "Cover" : current > total ? "Shelves" : products[current - 1]?.category?.name ?? "Editorial";

  return (
    <div className="relative bg-ink">
      <div
        ref={scroller}
        className="scrollbar-none h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
      >
        <CoverSlide products={products} onJump={jumpTo} />

        {status === "loading" && (
          <section className="flex h-[100dvh] snap-start flex-col justify-end gap-4 bg-ink px-5 pb-28 md:px-14" aria-busy="true">
            <span className="sr-only">Loading stories…</span>
            <Skeleton className="h-3 w-48 !bg-white/10" />
            <Skeleton className="h-14 w-[min(36rem,80%)] !bg-white/10" />
            <Skeleton className="h-6 w-[min(24rem,60%)] !bg-white/10" />
          </section>
        )}

        {status === "error" && (
          <section className="flex h-[100dvh] snap-start flex-col items-start justify-center gap-4 bg-paper px-5 text-ink md:px-14">
            <p className="text-eyebrow uppercase text-muted">The presses are quiet</p>
            <h2 className="text-title">We couldn&rsquo;t load this issue.</h2>
            <p className="max-w-lg text-muted">
              Is the API running on <code className="text-ink-soft">{process.env.NEXT_PUBLIC_API_URL || "127.0.0.1:8000/api"}</code>?
              {error ? <span className="mt-2 block text-sm opacity-70">{error.slice(0, 160)}</span> : null}
            </p>
            <button type="button" onClick={() => location.reload()} className="mt-2 border-b border-ink/40 pb-1 text-[0.72rem] uppercase tracking-[0.22em]">
              Try again
            </button>
          </section>
        )}

        {products.map((p, i) => (
          <StorySlide
            key={p.id}
            product={p}
            number={i + 1}
            total={total}
            layout={i % 2 === 1 ? "spread" : "bleed"}
            onProductChange={updateProduct}
          />
        ))}

        {status === "ready" && shelves.length > 0 && <ClosingSlide shelves={shelves} index={total + 1} />}
      </div>

      {total > 0 && (
        <>
          <IssueRail current={current} total={total} section={section} surface={railSurface} onJump={jumpTo} />
          <IssueCounter current={current} total={total} />
        </>
      )}
    </div>
  );
}
