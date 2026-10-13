import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Split-screen frame for sign in / register: masthead photograph with a pull quote
 * on the left (desktop only), a quiet paper form column on the right.
 */
export function AuthShell({
  eyebrow,
  title,
  lede,
  children,
  footer,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-[100dvh] md:grid-cols-[1.1fr_1fr]">
      <aside className="grain relative hidden overflow-hidden bg-night text-chalk md:block">
        <Image
          src="/editorial/masthead.jpg"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40" />
        <figure className="absolute inset-x-0 bottom-0 p-10 lg:p-14">
          <blockquote className="max-w-md font-display-italic text-[clamp(1.6rem,1.1rem+1.2vw,2.4rem)] leading-snug">
            &ldquo;Fewer things, chosen slowly, kept for a long time.&rdquo;
          </blockquote>
          <figcaption className="mt-5 text-eyebrow uppercase text-chalk/75">The CurateShelf editors</figcaption>
        </figure>
      </aside>

      <section className="flex flex-col justify-center px-5 pb-16 pt-28 sm:px-10 md:px-[clamp(2.5rem,6vw,6rem)]">
        <div className="w-full max-w-md">
          <p className="text-eyebrow uppercase text-muted">{eyebrow}</p>
          <h1 className="mt-4 text-title">{title}</h1>
          <p className="mt-4 text-lede text-muted">{lede}</p>
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-10 border-t border-hairline pt-6 text-sm text-muted">{footer}</div>}
        </div>
      </section>
    </div>
  );
}

/** Inline error message for auth forms; API errors arrive as raw JSON text, so keep it short. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  let text = message;
  try {
    const parsed = JSON.parse(message);
    text = parsed.detail || Object.values(parsed).flat().join(" ") || message;
  } catch {
    /* plain text */
  }
  return (
    <p role="alert" className="border-l-2 border-clay-deep pl-3 text-sm text-clay-deep">
      {String(text).slice(0, 200)}
    </p>
  );
}
