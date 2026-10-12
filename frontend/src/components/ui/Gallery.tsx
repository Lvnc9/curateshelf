"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageRef } from "@/lib/api";
import { EditorialImage } from "./EditorialImage";
import { ArrowLeft, ArrowRight } from "./Icons";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Horizontal photo carousel built on native scroll-snap, so touch swipe, trackpad
 * and drag all work without JS. Arrow keys work while it has focus. Shows a
 * hairline progress bar, an "01 / 03" counter and a thumbnail strip.
 */
export function Gallery({
  images,
  tone,
  sizes = "(min-width: 1024px) 55vw, 100vw",
  className = "",
}: {
  images: ImageRef[];
  tone: string;
  sizes?: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = images.length;

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }, [count]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!count) return null;

  return (
    <div
      className={className}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product photos"
    >
      <div className="relative">
        <div
          ref={track}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              goTo(active + 1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              goTo(active - 1);
            }
          }}
          className="scrollbar-none flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-offset-[-3px] md:aspect-[5/6]"
        >
          {images.map((img, i) => (
            <figure
              key={img.src}
              className="relative h-full w-full shrink-0 snap-center"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <EditorialImage
                src={img.src}
                alt={img.alt}
                tone={tone}
                sizes={sizes}
                priority={i === 0}
              />
            </figure>
          ))}
        </div>

        {count > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous photo"
              className="pointer-events-auto grid size-10 place-items-center rounded-full bg-paper/85 text-ink backdrop-blur transition hover:bg-paper disabled:opacity-0"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === count - 1}
              aria-label="Next photo"
              className="pointer-events-auto grid size-10 place-items-center rounded-full bg-paper/85 text-ink backdrop-blur transition hover:bg-paper disabled:opacity-0"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center gap-4">
          <span className="text-eyebrow tabular-nums text-muted" aria-live="polite">
            {pad(active + 1)} / {pad(count)}
          </span>
          <div className="relative h-px flex-1 bg-hairline">
            <div
              className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-500 ease-editorial"
              style={{ width: `${((active + 1) / count) * 100}%` }}
            />
          </div>
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={`relative size-11 overflow-hidden transition-opacity ${
                  i === active ? "opacity-100 ring-1 ring-ink ring-offset-2 ring-offset-paper" : "opacity-55 hover:opacity-100"
                }`}
              >
                <EditorialImage src={img.src} alt="" tone={tone} sizes="44px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
