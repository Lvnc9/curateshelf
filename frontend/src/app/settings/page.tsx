"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, refresh, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) {
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.updateMe({
      display_name: displayName,
      bio,
      location,
      website,
    });
    await refresh();
    setMessage("Saved.");
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-6 pb-24 pt-28">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Settings</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
          rows={4}
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        />
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        />
        <button type="submit" className="bg-[var(--ink)] px-5 py-3 text-[var(--paper)]">
          Save
        </button>
        {message && <p className="text-sm text-[var(--accent-deep)]">{message}</p>}
      </form>
    </div>
  );
}