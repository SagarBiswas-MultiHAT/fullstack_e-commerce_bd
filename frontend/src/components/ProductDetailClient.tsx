'use client';

import Image from 'next/image';
import { SideBySideMagnifier } from 'react-image-magnifiers';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiDelete, apiPost } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Product, Review } from '@/lib/types';
import { useCart } from '@/context/cart.context';
import { EmptyState } from './EmptyState';
import { PriceDisplay } from './PriceDisplay';
import { RatingStars } from './RatingStars';
import { StockBadge } from './StockBadge';

const RECENT_KEY = 'recently_viewed_products';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

function averageRating(reviews: Review[]) {
  if (!reviews.length) {
    return 0;
  }

  const sum = reviews.reduce((total, review) => total + Number(review.rating), 0);
  return sum / reviews.length;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-sm font-medium transition',
        active ? 'bg-fg text-bg' : 'bg-bg-elevated text-muted hover:text-fg',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(product.images[0] ?? '/images/placeholder-product.svg');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Charcoal');
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [wishlistState, setWishlistState] = useState<'idle' | 'loading' | 'added'>('idle');

  const reviews = product.reviews ?? [];
  const rating = averageRating(reviews);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const existing = raw ? (JSON.parse(raw) as Product[]) : [];
      const merged = [product, ...existing.filter((item) => item.id !== product.id)].slice(0, 12);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(merged));
    } catch {
      window.localStorage.removeItem(RECENT_KEY);
    }
  }, [product]);

  const ratingBreakdown = useMemo(() => {
    const map = new Map<number, number>();
    for (let level = 1; level <= 5; level += 1) {
      map.set(level, 0);
    }

    for (const review of reviews) {
      const score = Math.max(1, Math.min(5, Math.round(Number(review.rating))));
      map.set(score, (map.get(score) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([score, count]) => ({
        score,
        count,
        percent: reviews.length ? (count / reviews.length) * 100 : 0,
      }));
  }, [reviews]);

  const maxQuantity = Math.max(1, product.stock);

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-outline bg-panel p-4">
            <SideBySideMagnifier
              imageSrc={activeImage}
              largeImageSrc={activeImage}
              alwaysInPlace={false}
              fillAvailableSpace
              overlayOpacity={0.2}
              className="max-h-[520px]"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(product.images.length ? product.images : ['/images/placeholder-product.svg']).map((image) => (
              <button
                type="button"
                key={image}
                onClick={() => setActiveImage(image)}
                className={[
                  'overflow-hidden rounded-xl border bg-panel p-1 transition',
                  activeImage === image ? 'border-fg' : 'border-outline hover:border-fg/60',
                ].join(' ')}
              >
                <Image
                  src={image}
                  alt={product.title}
                  width={200}
                  height={160}
                  className="h-20 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-brand">{product.category?.name ?? 'Featured Item'}</p>
          <h1 className="font-display text-3xl font-semibold text-fg lg:text-4xl">{product.title}</h1>

          <div className="flex items-center gap-4">
            <RatingStars rating={rating} count={reviews.length} />
            <StockBadge stock={product.stock} />
          </div>

          <PriceDisplay price={product.price} discountPrice={product.discountPrice} className="text-2xl" />

          <p className="text-sm leading-7 text-muted">
            {product.description ?? 'Designed with premium materials for all-day comfort and consistent performance.'}
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={[
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      selectedSize === size
                        ? 'border-fg bg-fg text-bg'
                        : 'border-outline bg-panel text-fg hover:border-fg/50',
                    ].join(' ')}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Color</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Charcoal', 'Sand', 'Ocean'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={[
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      selectedColor === color
                        ? 'border-fg bg-fg text-bg'
                        : 'border-outline bg-panel text-fg hover:border-fg/50',
                    ].join(' ')}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="quantity" className="text-sm text-muted">
              Qty
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(event) => {
                const raw = Number(event.target.value);
                setQuantity(Number.isFinite(raw) ? Math.min(Math.max(1, raw), maxQuantity) : 1);
              }}
              className="h-11 w-24 rounded-xl border border-outline bg-panel px-3 text-center text-sm text-fg"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => addItem(product, quantity)}
              disabled={product.stock <= 0}
              className="rounded-xl bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={async () => {
                setWishlistState('loading');
                try {
                  if (wishlistState === 'added') {
                    await apiDelete(`/store/wishlist/${product.id}`);
                    setWishlistState('idle');
                    return;
                  }

                  await apiPost(`/store/wishlist/${product.id}`);
                  setWishlistState('added');
                } catch {
                  setWishlistState('idle');
                }
              }}
              className="rounded-xl border border-outline bg-panel px-5 py-3 text-sm font-semibold text-fg transition hover:border-fg/50"
            >
              {wishlistState === 'loading'
                ? 'Updating...'
                : wishlistState === 'added'
                  ? 'Added to Wishlist'
                  : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-outline bg-panel p-6">
        <div className="flex flex-wrap gap-2">
          <TabButton active={activeTab === 'description'} onClick={() => setActiveTab('description')}>
            Description
          </TabButton>
          <TabButton active={activeTab === 'specs'} onClick={() => setActiveTab('specs')}>
            Specs
          </TabButton>
          <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
            Reviews
          </TabButton>
        </div>

        {activeTab === 'description' ? (
          <p className="text-sm leading-7 text-muted">
            {product.description ??
              'A premium build quality item with thoughtful ergonomics, balanced performance, and clean design language for everyday use.'}
          </p>
        ) : null}

        {activeTab === 'specs' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-outline bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Material</p>
              <p className="mt-1 text-sm font-medium text-fg">Premium Composite</p>
            </div>
            <div className="rounded-xl border border-outline bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Warranty</p>
              <p className="mt-1 text-sm font-medium text-fg">12 Months</p>
            </div>
            <div className="rounded-xl border border-outline bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Shipping</p>
              <p className="mt-1 text-sm font-medium text-fg">Nationwide 2-4 days</p>
            </div>
            <div className="rounded-xl border border-outline bg-bg-elevated p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Returns</p>
              <p className="mt-1 text-sm font-medium text-fg">7-day replacement</p>
            </div>
          </div>
        ) : null}

        {activeTab === 'reviews' ? (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-outline bg-bg-elevated p-5">
              <p className="font-display text-4xl font-semibold text-fg">{rating.toFixed(1)}</p>
              <RatingStars rating={rating} count={reviews.length} className="mt-2" />
              <div className="mt-4 space-y-2">
                {ratingBreakdown.map((row) => (
                  <div key={row.score} className="grid grid-cols-[36px_1fr_30px] items-center gap-2 text-xs">
                    <span className="text-muted">{row.score}★</span>
                    <div className="h-2 rounded-full bg-outline">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${row.percent}%` }} />
                    </div>
                    <span className="text-muted">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {reviews.length ? (
                reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-outline bg-bg-elevated p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-fg">{review.customer?.name ?? 'Verified Buyer'}</p>
                      <RatingStars rating={review.rating} />
                    </div>
                    <p className="mt-2 text-sm text-muted">{review.body || 'Great quality and quick delivery.'}</p>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No reviews yet"
                  description="Be the first to review this product after purchase."
                />
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Related</p>
            <h2 className="font-display text-2xl font-semibold text-fg">You Might Also Like</h2>
          </div>
        </div>

        {relatedProducts.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <a
                key={item.id}
                href={`/products/${item.slug}`}
                className="group overflow-hidden rounded-2xl border border-outline bg-panel transition hover:-translate-y-1"
              >
                <Image
                  src={item.images[0] ?? '/images/placeholder-product.svg'}
                  alt={item.title}
                  width={420}
                  height={300}
                  className="h-36 w-full object-cover"
                />
                <div className="space-y-1 p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-fg group-hover:text-brand">{item.title}</p>
                  <p className="text-sm text-muted">{formatCurrency(item.discountPrice ?? item.price)}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No related products right now"
            description="Check back soon for more options in this category."
            ctaLabel="Browse all"
            ctaHref="/products"
          />
        )}
      </section>
    </div>
  );
}
