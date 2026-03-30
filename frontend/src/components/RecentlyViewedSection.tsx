'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { EmptyState } from './EmptyState';
import type { Product } from '@/lib/types';

const RECENT_KEY = 'recently_viewed_products';

export function RecentlyViewedSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Product[];
      setProducts(parsed.slice(0, 8));
    } catch {
      window.localStorage.removeItem(RECENT_KEY);
    }
  }, []);

  if (!products.length) {
    return (
      <EmptyState
        title="No recently viewed products"
        description="Browse product pages and we will keep your history here for quick access."
        ctaLabel="Explore Catalog"
        ctaHref="/products"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
