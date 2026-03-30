interface RatingStarsProps {
  rating: number;
  count?: number;
  className?: string;
}

function Star({ fill }: { fill: number }) {
  return (
    <span className="relative inline-block h-4 w-4 align-middle">
      <svg
        viewBox="0 0 20 20"
        className="absolute inset-0 h-4 w-4 text-outline"
        fill="currentColor"
      >
        <path d="M10 1.5l2.62 5.3 5.85.85-4.23 4.12 1 5.82L10 14.85l-5.24 2.74 1-5.82L1.53 7.65l5.85-.85L10 1.5z" />
      </svg>
      <span style={{ width: `${fill}%` }} className="absolute inset-y-0 left-0 overflow-hidden">
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 text-accent"
          fill="currentColor"
        >
          <path d="M10 1.5l2.62 5.3 5.85.85-4.23 4.12 1 5.82L10 14.85l-5.24 2.74 1-5.82L1.53 7.65l5.85-.85L10 1.5z" />
        </svg>
      </span>
    </span>
  );
}

export function RatingStars({ rating, count, className }: RatingStarsProps) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const raw = Math.max(0, Math.min(1, rating - index));
    return Math.round(raw * 100);
  });

  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <div className="inline-flex gap-1">
        {stars.map((fill, index) => (
          <Star key={index} fill={fill} />
        ))}
      </div>
      {count !== undefined ? <span className="text-xs text-muted">({count})</span> : null}
    </div>
  );
}
