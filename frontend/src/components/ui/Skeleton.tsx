/** Quiet shimmer block used in place of "Loading…" text. Size it with className. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden bg-paper-deep before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent ${className}`}
    />
  );
}

/** Grid of card-shaped skeletons matching ProductCard proportions. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="mt-4 h-2.5 w-1/3" />
          <Skeleton className="mt-3 h-5 w-3/4" />
        </div>
      ))}
    </div>
  );
}
