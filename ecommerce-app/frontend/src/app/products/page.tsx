import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import { flattenCategories, getCategoryTree, getProducts } from '@/lib/store-data';

type SearchParams = Record<string, string | string[] | undefined>;

function readFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function readArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return [value];
}

function toPositiveInt(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function createQueryString(searchParams: SearchParams, page: number) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          params.append(key, item);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  params.set('page', String(page));

  return `/products?${params.toString()}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const page = toPositiveInt(readFirst(filters.page), 1);
  const limit = toPositiveInt(readFirst(filters.limit), 12);
  const minPrice = readFirst(filters.minPrice);
  const maxPrice = readFirst(filters.maxPrice);
  const sort = readFirst(filters.sort) || 'newest';
  const inStock = readFirst(filters.inStock) === 'true';
  const rating = readFirst(filters.rating);
  const selectedCategories = readArray(filters.category);

  const [categoryTree, products] = await Promise.all([
    getCategoryTree(),
    getProducts({
      page,
      limit,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort,
      inStock: inStock || undefined,
      category: selectedCategories[0] ?? undefined,
    }),
  ]);

  const categories = flattenCategories(categoryTree).slice(0, 10);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-2xl border border-outline bg-panel p-5 lg:sticky lg:top-24">
        <h1 className="font-display text-2xl font-semibold text-fg">Filters</h1>

        <form className="mt-5 space-y-5" method="GET" action="/products">
          <div className="space-y-2">
            <label htmlFor="minPrice" className="text-xs uppercase tracking-wide text-muted">
              Min price
            </label>
            <input
              id="minPrice"
              name="minPrice"
              type="number"
              defaultValue={minPrice}
              className="h-10 w-full rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="maxPrice" className="text-xs uppercase tracking-wide text-muted">
              Max price
            </label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              defaultValue={maxPrice || '50000'}
              className="h-10 w-full rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
            <input
              type="range"
              min="100"
              max="100000"
              step="100"
              name="maxPrice"
              defaultValue={maxPrice || '50000'}
              className="w-full accent-[var(--brand)]"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted">Categories</p>
            <div className="space-y-2">
              {categories.length ? (
                categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 text-sm text-fg">
                    <input
                      type="checkbox"
                      name="category"
                      value={category.slug}
                      defaultChecked={selectedCategories.includes(category.slug)}
                      className="h-4 w-4 rounded border-outline accent-[var(--brand)]"
                    />
                    {category.name}
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted">No categories available yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted">Rating</p>
            {[4, 3, 2].map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm text-fg">
                <input
                  type="radio"
                  name="rating"
                  value={String(value)}
                  defaultChecked={rating === String(value)}
                  className="h-4 w-4 border-outline accent-[var(--brand)]"
                />
                {value} stars & up
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              name="inStock"
              value="true"
              defaultChecked={inStock}
              className="h-4 w-4 rounded border-outline accent-[var(--brand)]"
            />
            In stock only
          </label>

          <div className="space-y-2">
            <label htmlFor="sort" className="text-xs uppercase tracking-wide text-muted">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              className="h-10 w-full rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <input type="hidden" name="limit" value={String(limit)} />

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Apply
            </button>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2.5 text-sm font-semibold text-fg transition hover:border-fg/50"
            >
              Reset
            </Link>
          </div>
        </form>
      </aside>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Catalog</p>
            <h2 className="font-display text-3xl font-semibold text-fg">All Products</h2>
          </div>
          <p className="text-sm text-muted">{products.pagination.total} items found</p>
        </div>

        {(selectedCategories.length || minPrice || maxPrice || inStock || rating) && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <span key={category} className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">
                Category: {category}
              </span>
            ))}
            {minPrice ? (
              <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">Min: {minPrice}</span>
            ) : null}
            {maxPrice ? (
              <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">Max: {maxPrice}</span>
            ) : null}
            {inStock ? (
              <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">In stock</span>
            ) : null}
            {rating ? (
              <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">Rating {rating}+</span>
            ) : null}
          </div>
        )}

        {products.items.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products matched"
            description="Try adjusting filters or search for another category."
            ctaLabel="Clear Filters"
            ctaHref="/products"
          />
        )}

        <Pagination
          currentPage={products.pagination.page}
          totalPages={products.pagination.totalPages}
          buildHref={(nextPage) => createQueryString(filters, nextPage)}
        />
      </section>
    </div>
  );
}
