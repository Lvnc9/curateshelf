"use client";

import { AnimatePresence, motion } from "framer-motion";
import { api, type AttitudeKind, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CuriousIcon, HeartIcon, SkipIcon } from "./ui/Icons";
import { EASE } from "@/lib/motion";

const KINDS: { kind: AttitudeKind; label: string; Icon: typeof HeartIcon }[] = [
  { kind: "love", label: "Love", Icon: HeartIcon },
  { kind: "curious", label: "Curious", Icon: CuriousIcon },
  { kind: "skip", label: "Skip", Icon: SkipIcon },
];

const countKey = { love: "love_count", curious: "curious_count", skip: "skip_count" } as const;

/** Apply an attitude change to the counts locally (for optimistic UI). */
function applyLocal(p: Product, next: AttitudeKind | null): Product {
  const out = { ...p, my_attitude: next };
  if (p.my_attitude) out[countKey[p.my_attitude]] = Math.max(0, p[countKey[p.my_attitude]] - 1);
  if (next) out[countKey[next]] = out[countKey[next]] + 1;
  return out;
}

/**
 * Love / Curious / Skip. Optimistic: counts update instantly and roll back if the API fails.
 * `surface="photo"` renders frosted pills for use over imagery; "paper" for light pages.
 */
export function AttitudeBar({
  product,
  onChange,
  surface = "paper",
}: {
  product: Product;
  onChange?: (p: Product) => void;
  surface?: "photo" | "paper";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [local, setLocal] = useState(product);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLocal(product), [product]);

  async function choose(kind: AttitudeKind) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/p/${product.slug}`)}`);
      return;
    }
    if (busy) return;
    const previous = local;
    const next = local.my_attitude === kind ? null : kind;
    const optimistic = applyLocal(local, next);
    setLocal(optimistic);
    setBusy(true);
    try {
      const res = next ? await api.setAttitude(local.slug, next) : await api.clearAttitude(local.slug);
      const confirmed = {
        ...optimistic,
        my_attitude: res.kind,
        love_count: res.love_count,
        curious_count: res.curious_count,
        skip_count: res.skip_count,
      };
      setLocal(confirmed);
      onChange?.(confirmed);
    } catch {
      setLocal(previous);
    } finally {
      setBusy(false);
    }
  }

  const onPhoto = surface === "photo";

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Your reaction">
      {KINDS.map(({ kind, label, Icon }) => {
        const active = local.my_attitude === kind;
        const count = local[countKey[kind]];
        const idle = onPhoto
          ? "border-white/35 bg-black/15 text-white backdrop-blur-md hover:border-white/70"
          : "border-ink/20 text-ink hover:border-ink/60";
        const on = onPhoto
          ? "border-chalk bg-chalk text-night"
          : "border-ink bg-ink text-paper";
        return (
          <motion.button
            key={kind}
            type="button"
            aria-pressed={active}
            aria-label={`${label}, ${count} ${count === 1 ? "reader" : "readers"}`}
            whileTap={{ scale: 0.94 }}
            onClick={() => choose(kind)}
            className={`group inline-flex h-10 items-center gap-2 rounded-full border pl-3.5 pr-4 text-[0.72rem] uppercase tracking-[0.18em] transition-colors duration-300 ${
              active ? on : idle
            }`}
          >
            <motion.span
              animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
              className={active && kind === "love" ? "text-clay" : ""}
            >
              <Icon className="size-4" filled={active} />
            </motion.span>
            <span>{label}</span>
            <span className="relative inline-flex h-4 min-w-[1ch] overflow-hidden tabular-nums opacity-70">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={count}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
