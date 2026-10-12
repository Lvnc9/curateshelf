import Link from "next/link";
import { formatPrice, productImages, type Product } from "@/lib/api";
import { EditorialImage } from "./EditorialImage";
import { Eyebrow } from "./primitives";

/**
 * Portrait product card for grids (Explore, shelves, profile, "more from").
 * On hover-capable devices the second photo crossfades in over the cover.
 */
export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 50vw",
  caption,
  priority = false,
}: {
  product: Product;
  sizes?: string;
  /** Optional editorial line (e.g. shelf blurb) shown instead of the subtitle. */
  caption?: string;
  priority?: boolean;
}) {
  const [cover, alt] = productImages(product);

  return (
    <Link href={`/p/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden">
        <EditorialImage
          src={cover?.src}
          alt={cover?.alt ?? product.title}
          tone={product.slug}
          sizes={sizes}
          priority={priority}
          className="transition-transform duration-[1.2s] ease-editorial group-hover:scale-[1.03]"
        />
        {alt && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-editorial [@media(hover:hover)]:group-hover:opacity-100">
            <EditorialImage src={alt.src} alt="" tone={product.slug} sizes={sizes} />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <Eyebrow>{product.category?.name ?? "Editorial"}</Eyebrow>
        <span className="text-sm text-ink-soft tabular-nums">{formatPrice(product)}</span>
      </div>
      <h3 className="mt-1.5 text-[1.375rem] leading-tight md:text-2xl">
        <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-editorial group-hover:bg-[length:100%_1px]">
          {product.title}
        </span>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{caption || product.subtitle}</p>
    </Link>
  );
}
