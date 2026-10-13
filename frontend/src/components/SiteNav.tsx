"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/shadcn/sheet";
import { MenuIcon } from "./ui/Icons";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/", label: "Issue" },
  { href: "/explore", label: "Explore" },
  { href: "/shelves", label: "Shelves" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const navText = "text-[0.72rem] uppercase tracking-[0.22em]";

/**
 * Masthead navigation. Over the photo feed it is transparent and uses
 * mix-blend-difference so it stays legible on both dark photos and paper spreads.
 * Everywhere else it is a frosted paper bar with a hairline rule.
 *
 * Right-hand slots (desktop): primary links · [search] · [bell] · theme · account.
 * Mobile: [search] · [bell] · menu sheet (Radix Dialog: focus trap, Esc, scroll lock).
 */
export function SiteNav({ search, bell }: { search?: React.ReactNode; bell?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const onFeed = pathname === "/";

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 ${
        onFeed ? "text-white mix-blend-difference" : "border-b border-hairline bg-paper/85 text-ink backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 md:h-[4.5rem] md:px-10">
        <Link href="/" className="font-display text-[1.6rem] leading-none tracking-tight" aria-label="CurateShelf home">
          Curate<span className="font-display-italic">Shelf</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 ${navText} transition-opacity after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-500 after:ease-editorial ${
                  active ? "after:scale-x-100" : "opacity-70 after:scale-x-0 hover:opacity-100 hover:after:scale-x-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <span className="h-4 w-px bg-current opacity-25" aria-hidden />
          <div className="flex items-center gap-1">
            {search}
            {user && bell}
            <ThemeToggle className="opacity-70" />
          </div>
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/login" className={`rounded-full border border-current/40 px-4 py-2 ${navText} transition hover:border-current`}>
              Sign in
            </Link>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-0.5 md:hidden">
          {search}
          {user && bell}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="-mr-2 grid size-10 place-items-center" aria-label="Open menu">
              <MenuIcon className="size-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full border-l border-hairline px-5 pb-8 pt-5 sm:max-w-sm">
              <SheetTitle className="font-display text-[1.6rem] leading-none">
                Curate<span className="font-display-italic">Shelf</span>
              </SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>

              <nav className="mt-8 flex flex-col" aria-label="Primary">
                {[
                  ...LINKS,
                  ...(user
                    ? [
                        { href: `/u/${user.username}`, label: "Your shelf" },
                        { href: "/settings", label: "Settings" },
                      ]
                    : [{ href: "/login", label: "Sign in" }]),
                ].map((l, i) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={isActive(pathname, l.href) ? "page" : undefined}
                    className="flex items-baseline justify-between border-b border-hairline py-4 font-display text-[2rem] font-light"
                  >
                    {l.label}
                    <span className="text-eyebrow text-muted">{String(i + 1).padStart(2, "0")}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-8">
                <p className="text-eyebrow uppercase text-muted">Theme</p>
                <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={theme === t}
                      onClick={() => setTheme(t)}
                      className={`rounded-full border py-2 ${navText} ${
                        theme === t ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink-soft"
                      }`}
                    >
                      {t === "system" ? "Auto" : t}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    toast("Signed out", { description: "See you in the next issue." });
                  }}
                  className={`mt-auto self-start ${navText} text-muted`}
                >
                  Sign out
                </button>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
