interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 8 }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-outline bg-panel p-4 shadow-soft"
        >
          <div className="h-44 animate-pulse rounded-xl bg-muted/40" />
          <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-muted/40" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-muted/40" />
          <div className="mt-5 h-10 animate-pulse rounded-xl bg-muted/40" />
        </div>
      ))}
    </div>
  );
}
