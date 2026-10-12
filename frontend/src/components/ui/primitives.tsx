import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Small tracked-uppercase label that sits above titles ("TABLEWARE · 3 MIN"). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-eyebrow font-normal uppercase text-muted ${className}`}>{children}</p>
  );
}

/** A 1px rule in the hairline colour. */
export function Hairline({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-hairline ${className}`} />;
}

type Variant = "solid" | "ghost" | "link";

const variants: Record<Variant, string> = {
  solid:
    "bg-ink text-paper px-7 py-3.5 hover:bg-ink-soft disabled:opacity-50",
  ghost:
    "border border-current/30 px-6 py-3 hover:border-current hover:bg-current/[0.04] disabled:opacity-50",
  link:
    "relative pb-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-[0.35] after:bg-current after:transition-transform after:duration-500 after:ease-editorial hover:after:scale-x-100",
};

const base =
  "inline-flex items-center justify-center gap-2 text-[0.75rem] font-normal uppercase tracking-[0.2em] transition-colors duration-300";

export function Button({
  variant = "solid",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "link",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

/** Underlined text field in the editorial style. */
export function Field({
  label,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-eyebrow uppercase text-muted">{label}</span>
      <input
        className="mt-2 block w-full border-0 border-b border-ink/25 bg-transparent px-0 py-2.5 text-lg font-light outline-none transition-colors placeholder:text-muted/60 focus:border-ink"
        {...props}
      />
    </label>
  );
}

export function TextArea({
  label,
  className = "",
  ...props
}: ComponentProps<"textarea"> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-eyebrow uppercase text-muted">{label}</span>
      <textarea
        className="mt-2 block w-full resize-y border-0 border-b border-ink/25 bg-transparent px-0 py-2.5 text-lg font-light outline-none transition-colors placeholder:text-muted/60 focus:border-ink"
        {...props}
      />
    </label>
  );
}
