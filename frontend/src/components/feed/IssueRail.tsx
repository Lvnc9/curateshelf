"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/lib/motion";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Fixed reading-position indicator for the feed: "No. 03 / 08", a vertical
 * hairline progress track, and the current section. `surface` says what is behind it
 * (a photo or the paper page of a spread) so it can switch between paper and ink.
 * mix-blend-difference was tried first but disappears over mid-grey photos.
 */
export function IssueRail({
  current,
  total,
  section,
  surface,
  onJump,
}: {
  surface: "photo" | "paper";
  /** 0 = cover, 1..total = stories, total+1 = closing slide */
  current: number;
  total: number;
  section: string;
  onJump: (index: number) => void;
}) {
  const storyNumber = Math.min(Math.max(current, 1), total);
  const progress = current === 0 ? 0 : Math.min(current / total, 1);

  return (
    <div
      className={`pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-5 transition-[opacity,color] duration-500 md:flex md:right-8 ${
        current === 0 ? "opacity-0" : "opacity-100"
      } ${surface === "photo" ? "text-chalk [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]" : "text-ink"}`}
      aria-hidden={current === 0}
    >
      <p className="text-eyebrow tabular-nums [writing-mode:vertical-rl]">
        No. {pad(storyNumber)} / {pad(total)}
      </p>

      <div className="relative h-40 w-px bg-current/30">
        <div
          className="absolute inset-x-0 top-0 bg-current transition-[height] duration-700 ease-editorial"
          style={{ height: `${progress * 100}%` }}
        />
      </div>

      <div className="pointer-events-auto flex flex-col gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={current === 0 ? -1 : 0}
            onClick={() => onJump(i + 1)}
            aria-label={`Go to story ${i + 1}`}
            aria-current={current === i + 1 ? "step" : undefined}
            className="grid size-3 place-items-center"
          >
            <span
              className={`block rounded-full bg-current transition-all duration-500 ease-editorial ${
                current === i + 1 ? "size-1.5 opacity-100" : "size-1 opacity-40 hover:opacity-80"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="h-24 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={section}
            className="text-eyebrow uppercase [writing-mode:vertical-rl]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {section}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Compact counter for small screens (bottom-right). */
export function IssueCounter({ current, total }: { current: number; total: number }) {
  if (current === 0 || current > total) return null;
  return (
    <p className="pointer-events-none fixed bottom-6 right-5 z-40 text-eyebrow tabular-nums text-white mix-blend-difference md:hidden">
      {pad(current)} / {pad(total)}
    </p>
  );
}
