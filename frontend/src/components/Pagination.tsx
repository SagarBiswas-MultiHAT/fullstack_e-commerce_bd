import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

function PageButton({
  href,
  label,
  active = false,
  disabled = false,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const className = [
    'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition',
    active
      ? 'border-fg bg-fg text-bg'
      : 'border-outline bg-panel text-fg hover:border-fg/50 hover:bg-bg-elevated',
    disabled ? 'pointer-events-none opacity-40' : '',
  ].join(' ');

  return (
    <Link href={href} aria-disabled={disabled} className={className}>
      {label}
    </Link>
  );
}

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination">
      <PageButton
        href={buildHref(Math.max(1, currentPage - 1))}
        label="Prev"
        disabled={currentPage <= 1}
      />
      {start > 1 ? (
        <>
          <PageButton href={buildHref(1)} label="1" />
          {start > 2 ? <span className="px-1 text-muted">...</span> : null}
        </>
      ) : null}
      {pages.map((page) => (
        <PageButton key={page} href={buildHref(page)} label={String(page)} active={page === currentPage} />
      ))}
      {end < totalPages ? (
        <>
          {end < totalPages - 1 ? <span className="px-1 text-muted">...</span> : null}
          <PageButton href={buildHref(totalPages)} label={String(totalPages)} />
        </>
      ) : null}
      <PageButton
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        label="Next"
        disabled={currentPage >= totalPages}
      />
    </nav>
  );
}
