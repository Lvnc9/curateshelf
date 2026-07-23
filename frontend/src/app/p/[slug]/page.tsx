"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, coverTone, mediaUrl, type Product } from "@/lib/api";
import { AttitudeBar } from "@/components/AttitudeBar";
import { CommentThread } from "@/components/CommentThread";
import Link from "next/link";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.slug) return;
    api
      .product(params.slug)
      .then(setProduct)
      .catch((e) => setError(e.message));
  }, [params.slug]);

  if (error) {
    return <p className="px-6 pt-28 text-[var(--muted)]">{error}</p>;
  }
  if (!product) {
    return <p className="px-6 pt-28 animate-pulse text-[var(--muted)]">Loading…</p>;
  }

  const tone = coverTone(product.slug);
  const cover = mediaUrl(product.cover_image);

  return (
    <article className="bg-[var(--paper)] text-[var(--ink)]">
      <div
        className="relative h-[55vh] min-h-[320px] w-full"
        style={{
          background: cover
            ? undefined
            : `linear-gradient(160deg, ${tone.from}, ${tone.to})`,
          backgroundImage: cover ? `url(${cover})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--paper)] via-transparent to-black/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24 -mt-24">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
          {product.brand || product.maker_name}
          {product.category ? ` · ${product.category.name}` : ""}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-tight md:text-6xl">
          {product.title}
        </h1>
        <p className="mt-4 text-xl text-[var(--muted)]">{product.subtitle}</p>

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <AttitudeBar product={product} onChange={setProduct} />
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl">
              {product.currency} {product.price}
            </p>
            {product.compare_at_price && (
              <p className="text-sm text-[var(--muted)] line-through">
                {product.currency} {product.compare_at_price}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="mt-6 bg-[var(--ink)] px-6 py-3 text-sm uppercase tracking-[0.16em] text-[var(--paper)]"
        >
          Inquire / Reserve
        </button>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {product.inventory_count} in stock · demo CTA (no payments in v1)
        </p>

        <div className="prose mt-12 max-w-none whitespace-pre-wrap text-lg leading-relaxed text-[var(--ink)]/85">
          {product.description}
        </div>

        {!!product.attributes?.length && (
          <dl className="mt-12 grid gap-4 border-t border-[var(--ink)]/10 pt-8 sm:grid-cols-2">
            {product.attributes.map((a) => (
              <div key={a.id}>
                <dt className="text-xs uppercase tracking-wider text-[var(--muted)]">{a.key}</dt>
                <dd className="mt-1 text-lg">{a.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <CommentThread slug={product.slug} />

        <Link href="/" className="mt-12 inline-block text-sm uppercase tracking-wider text-[var(--muted)]">
          ← Back to magazine
        </Link>
      </div>
    </article>
  );
}