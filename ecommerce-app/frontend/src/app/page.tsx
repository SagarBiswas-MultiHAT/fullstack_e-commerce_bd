import Link from 'next/link';
import { CountdownTimer } from '@/components/CountdownTimer';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { flattenCategories, getCategoryTree, getProducts } from '@/lib/store-data';

const fallbackCategories = [
  { id: '1', name: 'Smartphones', slug: 'smartphones' },
  { id: '2', name: 'Home & Kitchen', slug: 'home-kitchen' },
  { id: '3', name: 'Fashion', slug: 'fashion' },
  { id: '4', name: 'Beauty', slug: 'beauty' },
  { id: '5', name: 'Sports', slug: 'sports' },
  { id: '6', name: 'Accessories', slug: 'accessories' },
];

export default async function HomePage() {
  const [categoryTree, trending, flashDeals] = await Promise.all([
    getCategoryTree(),
    getProducts({ sort: 'popular', limit: 12 }),
    getProducts({ sort: 'newest', limit: 3 }),
  ]);

  const categories = flattenCategories(categoryTree).slice(0, 6);
  const featuredCategories = categories.length ? categories : fallbackCategories;
  const flashTarget = new Date(Date.now() + 1000 * 60 * 60 * 9);

  return (
    <div className="space-y-14 pb-8">
      <section className="hero-mesh overflow-hidden rounded-3xl border border-outline p-8 shadow-soft lg:p-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand">Spring Campaign</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-fg md:text-5xl">
              Elevate your everyday cart with curated premium picks.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-muted">
              Limited-time markdowns across lifestyle, tech, and essentials with fast delivery and safe checkout.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-full bg-fg px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
              >
                Shop Collection
              </Link>
              <Link
                href="/search"
                className="rounded-full border border-outline bg-panel px-6 py-3 text-sm font-semibold text-fg transition hover:border-fg/50"
              >
                Explore by Search
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-outline bg-panel/90 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Orders Delivered</p>
              <p className="mt-2 font-display text-3xl font-semibold text-fg">150K+</p>
            </div>
            <div className="rounded-2xl border border-outline bg-panel/90 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Happy Customers</p>
              <p className="mt-2 font-display text-3xl font-semibold text-fg">98%</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-outline bg-panel/90 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Today Only</p>
              <p className="mt-2 text-lg font-semibold text-fg">Up to 40% OFF premium essentials</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Categories</p>
            <h2 className="font-display text-2xl font-semibold text-fg">Featured Picks</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-fg underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {featuredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="group rounded-2xl border border-outline bg-panel px-4 py-5 text-center transition hover:-translate-y-1 hover:border-fg/40"
            >
              <p className="text-sm font-semibold text-fg group-hover:text-brand">{category.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Popular</p>
            <h2 className="font-display text-2xl font-semibold text-fg">Trending Products</h2>
          </div>
          <Link href="/products?sort=popular" className="text-sm font-medium text-fg underline-offset-4 hover:underline">
            Browse popular
          </Link>
        </div>

        {trending.items.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Products are coming in"
            description="Catalog data is not available yet. Once products are added, this section updates automatically."
            ctaLabel="Go to catalog"
            ctaHref="/products"
          />
        )}
      </section>

      <section className="rounded-3xl border border-outline bg-panel p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Flash Deal</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-fg">Clock is ticking on these steals</h2>
          </div>
          <CountdownTimer targetTime={flashTarget} />
        </div>
        {flashDeals.items.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flashDeals.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand">For You</p>
          <h2 className="font-display text-2xl font-semibold text-fg">Recently Viewed</h2>
        </div>
        <RecentlyViewedSection />
      </section>
    </div>
  );
}
