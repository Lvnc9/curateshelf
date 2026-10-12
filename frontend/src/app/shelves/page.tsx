"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, mediaUrl, type Collection } from "@/lib/api";
import { rise } from "@/lib/motion";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { Eyebrow } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowRight } from "@/components/ui/Icons";

export default function ShelvesPage() {
  const [shelves, setShelves] = useState<Collection[] | null>(null);

  useEffect(() => {
    document.title = "Shelves · CurateShelf";
    api.shelves().then(setShelves).catch(() => setShelves([]));
  }, []);

  return (
    <div className="mx-auto max-w-[90rem] px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <header className="border-b border-hairline pb-10">
        <Eyebrow>From the editorial desk</Eyebrow>
        <h1 className="mt-4 text-display">
          Shelves<span className="font-display-italic">, curated</span>
        </h1>
        <p className="mt-5 max-w-lg text-lede text-muted">
          Small collections built around a mood, a material or a time of day.
        </p>
      </header>

      {shelves === null ? (
        <div className="mt-14 space-y-16" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="space-y-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : shelves.length === 0 ? (
        <p className="py-24 text-center font-display-italic text-2xl text-muted">No shelves have been arranged yet.</p>
      ) : (
        <ol className="mt-14 space-y-20 md:space-y-28">
          {shelves.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <motion.li key={s.id} variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
                <Link
                  href={`/shelves/${s.slug}`}
                  className={`group grid gap-8 md:items-end md:gap-14 ${flip ? "md:grid-cols-[1fr_1.4fr]" : "md:grid-cols-[1.4fr_1fr]"}`}
                >
                  <div className={`relative aspect-[16/10] overflow-hidden ${flip ? "md:order-2" : ""}`}>
                    <EditorialImage
                      src={mediaUrl(s.cover)}
                      alt=""
                      tone={s.slug}
                      sizes="(min-width: 768px) 55vw, 100vw"
                      priority={i === 0}
                      className="transition-transform duration-[1.4s] ease-editorial group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className={flip ? "md:order-1" : ""}>
                    <p className="text-eyebrow uppercase text-muted">
                      <span className="tabular-nums">Shelf {String(i + 1).padStart(2, "0")}</span>
                      {typeof s.product_count === "number" && <> · {s.product_count} pieces</>}
                      {s.is_featured && <span className="text-clay-deep"> · Featured</span>}
                    </p>
                    <h2 className="mt-3 text-title">{s.title}</h2>
                    <p className="mt-4 max-w-md text-lede text-ink-soft">{s.description}</p>
                    <span className="mt-8 inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.22em]">
                      <span className="border-b border-ink/30 pb-1 transition-colors group-hover:border-ink">Open the shelf</span>
                      <ArrowRight className="size-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
