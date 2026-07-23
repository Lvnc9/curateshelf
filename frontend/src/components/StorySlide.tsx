"use client";

import { coverTone, mediaUrl, type Product } from "@/lib/api";
import { AttitudeBar } from "./AttitudeBar";
import { motion } from "framer-motion";
import Link from "next/link";

export function StorySlide({
  product,
  index,
  onProductChange,
}: {
  product: Product;
  index: number;
  onProductChange?: (p: Product) => void;
}) {
  const tone = coverTone(product.slug);
  const cover = mediaUrl(product.cover_image);

  return (
    <section
      className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden"
      data-slug={product.slug}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: cover
            ? undefined
            : `radial-gradient(ellipse at 30% 20%, ${tone.accent}33, transparent 50%), linear-gradient(160deg, ${tone.from}, ${tone.to})`,
          backgroundImage: cover ? `url(${cover})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        initial={{ scale: 1.08 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: false, amount: 0.6 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 pt-24 md:px-12 md:pb-20">
        {index === 0 && (
          <motion.p
            className="mb-auto font-[family-name:var(--font-display)] text-5xl text-white md:text-7xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            CurateShelf
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: false, amount: 0.5 }}
          className="max-w-2xl"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/60">
            {product.category?.name || "Editorial"} · {product.reading_time_estimate} min
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl leading-[1.05] text-white md:text-6xl">
            {product.title}
          </h2>
          <p className="mt-4 max-w-lg text-base text-white/80 md:text-lg">{product.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <AttitudeBar product={product} onChange={onProductChange} />
            <Link
              href={`/p/${product.slug}`}
              className="text-sm uppercase tracking-[0.18em] text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              See details
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}