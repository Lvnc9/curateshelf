"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, formatPrice, mediaUrl, productImages, type Collection } from "@/lib/api";
import { rise, stagger } from "@/lib/motion";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { Eyebrow } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, ArrowRight } from "@/components/ui/Icons";

export default function ShelfDetailPage() {
  const params = useParams<{ slug: string }>();
  const [shelf, setShelf] = useState<Collection | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    api
      .shelf(params.slug)
      .then((s) => {
        setShelf(s);
        document.title = `${s.title} · CurateShelf`;
      })
      .catch(() => setMissing(true));
  }, [params.slug]);

  if (missing) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-36 text-center">
        <Eyebrow>Shelf not found</Eyebrow>
        <h1 className="mt-4 text-title">This collection has been put away.</h1>
        <Link href="/shelves" className="mt-8 inline-block border-b border-ink/40 pb-1 text-[0.72rem] uppercase tracking-[0.22em]">
          All shelves
        </Link>
      </div>
    );
  }

  if (!shelf) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-[70vh] w-full" />
        <div className="mx-auto max-w-3xl space-y-4 px-5 pt-12">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    );
  }

  const items = shelf.items ?? [];

  return (
    <article className="pb-28">
      {/* Hero */}
      <header className="grain relative flex h-[78vh] min-h-[28rem] items-end overflow-hidden bg-ink text-paper">
        <EditorialImage src={mediaUrl(shelf.cover)} alt="" tone={shelf.slug} priority kenBurns />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40" />
        <motion.div
          variants={stagger(0.1, 0.2)}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto w-full max-w-[90rem] px-5 pb-12 md:px-10 md:pb-16"
        >
          <motion.div variants={rise}>
            <Link href="/shelves" className="group inline-flex items-center gap-2 text-eyebrow uppercase text-paper/90 hover:text-paper">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              All shelves
            </Link>
          </motion.div>
          <motion.h1 variants={rise} className="mt-5 text-hero">
            {shelf.title}
          </motion.h1>
          <motion.p variants={rise} className="mt-4 text-eyebrow uppercase text-paper/90">
            {items.length} {items.length === 1 ? "piece" : "pieces"} on this shelf
          </motion.p>
        </motion.div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
        <p className="font-display-italic text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-snug text-ink-soft">
          &ldquo;{shelf.description}&rdquo;
        </p>
        <p className="mt-6 text-eyebrow uppercase text-muted">The editors</p>
      </section>

      {/* Items: alternating left / right with the blurb as caption */}
      <ol className="mx-auto max-w-[90rem] space-y-24 px-5 md:space-y-36 md:px-10">
        {items.map((item, i) => {
          const p = item.product;
          const [cover] = productImages(p);
          const flip = i % 2 === 1;
          return (
            <motion.li
              key={p.id}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              <Link
                href={`/p/${p.slug}`}
                className={`group grid items-center gap-8 md:gap-16 ${flip ? "md:grid-cols-[1fr_1.25fr]" : "md:grid-cols-[1.25fr_1fr]"}`}
              >
                <div className={`relative aspect-[4/5] overflow-hidden md:aspect-[5/6] ${flip ? "md:order-2" : ""}`}>
                  <EditorialImage
                    src={cover?.src}
                    alt={cover?.alt ?? p.title}
                    tone={p.slug}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="transition-transform duration-[1.4s] ease-editorial group-hover:scale-[1.03]"
                  />
                </div>
                <div className={`md:max-w-md ${flip ? "md:order-1 md:justify-self-end" : ""}`}>
                  <p className="font-display text-6xl font-light text-clay-deep/70 tabular-nums md:text-7xl">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <Eyebrow className="mt-6">{p.category?.name ?? "Editorial"} · {formatPrice(p)}</Eyebrow>
                  <h2 className="mt-3 text-title">{p.title}</h2>
                  <p className="mt-4 text-lede text-ink-soft">{item.blurb || p.subtitle}</p>
                  <span className="mt-8 inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.22em]">
                    <span className="border-b border-ink/30 pb-1 transition-colors group-hover:border-ink">Read the story</span>
                    <ArrowRight className="size-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </article>
  );
}
