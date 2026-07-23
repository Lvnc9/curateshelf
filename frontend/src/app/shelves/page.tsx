"use client";

import { useEffect, useState } from "react";
import { api, type Collection } from "@/lib/api";
import Link from "next/link";

export default function ShelvesPage() {
  const [shelves, setShelves] = useState<Collection[]>([]);

  useEffect(() => {
    api.shelves().then(setShelves);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <h1 className="font-[family-name:var(--font-display)] text-5xl">Shelves</h1>
      <p className="mt-2 text-[var(--muted)]">Curated collections from the editorial desk.</p>
      <div className="mt-12 space-y-10">
        {shelves.map((s) => (
          <Link
            key={s.id}
            href={`/shelves/${s.slug}`}
            className="block border-t border-[var(--ink)]/15 pt-8 transition hover:border-[var(--accent)]"
          >
            <h2 className="font-[family-name:var(--font-display)] text-3xl">{s.title}</h2>
            <p className="mt-2 max-w-xl text-[var(--muted)]">{s.description}</p>
            {s.is_featured && (
              <span className="mt-3 inline-block text-xs uppercase tracking-wider text-[var(--accent-deep)]">
                Featured
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}