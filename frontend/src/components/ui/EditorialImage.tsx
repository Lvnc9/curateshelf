"use client";

import Image from "next/image";
import { useState } from "react";
import { coverTone } from "@/lib/api";

/**
 * The one way to put a photo on screen. Fills its (relatively positioned) parent,
 * shows a warm tone placeholder until the image decodes, then fades in.
 * `kenBurns` adds the slow settle-in zoom used on full-bleed feed slides.
 */
export function EditorialImage({
  src,
  alt,
  tone,
  sizes = "100vw",
  priority = false,
  kenBurns = false,
  className = "",
  position = "center",
}: {
  src: string | null | undefined;
  alt: string;
  /** Any stable string (usually the product slug) that picks the placeholder tone. */
  tone: string;
  sizes?: string;
  priority?: boolean;
  kenBurns?: boolean;
  className?: string;
  position?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const t = coverTone(tone);

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: `linear-gradient(160deg, ${t.from}, ${t.to})` }}
    >
      {/* Dark theme: dim the warm placeholder so loading photos don't flash bright panels */}
      <div aria-hidden className="absolute inset-0 hidden bg-night/80 dark:block" />
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          className={`object-cover transition-opacity duration-700 ease-editorial ${
            loaded ? "opacity-100" : "opacity-0"
          } ${kenBurns && loaded ? "animate-kenburns" : ""}`}
          style={{ objectPosition: position }}
        />
      )}
    </div>
  );
}
