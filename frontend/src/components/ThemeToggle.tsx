"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./ui/Icons";

/** One-tap light ⇄ dark switch for the nav. The full Light / Dark / System choice lives in the user menu. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={`grid size-9 place-items-center rounded-full transition-opacity hover:opacity-100 ${className}`}
    >
      {/* Render a stable icon until mounted to avoid a hydration mismatch */}
      {dark ? <SunIcon className="size-[1.1rem]" /> : <MoonIcon className="size-[1.1rem]" />}
    </button>
  );
}
