"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FormError } from "@/components/AuthShell";
import { Button, Eyebrow, Field, TextArea } from "@/components/ui/primitives";

export default function SettingsPage() {
  const { user, refresh, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/settings");
    if (user) {
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setState("saving");
    try {
      await api.updateMe({ display_name: displayName, bio, location, website });
      await refresh();
      setState("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setState("idle");
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto grid max-w-[90rem] gap-12 px-5 pb-28 pt-28 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:px-10 md:pt-36">
      <div>
        <Eyebrow>Your account</Eyebrow>
        <h1 className="mt-4 text-display">Settings</h1>
        <p className="mt-5 max-w-sm text-lede text-muted">How you appear to other readers on your public shelf.</p>
        <Link
          href={`/u/${user.username}`}
          className="mt-8 inline-block border-b border-ink/30 pb-1 text-[0.72rem] uppercase tracking-[0.22em] hover:border-ink"
        >
          View your shelf
        </Link>
      </div>

      <form onSubmit={onSubmit} className="max-w-xl space-y-9 md:pt-4" onChange={() => state === "saved" && setState("idle")}>
        <Field label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <TextArea label="Bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A line about what you collect" />
        <div className="grid gap-9 sm:grid-cols-2">
          <Field label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Field label="Website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </div>
        <FormError message={error} />
        <div className="flex items-center gap-6">
          <Button type="submit" disabled={state === "saving"}>
            {state === "saving" ? "Saving…" : "Save changes"}
          </Button>
          <p className="text-sm text-clay-deep" aria-live="polite">
            {state === "saved" ? "Saved." : ""}
          </p>
        </div>
      </form>
    </div>
  );
}
