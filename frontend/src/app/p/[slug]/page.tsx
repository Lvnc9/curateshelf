"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, byline as bylineOf, formatPrice, productImages, type Product } from "@/lib/api";
import { rise, stagger } from "@/lib/motion";
import { AttitudeBar } from "@/components/AttitudeBar";
import { CommentThread } from "@/components/CommentThread";
import { Gallery } from "@/components/ui/Gallery";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button, Eyebrow } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "@/components/ui/Icons";

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[90rem] gap-10 px-5 pb-24 pt-24 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16 md:px-10 md:pt-28" aria-busy="true">
      <Skeleton className="aspect-[4/5] w-full md:aspect-[5/6]" />
      <div className="space-y-5 md:pt-10">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="mt-10 h-10 w-72" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.slug) return;
    setProduct(null);
    api
      .product(params.slug)
      .then((p) => {
        setProduct(p);
        document.title = `${p.title} · CurateShelf`;
        return api.products().then((all) => {
          const others = all.filter((x) => x.slug !== p.slug);
          const same = others.filter((x) => x.category?.id === p.category?.id);
          setRelated([...same, ...others.filter((x) => !same.includes(x))].slice(0, 3));
        });
      })
      .catch((e: Error) => setError(e.message));
  }, [params.slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-36 text-center">
        <Eyebrow>Not on the shelf</Eyebrow>
        <h1 className="mt-4 text-title">We couldn&rsquo;t find this piece.</h1>
        <Link href="/explore" className="mt-8 inline-block border-b border-ink/40 pb-1 text-[0.72rem] uppercase tracking-[0.22em]">
          Explore the catalogue
        </Link>
      </div>
    );
  }
  if (!product) return <ProductSkeleton />;

  const images = productImages(product);
  const byline = bylineOf(product, " for ");
  const lowStock = product.inventory_count > 0 && product.inventory_count <= 10;

  return (
    <article className="pb-24">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-5 pt-20 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16 md:px-10 md:pt-28">
        {/* Left page: photographs */}
        <div className="-mx-5 md:mx-0">
          <div className="md:sticky md:top-28">
            <Gallery images={images} tone={product.slug} className="[&>div:last-child]:px-5 md:[&>div:last-child]:px-0" />
          </div>
        </div>

        {/* Right page: the story */}
        <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="md:pt-6">
          <motion.div variants={rise} className="flex items-center gap-3">
            <Link href="/" className="group inline-flex items-center gap-2 text-eyebrow uppercase text-muted hover:text-ink">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Issue
            </Link>
            <span className="text-muted/50">/</span>
            {product.category ? (
              <Link href={`/explore?category=${product.category.slug}`} className="text-eyebrow uppercase text-muted hover:text-ink">
                {product.category.name}
              </Link>
            ) : (
              <Eyebrow>Editorial</Eyebrow>
            )}
          </motion.div>

          <motion.h1 variants={rise} className="mt-6 text-display text-balance">
            {product.title}
          </motion.h1>
          <motion.p variants={rise} className="mt-5 font-display-italic text-[clamp(1.35rem,1.1rem+0.8vw,1.85rem)] leading-snug text-ink-soft">
            {product.subtitle}
          </motion.p>
          {byline && (
            <motion.p variants={rise} className="mt-4 text-sm text-muted">
              Made by {byline}
            </motion.p>
          )}

          <motion.div variants={rise} className="mt-10 flex items-end justify-between gap-6 border-y border-hairline py-6">
            <div>
              <p className="font-display text-4xl font-light tabular-nums">{formatPrice(product)}</p>
              {product.compare_at_price && (
                <p className="mt-1 text-sm text-muted line-through">
                  {formatPrice({ price: product.compare_at_price, currency: product.currency })}
                </p>
              )}
            </div>
            <p className={`text-right text-eyebrow uppercase ${lowStock ? "text-clay-deep" : "text-muted"}`}>
              {product.inventory_count === 0
                ? "Currently sold out"
                : lowStock
                  ? `Only ${product.inventory_count} left`
                  : `${product.inventory_count} in stock`}
            </p>
          </motion.div>

          <motion.div variants={rise} className="mt-8 flex flex-col gap-6">
            <Button type="button" className="w-full sm:w-auto sm:self-start">Inquire / Reserve</Button>
            <p className="-mt-3 text-xs text-muted">Demo CTA. Payments aren&rsquo;t part of v1.</p>
            <AttitudeBar product={product} onChange={setProduct} />
          </motion.div>

          {product.description && (
            <motion.div variants={rise} className="mt-14">
              <Eyebrow>The story</Eyebrow>
              <div className="drop-cap mt-5 max-w-[34rem] whitespace-pre-line text-lede text-ink-soft">
                {product.description}
              </div>
            </motion.div>
          )}

          {!!product.attributes?.length && (
            <motion.div variants={rise} className="mt-14">
              <Eyebrow>Details</Eyebrow>
              <dl className="mt-4 border-t border-hairline">
                {product.attributes.map((a) => (
                  <div key={a.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-hairline py-3.5">
                    <dt className="text-sm text-muted">{a.key}</dt>
                    <dd className="text-[0.95rem]">{a.value}</dd>
                  </div>
                ))}
                {product.sku && (
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-hairline py-3.5">
                    <dt className="text-sm text-muted">Reference</dt>
                    <dd className="text-[0.95rem] tabular-nums">{product.sku}</dd>
                  </div>
                )}
              </dl>
            </motion.div>
          )}

          {!!product.tags.length && (
            <motion.ul variants={rise} className="mt-8 flex flex-wrap gap-2" aria-label="Tags">
              {product.tags.map((t) => (
                <li key={t.id} className="rounded-full border border-hairline px-3 py-1 text-xs text-ink-soft">
                  {t.name}
                </li>
              ))}
            </motion.ul>
          )}

          <CommentThread slug={product.slug} />
        </motion.div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-24 max-w-[90rem] px-5 md:mt-32 md:px-10" aria-labelledby="related-heading">
          <div className="flex items-end justify-between border-b border-hairline pb-5">
            <h2 id="related-heading" className="text-title">
              More from <span className="font-display-italic">{product.category?.name ?? "the issue"}</span>
            </h2>
            <Link href="/explore" className="hidden border-b border-ink/30 pb-1 text-[0.72rem] uppercase tracking-[0.22em] hover:border-ink sm:inline">
              View all
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-8">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
