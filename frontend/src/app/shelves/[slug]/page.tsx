"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, coverTone, type Collection } from "@/lib/api";
import Link from "next/link";

export default function ShelfDetailPage() {
  const params = useParams<{ slug: string }>();
  const [shelf, setShelf] = useState<Collection | null>(null);

  useEffect(() => {
    if (!params.slug) return;
    api.shelf(params.slug).then(setShelf);
  }, [params.slug]);

  if (!shelf) {
    return <p className="px-6 pt-28 animate-pulse text-[var(--muted)]">Loading shelf…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Shelf</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl">{shelf.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">{shelf.description}</p>

      <ul className="mt-14 space-y-8">
        {shelf.items?.map((item) => {
          const p = item.product;
          const tone = coverTone(p.slug);
          return (
            <li key={p.id}>
              <Link href={`/p/${p.slug}`} className="flex gap-6 group">
                <div
                  className="h-36 w-28 shrink-0 transition group-hover:scale-[1.02]"
                  style={{ background: `linear-gradient(160deg, ${tone.from}, ${tone.to})` }}
                />
                <div className="pt-2">
                  <h2 className="font-[family-name:var(--font-display)] text-3xl">{p.title}</h2>
                  <p className="mt-2 text-[var(--muted)]">{item.blurb || p.subtitle}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}