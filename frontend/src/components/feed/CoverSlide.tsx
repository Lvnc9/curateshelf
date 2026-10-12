"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { EASE } from "@/lib/motion";
import { ArrowDown } from "../ui/Icons";

const SEASONS = ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter"];

export function issueLabel(date = new Date()) {
  return `${SEASONS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Slide 0: the magazine cover. Masthead photo, oversized wordmark,
 * and an "In this issue" contents list that jumps to each story.
 */
export function CoverSlide({
  products,
  onJump,
}: {
  products: Product[];
  onJump: (index: number) => void;
}) {
  const contents = products.slice(0, 5);

  return (
    <section
      data-slide={0}
      aria-label="Cover"
      className="grain relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-ink text-paper"
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: EASE }}
      >
        <Image
          src="/editorial/masthead.jpg"
          alt="Brass vessels on a dark table with incense smoke curling upward"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_center]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/70" />

      <div className="relative z-10 mx-auto flex h-full max-w-[90rem] flex-col px-5 pb-10 pt-24 md:px-10 md:pb-12 md:pt-28">
        <motion.div
          className="flex items-center justify-between border-y border-paper/25 py-2.5 text-eyebrow uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: EASE }}
        >
          <span>Issue 01</span>
          <span className="hidden sm:inline">Objects worth slowing down for</span>
          <span suppressHydrationWarning>{issueLabel()}</span>
        </motion.div>

        <motion.h1
          className="mt-[clamp(1.5rem,6vh,4rem)] text-hero"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.25, ease: EASE }}
        >
          Curate
          <br className="sm:hidden" />
          <span className="font-display-italic">Shelf</span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-md text-lede text-paper/85"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: EASE }}
        >
          A slow magazine of made things: carafes, linens, lamps and small rituals, photographed
          and written up one at a time.
        </motion.p>

        <div className="mt-auto flex items-end justify-between gap-8">
          <motion.nav
            aria-label="In this issue"
            className="hidden w-full max-w-sm md:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85, ease: EASE }}
          >
            <p className="text-eyebrow uppercase text-paper/70">In this issue</p>
            <ol className="mt-3 border-t border-paper/25">
              {contents.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onJump(i + 1)}
                    className="group flex w-full items-baseline gap-4 border-b border-paper/15 py-2.5 text-left"
                  >
                    <span className="text-eyebrow tabular-nums text-paper/60">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-lg transition-transform duration-500 ease-editorial group-hover:translate-x-1">
                      {p.title}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </motion.nav>

          <motion.button
            type="button"
            onClick={() => onJump(1)}
            className="flex shrink-0 flex-col items-center gap-3 text-eyebrow uppercase text-paper/80 hover:text-paper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <span>Begin</span>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="size-5" />
            </motion.span>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
