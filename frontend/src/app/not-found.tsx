import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';

export default function NotFoundPage() {
  return (
    <section className="mx-auto grid max-w-3xl gap-6 rounded-3xl border border-outline bg-panel p-8 shadow-soft">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-brand">404</p>
        <h1 className="font-display text-4xl font-semibold text-fg">This page stepped out of the catalog.</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted">
          The route may have moved, expired, or never existed. Search the store below or head back to the homepage.
        </p>
      </div>

      <SearchBar />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          prefetch={true}
          className="rounded-full bg-fg px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          prefetch={true}
          className="rounded-full border border-outline px-6 py-3 text-sm font-semibold text-fg transition hover:border-fg/50"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}
