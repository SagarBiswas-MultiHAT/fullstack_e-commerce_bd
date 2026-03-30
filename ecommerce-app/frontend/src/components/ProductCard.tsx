'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCart } from '@/context/cart.context';
import { PriceDisplay } from './PriceDisplay';
import { RatingStars } from './RatingStars';
import { StockBadge } from './StockBadge';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

function productRating(product: Product) {
  const reviews = product.reviews ?? [];
  if (!reviews.length) {
    return { rating: 0, count: 0 };
  }

  const sum = reviews.reduce((total, review) => total + Number(review.rating || 0), 0);
  return {
    rating: sum / reviews.length,
    count: reviews.length,
  };
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const [isWishlisted, setWishlisted] = useState(false);
  const { rating, count } = useMemo(() => productRating(product), [product]);

  return (
    <article className="group overflow-hidden rounded-2xl border border-outline bg-panel shadow-soft transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="block">
          <Image
            src={product.images[0] ?? '/images/placeholder-product.svg'}
            alt={product.title}
            width={600}
            height={480}
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        </Link>
        <button
          type="button"
          aria-label="Toggle wishlist"
          onClick={() => setWishlisted((current) => !current)}
          className={[
            'absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition',
            isWishlisted
              ? 'border-danger bg-danger text-danger-foreground'
              : 'border-outline bg-panel/85 text-fg hover:border-fg',
          ].join(' ')}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M12.1 20.3l-1.1-1C5.1 14 2 11.2 2 7.9A4.9 4.9 0 0 1 6.9 3c1.9 0 3.7.9 4.8 2.4A6.2 6.2 0 0 1 16.5 3 4.9 4.9 0 0 1 21.4 7.9c0 3.3-3.1 6.1-8.9 11.4l-.4.4z" />
          </svg>
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <Link href={`/products/${product.slug}`} className="line-clamp-2 text-base font-semibold text-fg hover:text-brand">
            {product.title}
          </Link>
          <PriceDisplay price={product.price} discountPrice={product.discountPrice} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <RatingStars rating={rating} count={count} />
          <StockBadge stock={product.stock} />
        </div>
        <button
          type="button"
          onClick={() => addItem(product, 1)}
          disabled={product.stock <= 0}
          className="w-full rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
