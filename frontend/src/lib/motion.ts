import type { Transition, Variants } from "framer-motion";

/** Shared motion language: slow, decelerating, never bouncy. Mirrors --ease-editorial in globals.css. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DURATION = {
  quick: 0.35,
  base: 0.7,
  slow: 1.1,
} as const;

export const transition = (duration: number = DURATION.base, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE,
});

/** Fade + short rise; use with `initial="hidden" whileInView="show"`. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: transition() },
};

/** Parent that staggers `rise` children. */
export const stagger = (step = 0.08, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
});
