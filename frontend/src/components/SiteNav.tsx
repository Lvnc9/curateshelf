"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function SiteNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const hideOnFeed = pathname === "/";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        hideOnFeed ? "bg-transparent text-[var(--paper)]" : "bg-[var(--ink)]/90 text-[var(--paper)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          CurateShelf
        </Link>
        <nav className="flex items-center gap-5 text-sm tracking-wide">
          <Link href="/explore" className="opacity-80 hover:opacity-100">
            Explore
          </Link>
          <Link href="/shelves" className="opacity-80 hover:opacity-100">
            Shelves
          </Link>
          {user ? (
            <>
              <Link href={`/u/${user.username}`} className="opacity-80 hover:opacity-100">
                {user.display_name || user.username}
              </Link>
              <button type="button" onClick={logout} className="opacity-60 hover:opacity-100">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-full border border-current/40 px-3 py-1 hover:bg-white/10">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}