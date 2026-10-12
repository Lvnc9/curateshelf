"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, type AttitudeKind, type Product, type Profile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rise, stagger } from "@/lib/motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { CardGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { Eyebrow } from "@/components/ui/primitives";
import { CuriousIcon, HeartIcon, SkipIcon } from "@/components/ui/Icons";

const TAB_META: Record<AttitudeKind, { label: string; empty: string; Icon: typeof HeartIcon }> = {
  love: { label: "Loved", empty: "Nothing loved yet.", Icon: HeartIcon },
  curious: { label: "Curious", empty: "Nothing marked curious yet.", Icon: CuriousIcon },
  skip: { label: "Skipped", empty: "Nothing skipped.", Icon: SkipIcon },
};

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [tab, setTab] = useState<AttitudeKind>("love");
  const [items, setItems] = useState<{ kind: AttitudeKind; product: Product }[] | null>(null);
  const isMe = user?.username === params.username;

  useEffect(() => {
    if (!params.username) return;
    api
      .profile(params.username)
      .then((p) => {
        setProfile(p);
        document.title = `${p.display_name || p.username} · CurateShelf`;
      })
      .catch(() => setProfile(null));
  }, [params.username]);

  useEffect(() => {
    if (!params.username) return;
    setItems(null);
    // Skipped items are private: only fetch them for the owner.
    api
      .userAttitudes(params.username, tab === "skip" && !isMe ? "love" : tab)
      .then(setItems)
      .catch(() => setItems([]));
  }, [params.username, tab, isMe]);

  const tabs: AttitudeKind[] = isMe ? ["love", "curious", "skip"] : ["love", "curious"];

  if (profile === undefined) {
    return (
      <div className="mx-auto max-w-[90rem] px-5 pt-36 md:px-10" aria-busy="true">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="mt-6 h-12 w-72" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-36 text-center">
        <Eyebrow>Reader not found</Eyebrow>
        <h1 className="mt-4 text-title">No one by that name on the shelf.</h1>
      </div>
    );
  }

  const name = profile.display_name || profile.username;
  const counts: Partial<Record<AttitudeKind, number>> = {
    love: profile.loves_given,
    curious: profile.curious_given,
    skip: profile.skips_given,
  };

  return (
    <div className="mx-auto max-w-[90rem] px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <motion.header
        variants={stagger(0.08)}
        initial="hidden"
        animate="show"
        className="grid gap-8 border-b border-hairline pb-12 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-10"
      >
        <motion.span
          variants={rise}
          className="grid size-20 place-items-center rounded-full bg-paper-deep font-display text-4xl font-light text-clay-deep md:size-28 md:text-5xl"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </motion.span>
        <div>
          <motion.p variants={rise} className="text-eyebrow uppercase text-muted">
            {profile.role || "Reader"} · @{profile.username}
            {profile.location && <> · {profile.location}</>}
          </motion.p>
          <motion.h1 variants={rise} className="mt-3 text-display">
            {name}
          </motion.h1>
          {profile.bio && (
            <motion.p variants={rise} className="mt-4 max-w-xl text-lede text-ink-soft">
              {profile.bio}
            </motion.p>
          )}
          {profile.website && (
            <motion.a
              variants={rise}
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block border-b border-ink/30 text-sm hover:border-ink"
            >
              {profile.website.replace(/^https?:\/\//, "")}
            </motion.a>
          )}
        </div>
        <motion.dl variants={rise} className="flex gap-10">
          <div>
            <dt className="text-eyebrow uppercase text-muted">Loved</dt>
            <dd className="mt-1 font-display text-4xl font-light tabular-nums">{profile.loves_given}</dd>
          </div>
          <div>
            <dt className="text-eyebrow uppercase text-muted">Curious</dt>
            <dd className="mt-1 font-display text-4xl font-light tabular-nums">{profile.curious_given}</dd>
          </div>
          {isMe && (
            <div className="self-end">
              <Link href="/settings" className="border-b border-ink/30 pb-1 text-[0.72rem] uppercase tracking-[0.22em] hover:border-ink">
                Edit profile
              </Link>
            </div>
          )}
        </motion.dl>
      </motion.header>

      <section className="mt-10" aria-label={`${name}'s shelf`}>
        <div role="tablist" aria-label="Shelf" className="flex gap-8 border-b border-hairline">
          {tabs.map((k) => {
            const { label, Icon } = TAB_META[k];
            const active = tab === k;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(k)}
                className={`-mb-px inline-flex items-center gap-2 border-b pb-4 text-[0.72rem] uppercase tracking-[0.2em] transition-colors ${
                  active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <Icon className="size-4" filled={active} />
                {label}
                {typeof counts[k] === "number" && <span className="tabular-nums opacity-60">{counts[k]}</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-10" role="tabpanel">
          {items === null ? (
            <CardGridSkeleton count={3} />
          ) : items.length ? (
            <motion.div
              key={tab}
              variants={stagger(0.06)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4"
            >
              {items.map(({ product }) => (
                <motion.div key={product.id} variants={rise}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-20 text-center">
              <p className="font-display-italic text-2xl text-ink-soft">{TAB_META[tab].empty}</p>
              <Link href="/" className="mt-6 inline-block border-b border-ink/40 pb-1 text-[0.72rem] uppercase tracking-[0.22em] hover:border-ink">
                Browse the issue
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
