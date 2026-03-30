import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-outline bg-panel px-6 py-12 text-center">
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-bg-elevated text-muted">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16" r="0.8" fill="currentColor" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-fg">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg transition hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
