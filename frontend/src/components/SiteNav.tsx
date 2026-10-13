"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { CloseIcon, MenuIcon } from "./ui/Icons";
import { ThemeToggle } from "./ThemeToggle";
import { EASE } from "@/lib/motion";

const LINKS = [
  { href: "/", label: "Issue" },
  { href: "/explore", label: "Explore" },
  { href: "/shelves", label: "Shelves" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Masthead navigation. Over the photo feed it is transparent and uses
 * mix-blend-difference so it stays legible on both dark photos and paper spreads.
 * Everywhere else it is a frosted paper bar with a hairline rule.
 */
export function SiteNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const onFeed = pathname === "/";

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const profileHref = user ? `/u/${user.username}` : "/login";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 ${
          onFeed
            ? "text-white mix-blend-difference"
            : "border-b border-hairline bg-paper/85 text-ink backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 md:h-[4.5rem] md:px-10">
          <Link href="/" className="font-display text-[1.6rem] leading-none tracking-tight" aria-label="CurateShelf home">
            Curate<span className="font-display-italic">Shelf</span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-1 text-[0.72rem] uppercase tracking-[0.22em] transition-opacity after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-500 after:ease-editorial ${
                    active ? "after:scale-x-100" : "opacity-70 after:scale-x-0 hover:opacity-100 hover:after:scale-x-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <ThemeToggle className="-mx-2 opacity-70" />
            <span className="h-4 w-px bg-current opacity-25" aria-hidden />
            {user ? (
              <>
                <Link
                  href={profileHref}
                  className="flex items-center gap-2.5 text-[0.72rem] uppercase tracking-[0.22em] opacity-80 hover:opacity-100"
                >
                  <span className="grid size-7 place-items-center rounded-full border border-current/40 font-display text-sm normal-case tracking-normal">
                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                  </span>
                  {user.display_name || user.username}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-[0.72rem] uppercase tracking-[0.22em] opacity-55 hover:opacity-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-current/40 px-4 py-2 text-[0.72rem] uppercase tracking-[0.22em] transition hover:border-current"
              >
                Sign in
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle className="opacity-80" />
          <button
            type="button"
            className="-mr-2 grid size-10 place-items-center md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <MenuIcon className="size-6" />
          </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            className="fixed inset-0 z-[60] flex flex-col bg-paper px-5 pb-10 text-ink md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-16 items-center justify-between">
              <span className="font-display text-[1.6rem] leading-none">
                Curate<span className="font-display-italic">Shelf</span>
              </span>
              <button type="button" className="-mr-2 grid size-10 place-items-center" onClick={() => setOpen(false)} aria-label="Close menu">
                <CloseIcon className="size-6" />
              </button>
            </div>
            <nav className="mt-10 flex flex-col" aria-label="Primary">
              {[...LINKS, { href: profileHref, label: user ? "Your shelf" : "Sign in" }].map((l, i) => (
                <motion.div
                  key={l.href + l.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 + i * 0.06, ease: EASE }}
                >
                  <Link
                    href={l.href}
                    className="flex items-baseline justify-between border-b border-hairline py-5 font-display text-4xl font-light"
                  >
                    {l.label}
                    <span className="text-eyebrow text-muted">{String(i + 1).padStart(2, "0")}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            {user && (
              <button type="button" onClick={logout} className="mt-auto self-start text-eyebrow uppercase text-muted">
                Sign out
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
