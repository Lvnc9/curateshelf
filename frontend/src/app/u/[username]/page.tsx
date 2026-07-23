"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, coverTone, type AttitudeKind, type Product, type Profile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<AttitudeKind>("love");
  const [items, setItems] = useState<{ kind: AttitudeKind; product: Product }[]>([]);
  const isMe = user?.username === params.username;

  useEffect(() => {
    if (!params.username) return;
    api.profile(params.username).then(setProfile).catch(() => setProfile(null));
  }, [params.username]);

  useEffect(() => {
    if (!params.username) return;
    api
      .userAttitudes(params.username, tab === "skip" && !isMe ? "love" : tab)
      .then(setItems)
      .catch(() => setItems([]));
  }, [params.username, tab, isMe]);

  // show love/curious for everyone; skip only for me
  const tabs: AttitudeKind[] = isMe ? ["love", "curious", "skip"] : ["love", "curious"];

  if (!profile) {
    return <p className="px-6 pt-28 text-[var(--muted)]">Profile not found.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-28">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{profile.role}</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl">
        {profile.display_name || profile.username}
      </h1>
      <p className="text-[var(--muted)]">@{profile.username}</p>
      {profile.bio && <p className="mt-4 max-w-xl text-lg">{profile.bio}</p>}
      <div className="mt-6 flex gap-6 text-sm text-[var(--muted)]">
        <span>{profile.loves_given} loves</span>
        <span>{profile.curious_given} curious</span>
        {profile.location && <span>{profile.location}</span>}
      </div>

      <section className="mt-14">
        <div className="flex gap-4 text-xs uppercase tracking-wider">
          {tabs.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={tab === k ? "text-[var(--ink)]" : "text-[var(--muted)]"}
            >
              {k === "love" ? "Loved" : k === "curious" ? "Curious" : "Skipped"}
            </button>
          ))}
        </div>
        <ul className="mt-8 space-y-4">
          {items.map(({ product: p }) => {
            const tone = coverTone(p.slug);
            return (
              <li key={p.id}>
                <Link href={`/p/${p.slug}`} className="flex items-center gap-4">
                  <div
                    className="h-16 w-12"
                    style={{ background: `linear-gradient(160deg, ${tone.from}, ${tone.to})` }}
                  />
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl">{p.title}</h3>
                    <p className="text-sm text-[var(--muted)]">{p.subtitle}</p>
                  </div>
                </Link>
              </li>
            );
          })}
          {!items.length && (
            <p className="text-[var(--muted)]">Nothing here yet — browse the magazine feed.</p>
          )}
        </ul>
        {isMe && (
          <Link href="/settings" className="mt-10 inline-block text-sm underline text-[var(--muted)]">
            Edit profile settings
          </Link>
        )}
      </section>
    </div>
  );
}