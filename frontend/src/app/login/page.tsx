"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("reader@curateshelf.local");
  const [password, setPassword] = useState("reader12345");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 pt-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Sign in</h1>
      <p className="mt-2 text-[var(--muted)]">Continue your shelf of loves and curiosities.</p>
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[var(--ink)]/20 bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
          placeholder="Password"
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="w-full bg-[var(--ink)] py-3 text-[var(--paper)]">
          Sign in
        </button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">
        New here?{" "}
        <Link href="/register" className="underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}