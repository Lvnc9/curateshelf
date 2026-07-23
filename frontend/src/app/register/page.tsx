"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, username || undefined);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 pt-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Join CurateShelf</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
          placeholder="Email"
          required
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
          placeholder="Username (optional)"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
          placeholder="Password (min 8)"
          minLength={8}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="w-full bg-[var(--ink)] py-3 text-[var(--paper)]">
          Create account
        </button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}