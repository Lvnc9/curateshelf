"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/shadcn/sonner";

/**
 * App-wide client providers.
 * - ThemeProvider: toggles `.dark` on <html> (light / dark / system), persisted by next-themes.
 * - MotionConfig: framer-motion honours prefers-reduced-motion.
 * - Toaster: one sonner outlet for `toast()` calls anywhere in the app.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          {children}
          <Toaster position="bottom-center" />
        </AuthProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
