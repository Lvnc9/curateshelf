"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { forwardRef } from "react";
import { byline as bylineOf, formatPrice, productImages, type Product } from "@/lib/api";
import { rise, stagger } from "@/lib/motion";
import { AttitudeBar } from "./AttitudeBar";
import { EditorialImage } from "./ui/EditorialImage";
import { ArrowRight } from "./ui/Icons";

export type SlideLayout = "bleed" | "spread";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One product story in the magazine feed, a full viewport tall.
 *
 * - "bleed": the cover photo fills the screen; copy sits bottom-left on a soft gradient.
 * - "spread" (md+ only): a two-page spread. Photo on the left 58%, paper page on the
 *   right with the copy and a small inset of the second gallery photo. On mobile a
 *   spread falls back to the bleed treatment, using the same markup and breakpoint classes.
 */
export const StorySlide = forwardRef<
  HTMLElement,
  {
    product: Product;
    number: number;
    total: number;
    layout: SlideLayout;
    onProductChange?: (p: Product) => void;
  }
>(function StorySlide({ product, number, total, layout, onProductChange }, ref) {
  const [cover, inset] = productImages(product);
  const spread = layout === "spread";
  const byline = bylineOf(product);

  return (
    <section
      ref={ref}
      data-slide={number}
      aria-label={`Story ${number} of ${total}: ${product.title}`}
      className={`relative h-[100dvh] w-full snap-start snap-always overflow-hidden ${
        spread ? "md:grid md:grid-cols-[58fr_42fr] md:bg-paper" : ""
      }`}
    >
      {/* Photograph */}
      <div className={`grain absolute inset-0 ${spread ? "md:relative md:inset-auto md:h-full" : ""}`}>
        <EditorialImage
          src={cover?.src}
          alt={cover?.alt ?? product.title}
          tone={product.slug}
          sizes={spread ? "(min-width: 768px) 58vw, 100vw" : "100vw"}
          priority={number <= 2}
          kenBurns
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/50 ${
            spread ? "md:hidden" : ""
          }`}
        />
      </div>

      {/* Copy */}
      <motion.div
        variants={stagger(0.09, 0.15)}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.55 }}
        className={`relative z-10 flex h-full flex-col justify-end px-5 pb-[max(6.5rem,env(safe-area-inset-bottom))] pt-24 text-white md:px-14 md:pb-24 ${
          spread
            ? "md:justify-center md:px-[clamp(2.5rem,5vw,6rem)] md:pb-16 md:text-ink"
            : "max-w-4xl"
        }`}
      >
        <motion.p variants={rise} className="text-eyebrow uppercase opacity-75">
          <span className="tabular-nums">No. {pad(number)}</span>
          <span className="mx-2.5 opacity-50">—</span>
          {product.category?.name ?? "Editorial"}
          <span className="mx-2.5 opacity-50">·</span>
          {product.reading_time_estimate} min read
        </motion.p>

        <motion.h2
          variants={rise}
          className={`mt-4 text-display text-balance ${spread ? "md:text-[clamp(2.5rem,1.2rem+3.4vw,4.75rem)]" : ""}`}
        >
          <Link href={`/p/${product.slug}`} className="hover:opacity-90">
            {product.title}
          </Link>
        </motion.h2>

        <motion.p
          variants={rise}
          className={`mt-5 max-w-xl font-display-italic text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] leading-snug opacity-90 ${
            spread ? "md:text-ink-soft" : ""
          }`}
        >
          {product.subtitle}
        </motion.p>

        {byline && (
          <motion.p variants={rise} className={`mt-4 text-sm opacity-70 ${spread ? "md:text-muted md:opacity-100" : ""}`}>
            {byline}
          </motion.p>
        )}

        {spread && inset && (
          <motion.figure variants={rise} className="relative mt-10 hidden aspect-[4/3] w-[min(62%,22rem)] md:block">
            <EditorialImage src={inset.src} alt={inset.alt} tone={product.slug} sizes="22rem" />
            <figcaption className="sr-only">{inset.alt}</figcaption>
          </motion.figure>
        )}

        <motion.div variants={rise} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
          {/* Over a photo on mobile; on paper for desktop spreads */}
          <div className={spread ? "md:hidden" : ""}>
            <AttitudeBar product={product} onChange={onProductChange} surface="photo" />
          </div>
          {spread && (
            <div className="hidden md:block">
              <AttitudeBar product={product} onChange={onProductChange} surface="paper" />
            </div>
          )}
          <Link
            href={`/p/${product.slug}`}
            className="group inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.22em]"
          >
            <span className="border-b border-current/40 pb-1 transition-colors group-hover:border-current">
              Read the story · {formatPrice(product)}
            </span>
            <ArrowRight className="size-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
});
