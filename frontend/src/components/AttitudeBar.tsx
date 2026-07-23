"use client";

import { motion } from "framer-motion";
import { api, type AttitudeKind, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LABELS: Record<AttitudeKind, string> = {
  love: "Love",
  curious: "Curious",
  skip: "Skip",
};

export function AttitudeBar({
  product,
  onChange,
  compact = false,
}: {
  product: Product;
  onChange?: (p: Product) => void;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(product);

  async function choose(kind: AttitudeKind) {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const next =
        local.my_attitude === kind
          ? await api.clearAttitude(local.slug)
          : await api.setAttitude(local.slug, kind);
      const updated = {
        ...local,
        my_attitude: next.kind,
        love_count: next.love_count,
        curious_count: next.curious_count,
        skip_count: next.skip_count,
      };
      setLocal(updated);
      onChange?.(updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "gap-3"}`}>
      {(Object.keys(LABELS) as AttitudeKind[]).map((kind) => {
        const active = local.my_attitude === kind;
        const count =
          kind === "love" ? local.love_count : kind === "curious" ? local.curious_count : local.skip_count;
        return (
          <motion.button
            key={kind}
            type="button"
            disabled={busy}
            whileTap={{ scale: 0.92 }}
            animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            onClick={() => choose(kind)}
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]"
                : "border-white/30 bg-black/20 text-white/90 backdrop-blur-sm hover:border-white/60"
            }`}
          >
            {LABELS[kind]}
            <span className="ml-1 opacity-70">{count}</span>
          </motion.button>
        );
      })}
    </div>
  );
}