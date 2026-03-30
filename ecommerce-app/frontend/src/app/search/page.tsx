import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { ProductCard } from '@/components/ProductCard';
import {
  flattenCategories,
  getCategoryTree,
  searchProducts,
} from '@/lib/store-data';
import type { Product } from '@/lib/types';

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

  return value ? [value] : [];
}

function toInt(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function buildHref(searchParams: SearchParams, page: number) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) {
          params.append(key, entry);
        }
      }
      continue;
    }

    if (value) {
      params.set(key, value);
    }
  }

  params.set('page', String(page));

  return `/search?${params.toString()}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;

  const q = readFirst(query.q).trim();
  const selectedCategories = readArray(query.category);
  const minPrice = readFirst(query.minPrice);
  const maxPrice = readFirst(query.maxPrice);
  const ratingFilter = readFirst(query.rating);
  const sort = readFirst(query.sort) || 'newest';
  const inStock = readFirst(query.inStock) === 'true';
  const page = toInt(readFirst(query.page), 1);
  const limit = toInt(readFirst(query.limit), 12);
  const firstCategory = selectedCategories[0] ?? undefined;

  const [tree, result] = await Promise.all([
    getCategoryTree(),
    searchProducts({
      q,
      page,
      limit,
      sort,
      category: firstCategory,
      inStock: inStock || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      rating: ratingFilter || undefined,
    }),
  ]);

  const categories = flattenCategories(tree).slice(0, 10);

  const products: Product[] = result.items.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    price: item.price,
    discountPrice: item.discountPrice,
    stock: item.stock,
    images: item.images,
    isActive: item.isActive,
    categoryId: item.categoryId,
    category: item.category,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    reviews: [],
  }));

  const total = result.pagination.total;
  const currentPage = result.pagination.page;
  const totalPages = result.pagination.totalPages;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-2xl border border-outline bg-panel p-5 lg:sticky lg:top-24">
        <h1 className="font-display text-2xl font-semibold text-fg">Search Filters</h1>
        <form className="mt-5 space-y-5" method="GET" action="/search">
          <div className="space-y-2">
            <label htmlFor="q" className="text-xs uppercase tracking-wide text-muted">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={readFirst(query.q)}
              placeholder="Find your item"
              className="h-10 w-full rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
          </div>

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
            {categories.map((category) => (
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
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted">Rating</p>
            {[4, 3, 2].map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm text-fg">
                <input
                  type="radio"
                  name="rating"
                  value={String(value)}
                  defaultChecked={ratingFilter === String(value)}
                  className="h-4 w-4 accent-[var(--brand)]"
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
              className="flex-1 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg"
            >
              Apply
            </button>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2.5 text-sm font-semibold text-fg"
            >
              Reset
            </Link>
          </div>
        </form>
      </aside>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-brand">Search</p>
          <h2 className="font-display text-3xl font-semibold text-fg">
            Results for {q ? `"${q}"` : 'all products'}
          </h2>
          <p className="text-sm text-muted">{total} results found</p>
        </div>

        {(q || selectedCategories.length || minPrice || maxPrice || inStock || ratingFilter) && (
          <div className="flex flex-wrap gap-2">
            {q ? <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">Query: {q}</span> : null}
            {selectedCategories.map((category) => (
              <span key={category} className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">
                Category: {category}
              </span>
            ))}
            {minPrice ? <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">Min: {minPrice}</span> : null}
            {maxPrice ? <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">Max: {maxPrice}</span> : null}
            {inStock ? <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">In stock</span> : null}
            {ratingFilter ? (
              <span className="rounded-full bg-bg-elevated px-3 py-1 text-xs text-muted">Rating {ratingFilter}+</span>
            ) : null}
          </div>
        )}

        {products.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching products"
            description="Try changing your search keyword or clear some filters."
            ctaLabel="Browse catalog"
            ctaHref="/products"
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={(nextPage) => buildHref(query, nextPage)}
        />
      </section>
    </div>
  );
}
