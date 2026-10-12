"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { mediaUrl, type Collection } from "@/lib/api";
import { rise, stagger } from "@/lib/motion";
import { EditorialImage } from "../ui/EditorialImage";
import { Eyebrow } from "../ui/primitives";
import { ArrowRight } from "../ui/Icons";

/** Last page of the issue: featured shelves as photographic cards. */
export function ClosingSlide({ shelves, index }: { shelves: Collection[]; index: number }) {
  return (
    <section
      data-slide={index}
      aria-label="Continue by collection"
      className="flex min-h-[100dvh] snap-start flex-col justify-center bg-paper px-5 pb-16 pt-28 text-ink md:pl-10 md:pr-24"
    >
      <motion.div
        className="mx-auto w-full max-w-[90rem]"
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.3 }}
      >
        <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-6">
          <div>
            <Eyebrow>End of issue · Featured shelves</Eyebrow>
            <h2 className="mt-3 text-title">
              Continue <span className="font-display-italic">by collection</span>
            </h2>
          </div>
          <Link href="/explore" className="group inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.22em]">
            <span className="border-b border-ink/30 pb-1 group-hover:border-ink">Browse everything</span>
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
          {shelves.map((s) => (
            <motion.div key={s.id} variants={rise}>
              <Link href={`/shelves/${s.slug}`} className="group relative block aspect-[16/11] overflow-hidden md:aspect-[16/10]">
                <EditorialImage
                  src={mediaUrl(s.cover)}
                  alt=""
                  tone={s.slug}
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="transition-transform duration-[1.4s] ease-editorial group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-paper md:p-8">
                  <p className="text-eyebrow uppercase text-paper/75">
                    Shelf{typeof s.product_count === "number" ? ` · ${s.product_count} pieces` : ""}
                  </p>
                  <h3 className="mt-2 text-[clamp(1.75rem,1.2rem+1.6vw,2.75rem)] leading-none">{s.title}</h3>
                  <p className="mt-3 max-w-md text-sm text-paper/80">{s.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p variants={rise} className="mt-12 text-center text-eyebrow uppercase text-muted">
          Tip: move between stories with ↑ ↓ or J / K
        </motion.p>
      </motion.div>
    </section>
  );
}
